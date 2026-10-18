import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
  Send,
  HelpCircle,
  Award,
  Sliders,
  Check,
  TrendingUp
} from 'lucide-react'
import {
  api,
  ResumeItem,
  MockInterviewQuestion,
  MockInterviewEvaluationResult
} from '../services/api'

interface MockInterviewSimulatorProps {
  resume: ResumeItem
  jobDescriptionText?: string
  initialJobTitle?: string
}

type InterviewType = 'behavioral' | 'technical' | 'system_design'
type Difficulty = 'entry' | 'mid' | 'senior' | 'lead'

export default function MockInterviewSimulator({
  resume,
  jobDescriptionText = '',
  initialJobTitle = 'Senior Software Engineer'
}: MockInterviewSimulatorProps) {
  // Session Configuration State
  const [interviewType, setInterviewType] = useState<InterviewType>('behavioral')
  const [difficulty, setDifficulty] = useState<Difficulty>('senior')
  const [targetRole, setTargetRole] = useState(initialJobTitle)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  // Questions State
  const [questions, setQuestions] = useState<MockInterviewQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Answer & Evaluation State
  const [userAnswer, setUserAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<MockInterviewEvaluationResult | null>(null)
  const [completedEvaluations, setCompletedEvaluations] = useState<
    Array<{ question: MockInterviewQuestion; answer: string; evaluation: MockInterviewEvaluationResult }>
  >([])

  // Speech Recognition (Voice Input)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  // Speech Synthesis (Audio Readout)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoReadQuestions, setAutoReadQuestions] = useState(false)

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const timerRef = useRef<any>(null)

  // Context drawer toggle
  const [showContextWhy, setShowContextWhy] = useState(false)

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' '
          }
          setUserAnswer(currentTranscript.trim())
        }

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } catch (err) {
        console.warn('Speech recognition init failed', err)
        setSpeechSupported(false)
      }
    } else {
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Manage timer
  useEffect(() => {
    if (isSessionActive && !isEvaluating && !currentEvaluation && !isSessionComplete) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isSessionActive, isEvaluating, currentEvaluation, isSessionComplete])

  // Start Voice Listening
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setEvalError('Speech Recognition is not supported on this browser. Please type your answer directly.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to start speech recognition', err)
      }
    }
  }

  // Speak question aloud
  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    if (isSpeaking) {
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Start Interview Session
  const handleStartSession = async () => {
    try {
      setIsLoadingQuestions(true)
      setLoadError(null)

      const res = await api.getMockInterviewQuestions({
        resumeId: resume.id,
        interviewType,
        difficulty,
        jobTitle: targetRole,
        jobDescriptionText
      })

      if (!res.questions || res.questions.length === 0) {
        throw new Error('Failed to retrieve interview questions.')
      }

      setQuestions(res.questions)
      setCurrentQuestionIndex(0)
      setUserAnswer('')
      setCurrentEvaluation(null)
      setCompletedEvaluations([])
      setSecondsElapsed(0)
      setIsSessionActive(true)
      setIsSessionComplete(false)

      if (autoReadQuestions && res.questions[0]) {
        setTimeout(() => speakQuestion(res.questions[0].question), 400)
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to initialize mock interview.')
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // Submit Answer for AI STAR Evaluation
  const handleEvaluateAnswer = async () => {
    const trimmed = userAnswer.trim()
    if (trimmed.length < 5) {
      setEvalError('Please provide an answer (spoken or typed) of at least a few words.')
      return
    }

    // Stop recording and speaking if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }

    try {
      setIsEvaluating(true)
      setEvalError(null)
      const currentQ = questions[currentQuestionIndex]

      const evalResult = await api.evaluateMockInterviewAnswer({
        question: currentQ.question,
        category: currentQ.category,
        userAnswer: trimmed,
        interviewType,
        difficulty
      })

      setCurrentEvaluation(evalResult)
      setCompletedEvaluations((prev) => [
        ...prev,
        { question: currentQ, answer: trimmed, evaluation: evalResult }
      ])
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate answer. Please try again.')
    } finally {
      setIsEvaluating(false)
    }
  }

  // Advance to next question or complete session
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIdx = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIdx)
      setUserAnswer('')
      setCurrentEvaluation(null)
      setShowContextWhy(false)
      setSecondsElapsed(0)

      if (autoReadQuestions && questions[nextIdx]) {
        setTimeout(() => speakQuestion(questions[nextIdx].question), 400)
      }
    } else {
      setIsSessionComplete(true)
    }
  }

  // Reset / Exit Session
  const handleExitSession = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsSessionActive(false)
    setIsSessionComplete(false)
    setCurrentEvaluation(null)
  }

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Calculate final aggregate scores
  const calculateFinalAverage = () => {
    if (completedEvaluations.length === 0) return 0
    const sum = completedEvaluations.reduce((acc, curr) => acc + curr.evaluation.overallScore, 0)
    return Math.round(sum / completedEvaluations.length)
  }

  const currentQ = questions[currentQuestionIndex]

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line space-y-6">
      {/* ==================== 1. SESSION CONFIGURATION SCREEN ==================== */}
      {!isSessionActive && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line dark:border-night-line">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-g-blue/10 text-g-blue border border-g-blue/20">
                  <Mic size={13} /> Step 4: AI Mock Interview Simulator
                </span>
                <span className="text-xs text-ink-soft dark:text-moon-soft hidden sm:inline">
                  STAR Method & Recruiter Coaching
                </span>
              </div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink dark:text-moon">
                Interactive Voice & Text Mock Interview
              </h2>
              <p className="text-xs text-ink-soft dark:text-moon-soft mt-1">
                Simulate real technical and behavioral interviews with live speech-to-text, audio readouts, and deep STAR scoring.
              </p>
            </div>
          </div>

          {loadError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              {loadError}
            </div>
          )}

          {/* Config Controls */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Category Selector */}
            <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-3">
              <label className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                <Sliders size={14} className="text-g-blue" /> Interview Type
              </label>
              <div className="space-y-2">
                {[
                  { id: 'behavioral', label: 'Behavioral & Leadership', desc: 'Amazon LP, conflict resolution, ambiguity' },
                  { id: 'technical', label: 'Technical Deep-Dive', desc: 'System internals, database tuning, APIs' },
                  { id: 'system_design', label: 'System Design & Arch', desc: 'High-scale architectures, caching, sharding' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setInterviewType(type.id as InterviewType)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      interviewType === type.id
                        ? 'bg-g-blue/10 border-g-blue text-ink dark:text-moon shadow-sm'
                        : 'bg-white dark:bg-night-surface border-line dark:border-night-line text-ink-soft dark:text-moon-soft hover:border-g-blue/40'
                    }`}
                  >
                    <div className="font-bold">{type.label}</div>
                    <div className="text-[11px] opacity-75 mt-0.5">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role & Level */}
            <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink dark:text-moon block mb-1.5">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs font-medium text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink dark:text-moon block mb-1.5">
                  Seniority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'entry', label: 'Entry / Junior' },
                    { id: 'mid', label: 'Mid-Level' },
                    { id: 'senior', label: 'Senior Engineer' },
                    { id: 'lead', label: 'Staff / Lead' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficulty(lvl.id as Difficulty)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center ${
                        difficulty === lvl.id
                          ? 'bg-g-blue text-white border-g-blue shadow-sm'
                          : 'bg-white dark:bg-night-surface border-line dark:border-night-line text-ink-soft dark:text-moon-soft hover:border-g-blue/40'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-line dark:border-night-line">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-soft dark:text-moon-soft">
                  <input
                    type="checkbox"
                    checked={autoReadQuestions}
                    onChange={(e) => setAutoReadQuestions(e.target.checked)}
                    className="rounded border-line text-g-blue focus:ring-0"
                  />
                  <span>Auto-read questions aloud via AI voice</span>
                </label>
              </div>
            </div>

            {/* Preparation Highlights Card */}
            <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-ink dark:text-moon mb-2 flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" /> What to Expect
                </div>
                <ul className="text-xs text-ink-soft dark:text-moon-soft space-y-2 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>4 Real Interview Questions</strong> tailored directly from your resume.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Hands-Free Voice Mode</strong> with live speech-to-text transcript.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Instant STAR Evaluation</strong> on Situation, Action, Metrics, & Delivery.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>Top 1% Model Answer</strong> for every single question.</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleStartSession}
                disabled={isLoadingQuestions}
                className="w-full btn-glow text-xs py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoadingQuestions ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Preparing Interview Session...
                  </>
                ) : (
                  <>
                    <Play size={15} /> Enter Mock Interview Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. LIVE INTERVIEW SESSION ROOM ==================== */}
      {isSessionActive && !isSessionComplete && currentQ && (
        <div className="space-y-6">
          {/* Active Session Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line dark:border-night-line">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div className="text-xs font-bold uppercase tracking-wider text-ink dark:text-moon">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-g-blue/10 text-g-blue border border-g-blue/20">
                {currentQ.category}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-canvas-deep dark:bg-night-panel text-xs font-mono font-medium text-ink-soft dark:text-moon-soft border border-line dark:border-night-line">
                <Clock size={13} className="text-amber-500" />
                <span>{formatTime(secondsElapsed)}</span>
              </div>

              {/* Exit Session */}
              <button
                onClick={handleExitSession}
                className="text-xs text-ink-soft dark:text-moon-soft hover:text-red-500 transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-canvas-deep dark:bg-night-panel overflow-hidden">
            <div
              className="h-full bg-g-blue transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-line dark:border-night-line space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="text-xs uppercase font-bold tracking-wider text-g-blue">
                  Interviewer Question
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-ink dark:text-moon leading-snug">
                  &ldquo;{currentQ.question}&rdquo;
                </h3>
              </div>

              {/* Voice Readout Button */}
              <button
                type="button"
                onClick={() => speakQuestion(currentQ.question)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSpeaking
                    ? 'bg-amber-500/20 text-amber-600 border-amber-500/30 animate-pulse'
                    : 'bg-white dark:bg-night-surface border-line dark:border-night-line text-ink-soft dark:text-moon-soft hover:text-g-blue'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Listen to question aloud'}
              >
                {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            {/* Recruiter Intent Insight */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowContextWhy(!showContextWhy)}
                className="text-xs font-medium text-ink-soft dark:text-moon-soft hover:text-g-blue flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle size={13} />
                <span>{showContextWhy ? 'Hide Recruiter Insight' : 'Why recruiters ask this question'}</span>
              </button>

              {showContextWhy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-3.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs text-ink-soft dark:text-moon-soft space-y-1.5"
                >
                  <p className="leading-relaxed italic">{currentQ.contextWhyAsked}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="font-semibold text-ink dark:text-moon">Key signals evaluated:</span>
                    {currentQ.keyEvaluationCriteria.map((crit, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-canvas-deep/80 dark:bg-night-panel/80 text-[10.5px] border border-line dark:border-night-line font-medium"
                      >
                        {crit}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Answer Input Area (Shown before evaluation) */}
          {!currentEvaluation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                  <span>Your Spoken or Written Response</span>
                  <span className="text-[11px] font-normal text-ink-soft dark:text-moon-soft">
                    ({userAnswer.split(/\s+/).filter(Boolean).length} words)
                  </span>
                </div>

                {/* Voice Input Toggle Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon hover:border-g-blue'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff size={14} /> Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic size={14} className="text-g-blue" /> Speak Answer (Mic)
                      </>
                    )}
                  </button>
                )}
              </div>

              {evalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{evalError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvalError(null)}
                    className="text-xs hover:opacity-70 px-1 font-bold"
                  >
                    &times;
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={6}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening... Speak your answer clearly using the STAR method (Situation, Task, Action, Result)...'
                      : 'Type or speak your answer here. Include specific action verbs ("I architected...", "I refactored...") and quantified metrics (% latency gain, team hours saved)...'
                  }
                  className={`w-full p-4 rounded-2xl bg-white dark:bg-night-surface border text-xs sm:text-sm leading-relaxed text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none transition-colors ${
                    isListening ? 'border-red-400 dark:border-red-500' : 'border-line dark:border-night-line focus:border-g-blue'
                  }`}
                />
                {isListening && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live Voice Input
                  </div>
                )}
              </div>

              {/* STAR Helper Hint Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-soft dark:text-moon-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-g-blue">STAR Blueprint:</span>
                  <span className="px-2 py-0.5 rounded bg-canvas-deep/80 dark:bg-night-panel/80">
                    S: Context (20s)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-canvas-deep/80 dark:bg-night-panel/80">
                    T: Core Obstacle (20s)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-canvas-deep/80 dark:bg-night-panel/80">
                    A: What *I* Did (60s)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-canvas-deep/80 dark:bg-night-panel/80">
                    R: Quantified Metrics (30s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUserAnswer('')}
                    className="hover:underline opacity-70 hover:opacity-100"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleEvaluateAnswer}
                    disabled={isEvaluating || userAnswer.trim().length < 5}
                    className="btn-glow text-xs py-2 px-5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Evaluating Answer...
                      </>
                    ) : (
                      <>
                        <Send size={13} /> Submit for STAR Score
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. LIVE STAR EVALUATION CARD ==================== */}
          {currentEvaluation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line dark:border-night-line space-y-6"
            >
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line dark:border-night-line">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl text-white shadow-md ${
                      currentEvaluation.overallScore >= 80
                        ? 'bg-emerald-500'
                        : currentEvaluation.overallScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {currentEvaluation.overallScore}%
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-ink dark:text-moon flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-g-blue" />
                      {currentEvaluation.overallScore >= 85
                        ? 'Exemplary FAANG-Grade Response'
                        : currentEvaluation.overallScore >= 70
                        ? 'Strong Passing Response'
                        : 'Needs STAR Refinement'}
                    </div>
                    <div className="text-xs text-ink-soft dark:text-moon-soft mt-0.5">
                      {currentEvaluation.wordCount} words spoken/typed • {currentEvaluation.fillerCount} filler words detected
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="btn-glow text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>{currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'View Final Report'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* 4-Pillar STAR Progress Bars */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Situation Context', score: currentEvaluation.starBreakdown.situationScore, desc: 'Clarity of the background setting' },
                  { label: 'Action & Ownership', score: currentEvaluation.starBreakdown.actionScore, desc: 'Personal "I" vs "We" contributions' },
                  { label: 'Quantifiable Result', score: currentEvaluation.starBreakdown.resultScore, desc: 'Metrics, %, scale, latency outcome' },
                  { label: 'Delivery & Pacing', score: currentEvaluation.starBreakdown.deliveryScore, desc: 'Structure, flow, minimal filler words' }
                ].map((pillar, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-xl bg-canvas dark:bg-night-surface border border-line dark:border-night-line space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink dark:text-moon">{pillar.label}</span>
                      <span className="font-bold text-g-blue">{pillar.score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-canvas-deep dark:bg-night-panel overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pillar.score >= 75 ? 'bg-emerald-500' : pillar.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pillar.score}%` }}
                      />
                    </div>
                    <p className="text-[10.5px] text-ink-soft dark:text-moon-soft">{pillar.desc}</p>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Recruiter Strengths Detected
                  </div>
                  <ul className="space-y-1.5 text-ink-soft dark:text-moon-soft">
                    {currentEvaluation.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Tactical Improvements
                  </div>
                  <ul className="space-y-1.5 text-ink-soft dark:text-moon-soft">
                    {currentEvaluation.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Top 1% Model Answer */}
              {currentEvaluation.modelAnswer && (
                <div className="p-4 rounded-xl bg-g-blue/5 border border-g-blue/20 space-y-2 text-xs">
                  <div className="font-semibold text-g-blue flex items-center gap-1.5">
                    <Sparkles size={14} /> Top 1% Candidate Model Answer (STAR Method)
                  </div>
                  <p className="text-ink-soft dark:text-moon-soft leading-relaxed italic whitespace-pre-line">
                    &ldquo;{currentEvaluation.modelAnswer}&rdquo;
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ==================== 4. FINAL INTERVIEW REPORT CARD ==================== */}
      {isSessionComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="p-8 rounded-3xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line dark:border-night-line max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-full bg-g-blue/10 text-g-blue flex items-center justify-center mx-auto">
              <Award size={32} />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-g-blue">
                Interview Simulation Complete
              </span>
              <h2 className="font-display font-bold text-2xl text-ink dark:text-moon">
                Overall Interview Readiness Score: {calculateFinalAverage()}%
              </h2>
              <p className="text-xs text-ink-soft dark:text-moon-soft">
                Evaluated across {completedEvaluations.length} tailored interview scenarios for {targetRole}.
              </p>
            </div>

            {/* Questions Summary Table */}
            <div className="space-y-2 text-left pt-2">
              {completedEvaluations.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-canvas dark:bg-night-surface border border-line dark:border-night-line flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-semibold text-ink dark:text-moon truncate">
                      #{idx + 1}: {item.question.question}
                    </div>
                    <div className="text-[11px] text-ink-soft dark:text-moon-soft">
                      {item.question.category} • {item.answer.split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                  <div
                    className={`font-bold px-2.5 py-1 rounded-lg text-xs shrink-0 ${
                      item.evaluation.overallScore >= 80
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : item.evaluation.overallScore >= 60
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {item.evaluation.overallScore}%
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-line dark:border-night-line">
              <button
                type="button"
                onClick={handleStartSession}
                className="btn-glow text-xs py-2.5 px-6 flex items-center gap-2"
              >
                <RotateCcw size={14} /> Start New Mock Session
              </button>
              <button
                type="button"
                onClick={handleExitSession}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs font-medium text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon transition-colors shadow-sm"
              >
                Back to Config
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
