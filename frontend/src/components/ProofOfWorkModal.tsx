import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  Cpu,
  Sparkles,
  Award,
} from 'lucide-react'
import {
  api,
  ProofOfWorkResponse,
} from '../services/api'

interface ProofOfWorkModalProps {
  resumeId: string
  displayName: string
  isOpen: boolean
  onClose: () => void
}

export default function ProofOfWorkModal({
  resumeId,
  displayName,
  isOpen,
  onClose,
}: ProofOfWorkModalProps) {
  const [data, setData] = useState<ProofOfWorkResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repoInput, setRepoInput] = useState('')
  const [copiedType, setCopiedType] = useState<'markdown' | 'html' | 'code' | null>(null)
  const [activeTab, setActiveTab] = useState<'skills' | 'architecture' | 'badges'>('skills')

  const loadProofOfWork = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getProofOfWork(resumeId)
      setData(res)
      setRepoInput(res.repoUrl || 'https://github.com/AxeyTech/ResumeIQ')
    } catch (err: any) {
      console.error('Failed to load Proof-of-Work:', err)
      setError(err?.message || 'Could not load Proof-of-Work data.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyNewRepo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!repoInput.trim()) return

    setVerifying(true)
    setError(null)
    try {
      const res = await api.verifyProofOfWork(resumeId, repoInput.trim())
      setData(res)
    } catch (err: any) {
      console.error('Failed to verify repository:', err)
      setError(err?.message || 'Could not verify repository.')
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    if (isOpen && resumeId) {
      loadProofOfWork()
    }
  }, [isOpen, resumeId])

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const copyToClipboard = (text: string, type: 'markdown' | 'html' | 'code') => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType((curr) => (curr === type ? null : curr)), 2200)
  }

  if (!isOpen) return null

  const getTierColor = (level: string) => {
    switch (level) {
      case 'GOLD_STANDARD':
        return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
      case 'SILVER_STANDARD':
        return 'text-g-blue border-g-blue/30 bg-g-blue/10'
      default:
        return 'text-amber-500 border-amber-500/30 bg-amber-500/10'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink-dark/70 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-canvas dark:bg-night-surface rounded-3xl border border-line dark:border-night-line shadow-2xl overflow-hidden z-10"
        >
          {/* Header Bar */}
          <div className="px-5 sm:px-7 py-4 border-b border-line dark:border-night-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas-deep/40 dark:bg-night-panel/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-g-green via-g-blue to-purple-600 text-white grid place-items-center shadow-glow-soft shrink-0">
                <Code2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink dark:text-moon">
                    GitHub Proof-of-Work Verification Engine
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 uppercase">
                    Code Verified
                  </span>
                </div>
                <p className="text-xs text-ink-soft dark:text-moon-soft truncate max-w-md">
                  Verifying claims for <span className="font-semibold text-g-blue">{displayName}</span> against real-world codebase evidence.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={loadProofOfWork}
                disabled={loading || verifying}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-ink-soft hover:text-ink dark:hover:text-moon border border-line dark:border-night-line flex items-center justify-center transition-colors"
                title="Refresh Proof-of-Work"
              >
                <RefreshCw size={16} className={loading || verifying ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-ink-soft hover:text-ink dark:hover:text-moon border border-line dark:border-night-line flex items-center justify-center transition-colors"
                title="Close modal (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Sub-Tabs Switcher */}
          <div className="px-5 sm:px-7 py-2.5 border-b border-line dark:border-night-line flex flex-wrap items-center justify-between gap-3 bg-canvas/60 dark:bg-night-surface/60 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('skills')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'skills'
                    ? 'bg-g-blue text-white shadow-sm'
                    : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
                }`}
              >
                <ShieldCheck size={13} />
                <span>Verified Skills ({data?.verifiedSkills.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'architecture'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
                }`}
              >
                <Cpu size={13} />
                <span>Architecture Signals ({data?.architectureSignals.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('badges')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'badges'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
                }`}
              >
                <Award size={13} />
                <span>Shareable Badge &amp; Credentials</span>
              </button>
            </div>

            {data && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(data.verificationCode, 'code')}
                  className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-canvas-deep dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon flex items-center gap-1.5 hover:border-g-blue/50 transition-all"
                  title="Click to copy verification code"
                >
                  <span>{data.verificationCode}</span>
                  {copiedType === 'code' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="opacity-40" />}
                </button>
              </div>
            )}
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw size={28} className="animate-spin text-g-blue mx-auto mb-3" />
                <h4 className="font-display font-semibold text-sm text-ink dark:text-moon mb-1">
                  Connecting to Codebase Verification Pipeline...
                </h4>
                <p className="text-xs text-ink-soft dark:text-moon-soft max-w-sm mx-auto">
                  Parsing repository tree, inspecting language shares, and proving engineering claims with cryptographic validation.
                </p>
              </div>
            ) : error || !data ? (
              <div className="p-8 text-center glass rounded-2xl border border-line dark:border-night-line">
                <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-ink-soft dark:text-moon-soft">{error || 'Could not load Proof-of-Work data.'}</p>
              </div>
            ) : (
              <>
                {/* Repository URL Inspector Bar */}
                <form
                  onSubmit={handleVerifyNewRepo}
                  className="p-3 sm:p-4 rounded-2xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-line dark:border-night-line flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs">
                    <GitBranch size={14} className="text-g-blue shrink-0" />
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="e.g. https://github.com/username/repository"
                      className="w-full bg-transparent outline-none text-ink dark:text-moon font-mono text-xs placeholder:text-ink-soft/50 dark:placeholder:text-moon-soft/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="btn-primary text-xs py-2 px-4 flex items-center justify-center gap-2 shrink-0 font-semibold disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Verify Codebase</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Hero Verification Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10.5px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${getTierColor(data.verificationLevel)}`}>
                        {data.verificationLevel.replace('_', ' ')}
                      </span>
                      <a
                        href={data.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-g-blue hover:underline flex items-center gap-1"
                      >
                        <span>{data.repoName}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <h4 className="font-display font-bold text-lg sm:text-xl text-ink dark:text-moon">
                      Proof-of-Work Verification Certificate
                    </h4>
                    <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed max-w-xl">
                      This certificate proves that claimed technical proficiencies are backed by real, inspectable production code and architectural artifacts in the connected repository.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-night-surface border border-line dark:border-night-line grid place-items-center text-center shadow-sm">
                      <span className="font-display font-bold text-xl text-g-blue">{data.overallPowScore}%</span>
                      <span className="text-[9px] uppercase font-bold text-ink-soft dark:text-moon-soft -mt-1">PoW Score</span>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* TAB 1: VERIFIED SKILLS                                    */}
                {/* ========================================================= */}
                {activeTab === 'skills' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-moon">
                        Skills Cross-Referenced Against Codebase
                      </span>
                      <span className="text-[11px] text-ink-soft dark:text-moon-soft">
                        {data.verifiedSkills.filter((s) => s.verificationTier === 'CRYPTOGRAPHICALLY_VERIFIED').length} Code-Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.verifiedSkills.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ink dark:text-moon flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>{item.skill}</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20">
                              {item.badgeLevel}
                            </span>
                          </div>

                          <p className="text-[11.5px] text-ink-soft dark:text-moon-soft leading-relaxed pl-4">
                            {item.evidenceSnippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: ARCHITECTURE SIGNALS                               */}
                {/* ========================================================= */}
                {activeTab === 'architecture' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-moon">
                        Repository Architectural Patterns Verified
                      </span>
                      <span className="text-[11px] text-ink-soft dark:text-moon-soft">
                        {data.architectureSignals.length} Signals Audited
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.architectureSignals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ink dark:text-moon flex items-center gap-1.5">
                              <Cpu size={14} className="text-purple-500 shrink-0" />
                              <span>{sig.signal}</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
                              {sig.confidence}% Confidence
                            </span>
                          </div>

                          <p className="text-[11.5px] text-ink-soft dark:text-moon-soft leading-relaxed pl-5">
                            {sig.proof}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: SHAREABLE BADGES & CREDENTIALS                     */}
                {/* ========================================================= */}
                {activeTab === 'badges' && (
                  <div className="space-y-5">
                    {/* GitHub README Badge Preview & Copy */}
                    <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-ink dark:text-moon flex items-center gap-1.5">
                            <Award size={14} className="text-g-green" />
                            <span>GitHub README Markdown Badge</span>
                          </h5>
                          <p className="text-[11px] text-ink-soft dark:text-moon-soft">
                            Paste this snippet at the top of your GitHub repository README.
                          </p>
                        </div>

                        <button
                          onClick={() => copyToClipboard(data.embedMarkdown || '', 'markdown')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-night-surface border border-line dark:border-night-line hover:border-g-blue/50 text-ink dark:text-moon flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          {copiedType === 'markdown' ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Markdown</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-ink-dark text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre scrollbar-none">
                        {data.embedMarkdown}
                      </div>
                    </div>

                    {/* HTML Portfolio Embed */}
                    <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold text-ink dark:text-moon flex items-center gap-1.5">
                            <Code2 size={14} className="text-g-blue" />
                            <span>HTML Portfolio Embed Snippet</span>
                          </h5>
                          <p className="text-[11px] text-ink-soft dark:text-moon-soft">
                            Embed into your personal developer portfolio or web resume.
                          </p>
                        </div>

                        <button
                          onClick={() => copyToClipboard(data.embedHtml || '', 'html')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-night-surface border border-line dark:border-night-line hover:border-g-blue/50 text-ink dark:text-moon flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          {copiedType === 'html' ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy HTML</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-ink-dark text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre scrollbar-none">
                        {data.embedHtml}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
