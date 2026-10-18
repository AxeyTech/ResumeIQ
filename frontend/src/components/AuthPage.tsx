import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Loader2, CheckCircle2, Mail, Lock, User, AlertCircle, ShieldCheck, RotateCw, AtSign, Check } from 'lucide-react'
import ScoreRing from './ScoreRing'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

type Mode = 'signin' | 'signup'
type Step = 'form' | 'otp' | 'success'
type Status = 'idle' | 'loading'

interface AuthPageProps {
  initialMode: Mode
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthPage({ initialMode, onClose, onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [step, setStep] = useState<Step>('form')
  const [status, setStatus] = useState<Status>('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [resending, setResending] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const { login, register, verifyEmail } = useAuth()

  // Debounced live check for username availability during signup
  useEffect(() => {
    if (mode !== 'signup') return
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      setUsernameStatus('idle')
      return
    }
    if (trimmed.length < 3 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(trimmed)
        if (res.available) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('taken')
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [username, mode])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('loading')

    try {
      if (mode === 'signup') {
        if (usernameStatus === 'taken') {
          setError('This username is already taken. Please choose another.')
          setStatus('idle')
          return
        }
        if (usernameStatus === 'invalid') {
          setError('Username must be 3-30 letters, numbers, or underscores.')
          setStatus('idle')
          return
        }
        const result = await register(
          name.trim(),
          email.trim(),
          password,
          username.trim() ? username.trim().toLowerCase() : undefined,
        )
        if (result.needsVerification) {
          setStep('otp')
        } else {
          setStep('success')
          if (onSuccess) setTimeout(() => { onSuccess(); onClose() }, 1200)
        }
      } else {
        await login(email.trim(), password)
        setStep('success')
        if (onSuccess) setTimeout(() => { onSuccess(); onClose() }, 1200)
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed.'
      // If email not verified on login, show OTP screen
      if (msg.includes('verify your email')) {
        setStep('otp')
      } else {
        setError(msg)
      }
    } finally {
      setStatus('idle')
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setOtpDigits(newDigits)
    const focusIdx = Math.min(pasted.length, 5)
    otpRefs.current[focusIdx]?.focus()
  }

  const submitOtp = async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    setError(null)
    setStatus('loading')
    try {
      await verifyEmail(email.trim(), code)
      setStep('success')
      if (onSuccess) setTimeout(() => { onSuccess(); onClose() }, 1200)
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check your code.')
    } finally {
      setStatus('idle')
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError(null)
    try {
      await api.resendVerification(email.trim())
      setOtpDigits(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err?.message || 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  const handleGoogleSignIn = () => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ??
      (typeof window !== 'undefined' && window.location.port === '5173'
        ? 'http://localhost:3000'
        : '')
    window.location.href = `${apiBase}/auth/google`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] bg-canvas dark:bg-night overflow-y-auto"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed top-6 right-6 z-10 grid place-items-center w-10 h-10 rounded-full glass
                   text-ink dark:text-moon hover:shadow-glow-blue transition-all duration-300 hover:rotate-90"
      >
        <X size={18} />
      </button>

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left: brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink dark:bg-night-deep p-14 text-moon">
          <div className="aurora-field opacity-60">
            <div className="aurora-blob w-[30vw] h-[30vw] bg-g-blue top-[-4%] left-[-6%]" />
            <div className="aurora-blob w-[26vw] h-[26vw] bg-g-green bottom-[6%] right-[-4%]" />
            <div className="aurora-blob w-[22vw] h-[22vw] bg-g-yellow bottom-[30%] left-[20%]" />
          </div>

          <a href="#top" onClick={onClose} className="relative z-10 flex items-center gap-2.5 font-body font-bold text-xl group">
            <img
              src="/logo-icon.png?v=9"
              alt="ResumeIQ Logo"
              className="w-7 h-7 rounded-full object-contain border border-white/10 group-hover:scale-105 transition-transform"
            />
            <span>Resume<span className="text-gradient">IQ</span></span>
          </a>

          <div className="relative z-10">
            <div className="mb-10 flex justify-start">
              <div className="rounded-2xl glass p-8 border-white/10">
                <ScoreRing to={92} size={140} strokeWidth={8} sublabel={'Was 47 \u2192 Now 92'} ringColor="#4285F4" />
              </div>
            </div>
            <h2 className="font-display font-semibold text-3xl leading-tight mb-4 max-w-sm">
              Every application deserves a fair read.
            </h2>
            <p className="text-moon-soft text-[15px] leading-relaxed max-w-sm">
              Join to save your resume history, track score improvements across
              versions, and get a fresh analysis any time you revise.
            </p>
          </div>

          <div className="relative z-10 font-ui text-[11px] tracking-widest2 uppercase text-moon-soft/50">
            &mdash; Built for people who are more than their formatting &mdash;
          </div>
        </div>

        {/* Right: form panel */}
        <div className="relative flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              {/* SUCCESS */}
              {step === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mx-auto mb-6 grid place-items-center w-16 h-16 rounded-full bg-g-gradient shadow-glow-blue"
                  >
                    <CheckCircle2 size={28} className="text-white" />
                  </motion.div>
                  <h3 className="font-display font-semibold text-2xl mb-2 text-ink dark:text-moon">
                    You&rsquo;re in.
                  </h3>
                  <p className="text-ink-soft dark:text-moon-soft text-sm mb-8">
                    Welcome to ResumeIQ. Redirecting you to your dashboard...
                  </p>
                  <button onClick={() => { if (onSuccess) onSuccess(); onClose() }} className="btn-glow mx-auto">
                    Go to Dashboard <ArrowRight size={15} />
                  </button>
                </motion.div>

              /* OTP VERIFICATION */
              ) : step === 'otp' ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <div className="mx-auto mb-5 grid place-items-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck size={28} className="text-emerald-500" />
                  </div>
                  <h1 className="font-display font-semibold text-2xl mb-2 text-ink dark:text-moon">
                    Verify your email
                  </h1>
                  <p className="text-ink-soft dark:text-moon-soft text-sm mb-2">
                    We sent a 6-digit code to
                  </p>
                  <p className="font-semibold text-ink dark:text-moon text-sm mb-8">
                    {email}
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
                    >
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* OTP Input Boxes */}
                  <div className="flex justify-center gap-1.5 sm:gap-3 mb-8 px-1" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border-2 border-line dark:border-night-line bg-white/70 dark:bg-night-panel/70 text-ink dark:text-moon
                                   focus:outline-none focus:border-g-blue focus:shadow-glow-soft transition-all duration-200"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <button
                    onClick={submitOtp}
                    disabled={status === 'loading' || otpDigits.join('').length !== 6}
                    className="btn-glow w-full justify-center mb-4 disabled:opacity-70"
                  >
                    {status === 'loading' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>Verify & Continue <ArrowRight size={15} /></>
                    )}
                  </button>

                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs text-ink-soft dark:text-moon-soft hover:text-g-blue transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : "Didn't get the code? Resend"}
                  </button>
                </motion.div>

              /* FORM */
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="eyebrow mb-5">
                    {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
                  </div>
                  <h1 className="font-display font-semibold text-3xl mb-2 text-ink dark:text-moon">
                    {mode === 'signin' ? 'Sign in to ResumeIQ' : 'Begin your review'}
                  </h1>
                  <p className="text-ink-soft dark:text-moon-soft text-sm mb-6">
                    {mode === 'signin'
                      ? 'Pick up right where you left off.'
                      : 'Create an account to save your progress.'}
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-3"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full mb-6 inline-flex items-center justify-center gap-3 rounded-full
                               border border-line dark:border-night-line bg-white dark:bg-night-panel
                               px-6 py-3.5 font-ui text-sm font-semibold text-ink dark:text-moon
                               transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
                  >
                    <GoogleG />
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-line dark:bg-night-line" />
                    <span className="font-ui text-[11px] uppercase tracking-wide text-ink-faint">or</span>
                    <div className="h-px flex-1 bg-line dark:bg-night-line" />
                  </div>

                  <form onSubmit={submit} className="space-y-4">
                    {mode === 'signup' && (
                      <>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                          <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name"
                            className="w-full rounded-full border border-line dark:border-night-line bg-white/70 dark:bg-night-panel/70
                                       pl-11 pr-4 py-3.5 font-ui text-sm text-ink dark:text-moon placeholder:text-ink-faint
                                       focus:outline-none focus:border-g-blue focus:shadow-glow-soft transition-all duration-300"
                          />
                        </div>

                        <div className="relative">
                          <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="username"
                            maxLength={30}
                            className={`w-full rounded-full border bg-white/70 dark:bg-night-panel/70
                                       pl-11 pr-24 py-3.5 font-ui text-sm text-ink dark:text-moon placeholder:text-ink-faint
                                       focus:outline-none transition-all duration-300 ${
                                         usernameStatus === 'taken'
                                           ? 'border-red-500 focus:border-red-500'
                                           : usernameStatus === 'available'
                                           ? 'border-emerald-500 focus:border-emerald-500'
                                           : 'border-line dark:border-night-line focus:border-g-blue focus:shadow-glow-soft'
                                       }`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs">
                            {usernameStatus === 'checking' && (
                              <span className="text-ink-faint flex items-center gap-1 text-[11px]">
                                <Loader2 size={12} className="animate-spin" />
                              </span>
                            )}
                            {usernameStatus === 'available' && (
                              <span className="text-emerald-500 font-medium flex items-center gap-1 text-[11px]">
                                <Check size={12} /> Available
                              </span>
                            )}
                            {usernameStatus === 'taken' && (
                              <span className="text-red-500 font-medium flex items-center gap-1 text-[11px]">
                                <X size={12} /> Taken
                              </span>
                            )}
                            {usernameStatus === 'invalid' && (
                              <span className="text-amber-500 text-[10px]">3-30 chars</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full rounded-full border border-line dark:border-night-line bg-white/70 dark:bg-night-panel/70
                                   pl-11 pr-4 py-3.5 font-ui text-sm text-ink dark:text-moon placeholder:text-ink-faint
                                   focus:outline-none focus:border-g-blue focus:shadow-glow-soft transition-all duration-300"
                      />
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min 8 characters)"
                        minLength={8}
                        className="w-full rounded-full border border-line dark:border-night-line bg-white/70 dark:bg-night-panel/70
                                   pl-11 pr-16 py-3.5 font-ui text-sm text-ink dark:text-moon placeholder:text-ink-faint
                                   focus:outline-none focus:border-g-blue focus:shadow-glow-soft transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 font-ui text-[11px] font-bold tracking-wide
                                   text-g-blue-dim dark:text-g-blue hover:text-g-blue-dim/70 dark:hover:text-g-blue/70
                                   transition-colors duration-200 select-none"
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="btn-glow w-full justify-center mt-2 disabled:opacity-70"
                    >
                      {status === 'loading' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          {mode === 'signin' ? 'Sign In' : 'Begin'} <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-[13px] text-ink-soft dark:text-moon-soft mt-8">
                    {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      onClick={() => {
                        setError(null)
                        setMode(mode === 'signin' ? 'signup' : 'signin')
                      }}
                      className="font-semibold text-ink dark:text-moon underline decoration-g-blue decoration-2 underline-offset-4 hover:text-g-blue-dim dark:hover:text-g-blue transition-colors"
                    >
                      {mode === 'signin' ? 'Begin' : 'Sign in'}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  )
}
