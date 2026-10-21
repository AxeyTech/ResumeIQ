import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Cpu,
  Users,
  Plus,
  X,
  AlertCircle,
  Lightbulb,
  Zap,
  Target,
  FileText,
  CheckCircle,
  Flame
} from 'lucide-react'
import {
  api,
  BulletOptimizationResult,
  OptimizedBulletVariant,
  InjectedKeywordsResult,
  InjectedBulletItem,
} from '../services/api'

interface BulletOptimizerProps {
  suggestedKeywords?: string[]
  initialTab?: 'rewriter' | 'injector'
  jobTitle?: string
  resumeSections?: Record<string, any>
}

const WEAK_PATTERNS = [
  { regex: /^(i\s+)?(worked\s+on|working\s+on)/i, label: 'worked on' },
  { regex: /^(i\s+)?(was\s+)?(responsible\s+for|handled|handling)/i, label: 'responsible for / handled' },
  { regex: /^(i\s+)?(helped\s+with|assisted\s+in|assisted\s+with)/i, label: 'helped / assisted' },
  { regex: /^(participated\s+in|contributed\s+to)/i, label: 'participated in / contributed to' },
  { regex: /^(involved\s+in|tasked\s+with)/i, label: 'tasked with / involved in' },
]

const QUICK_EXAMPLES = [
  {
    title: 'Frontend / UI',
    text: 'Worked on frontend with React and fixed bugs in user authentication system',
    role: 'Frontend Engineer',
  },
  {
    title: 'Backend / Database',
    text: 'Responsible for backend database queries and speeding up API performance',
    role: 'Backend Developer',
  },
  {
    title: 'DevOps / Cloud',
    text: 'Helped team set up Docker container pipelines and manage CI/CD deployment',
    role: 'DevOps Engineer',
  },
]

export default function BulletOptimizer({
  suggestedKeywords = [],
  initialTab = 'rewriter',
  jobTitle: propJobTitle,
  resumeSections,
}: BulletOptimizerProps) {
  const [activeTab, setActiveTab] = useState<'rewriter' | 'injector'>(initialTab)

  // Sync initial tab when changed by parent
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  // --- TAB 1: Bullet Rewriter State ---
  const [bullet, setBullet] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [customKeywordInput, setCustomKeywordInput] = useState('')
  const [jobTitle, setJobTitle] = useState(propJobTitle || 'Software Engineer')
  const [tone, setTone] = useState<'impactful' | 'technical' | 'executive'>('impactful')
  const [optimizing, setOptimizing] = useState(false)
  const [rewriterError, setRewriterError] = useState<string | null>(null)
  const [result, setResult] = useState<BulletOptimizationResult | null>(null)
  const [copiedVariantIndex, setCopiedVariantIndex] = useState<number | null>(null)

  // --- TAB 2: Keyword Injector State ---
  const [injectorKeywords, setInjectorKeywords] = useState<string[]>([])
  const [injectorCustomInput, setInjectorCustomInput] = useState('')
  const [injectorRole, setInjectorRole] = useState(propJobTitle || 'Software Engineer')
  const [injectorContext, setInjectorContext] = useState('')
  const [injecting, setInjecting] = useState(false)
  const [injectorError, setInjectorError] = useState<string | null>(null)
  const [injectorResult, setInjectorResult] = useState<InjectedKeywordsResult | null>(null)
  const [copiedInjectorIndex, setCopiedInjectorIndex] = useState<number | null>(null)

  // Initialize injector with first 3 missing keywords
  useEffect(() => {
    if (suggestedKeywords.length > 0 && injectorKeywords.length === 0) {
      setInjectorKeywords(suggestedKeywords.slice(0, 3))
    }
  }, [suggestedKeywords])

  // Detect weak starters in real time
  const detectedWeakStarter = useMemo(() => {
    const trimmed = bullet.trim()
    if (!trimmed) return null
    for (const pattern of WEAK_PATTERNS) {
      if (pattern.regex.test(trimmed)) {
        return pattern.label
      }
    }
    return null
  }, [bullet])

  // Detect missing metric in real time
  const hasMetricInBullet = useMemo(() => {
    if (bullet.trim().length < 15) return true
    return /\d+%|\d+\s*(?:percent|k|m|ms|s|x|users|clients|rps|gb|tb)|\$\d+/i.test(bullet)
  }, [bullet])

  // Extract bullets from resumeSections (experience or projects)
  const extractedResumeBullets = useMemo(() => {
    if (!resumeSections) return []
    const candidates: string[] = []
    const relevantText = [
      resumeSections.experience || '',
      resumeSections.projects || '',
    ].join('\n')

    const lines = relevantText.split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/^[\s•\-\*]+\s*/, '')
      if (line.length >= 25 && line.length <= 250 && !line.endsWith(':')) {
        candidates.push(line)
        if (candidates.length >= 4) break
      }
    }
    return candidates
  }, [resumeSections])

  // --- Handlers: Bullet Rewriter ---
  const toggleSuggestedKeyword = (kw: string) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== kw))
    } else {
      if (selectedKeywords.length < 5) {
        setSelectedKeywords([...selectedKeywords, kw])
      }
    }
  }

  const addCustomKeyword = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    const trimmed = customKeywordInput.trim()
    if (trimmed && !selectedKeywords.includes(trimmed) && selectedKeywords.length < 5) {
      setSelectedKeywords([...selectedKeywords, trimmed])
      setCustomKeywordInput('')
    }
  }

  const removeKeyword = (kw: string) => {
    setSelectedKeywords(selectedKeywords.filter((k) => k !== kw))
  }

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bullet.trim().length < 5) {
      setRewriterError('Please enter at least a few words to optimize.')
      return
    }

    setOptimizing(true)
    setRewriterError(null)

    try {
      const data = await api.optimizeBullet(
        bullet.trim(),
        selectedKeywords,
        jobTitle.trim() || 'Software Engineer',
        tone
      )
      setResult(data)
    } catch (err: any) {
      setRewriterError(err?.message || 'Failed to optimize bullet. Please try again.')
    } finally {
      setOptimizing(false)
    }
  }

  const handleCopyVariant = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedVariantIndex(index)
    setTimeout(() => setCopiedVariantIndex(null), 2200)
  }

  // --- Handlers: Keyword Injector ---
  const toggleInjectorKeyword = (kw: string) => {
    if (injectorKeywords.includes(kw)) {
      setInjectorKeywords(injectorKeywords.filter((k) => k !== kw))
    } else {
      if (injectorKeywords.length < 6) {
        setInjectorKeywords([...injectorKeywords, kw])
      }
    }
  }

  const addInjectorCustomKeyword = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    const trimmed = injectorCustomInput.trim()
    if (trimmed && !injectorKeywords.includes(trimmed) && injectorKeywords.length < 6) {
      setInjectorKeywords([...injectorKeywords, trimmed])
      setInjectorCustomInput('')
    }
  }

  const removeInjectorKeyword = (kw: string) => {
    setInjectorKeywords(injectorKeywords.filter((k) => k !== kw))
  }

  const handleInjectKeywords = async (e: React.FormEvent) => {
    e.preventDefault()
    if (injectorKeywords.length === 0) {
      setInjectorError('Please select or add at least 1 keyword to inject.')
      return
    }

    setInjecting(true)
    setInjectorError(null)

    try {
      const data = await api.injectKeywords(
        injectorKeywords,
        injectorRole.trim() || 'Software Engineer',
        injectorContext.trim()
      )
      setInjectorResult(data)
    } catch (err: any) {
      setInjectorError(err?.message || 'Failed to generate injected bullets. Please try again.')
    } finally {
      setInjecting(false)
    }
  }

  const handleCopyInjected = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedInjectorIndex(index)
    setTimeout(() => setCopiedInjectorIndex(null), 2200)
  }

  const getVariantIcon = (type: string) => {
    switch (type) {
      case 'metric':
        return <TrendingUp size={16} className="text-emerald-500" />
      case 'technical':
        return <Cpu size={16} className="text-g-blue" />
      case 'leadership':
        return <Users size={16} className="text-purple-500" />
      default:
        return <Sparkles size={16} className="text-amber-500" />
    }
  }

  return (
    <div className="card-glass p-5 sm:p-7 md:p-8 rounded-3xl border border-line dark:border-night-line shadow-card transition-all">
      {/* Top Header & Feature Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-line dark:border-night-line gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-g-gradient flex items-center justify-center text-white shadow-glow-blue shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon leading-tight">
                AI Bullet Optimizer & Keyword Injector
              </h2>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Google X-Y-Z Certified
              </span>
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5">
              Transform passive statements into quantifiable STAR bullets or generate authentic experience bullets with your missing ATS keywords.
            </p>
          </div>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-canvas-deep/70 dark:bg-night-panel/70 border border-line dark:border-night-line self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('rewriter')}
            className={`relative px-3.5 py-1.5 rounded-xl text-xs font-ui font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'rewriter'
                ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-sm border border-line dark:border-night-line'
                : 'text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
            }`}
          >
            <Sparkles size={13} className="text-g-blue" />
            <span>STAR Rewriter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('injector')}
            className={`relative px-3.5 py-1.5 rounded-xl text-xs font-ui font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'injector'
                ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-sm border border-line dark:border-night-line'
                : 'text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
            }`}
          >
            <Zap size={13} className="text-amber-500" />
            <span>Keyword Injector</span>
            {suggestedKeywords.length > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                {suggestedKeywords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STAR BULLET REWRITER */}
      {/* ========================================================= */}
      {activeTab === 'rewriter' && (
        <div className="mt-6 space-y-6">
          {/* Quick Pre-fill Inspiration Section */}
          <div className="p-3.5 rounded-2xl bg-canvas-deep/30 dark:bg-night-panel/30 border border-line/60 dark:border-night-line/60">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center gap-1">
                <Flame size={12} className="text-amber-500" />
                Quick-fill Inspiration & Weak Bullet Samples:
              </span>
              <span className="text-[10px] text-ink-faint dark:text-moon-soft/60 hidden sm:inline">
                Click to load sample
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setBullet(ex.text)
                    setJobTitle(ex.role)
                  }}
                  className="text-left text-xs px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line text-ink dark:text-moon hover:border-g-blue/60 transition-all flex items-center gap-1.5 group"
                >
                  <span className="font-medium text-g-blue text-[11px] group-hover:underline">
                    {ex.title}:
                  </span>
                  <span className="text-ink-soft dark:text-moon-soft text-[11px] truncate max-w-[190px] sm:max-w-[260px]">
                    "{ex.text}"
                  </span>
                </button>
              ))}

              {/* Bullets Extracted from User's Uploaded Resume */}
              {extractedResumeBullets.map((rb, idx) => (
                <button
                  key={`res-${idx}`}
                  type="button"
                  onClick={() => setBullet(rb)}
                  className="text-left text-xs px-2.5 py-1.5 rounded-xl bg-g-blue/5 dark:bg-g-blue/10 border border-g-blue/20 text-ink dark:text-moon hover:border-g-blue transition-all flex items-center gap-1.5"
                  title="Click to import from your parsed resume"
                >
                  <FileText size={11} className="text-g-blue shrink-0" />
                  <span className="text-g-blue font-medium text-[11px]">Resume Bullet:</span>
                  <span className="text-ink-soft dark:text-moon-soft text-[11px] truncate max-w-[180px] sm:max-w-[240px]">
                    "{rb}"
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleOptimize} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                  <Target size={13} className="text-g-blue" />
                  Input Weak or Raw Bullet Point
                </label>
                <span className="text-[11px] text-ink-faint dark:text-moon-soft">
                  {bullet.length} / 1000 characters
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  required
                  value={bullet}
                  onChange={(e) => setBullet(e.target.value)}
                  placeholder="e.g. Worked on frontend with React and fixed bugs in user authentication system"
                  className="w-full rounded-2xl border border-line dark:border-night-line bg-canvas-deep/50 dark:bg-night-panel/50 p-4 text-sm font-ui text-ink dark:text-moon placeholder:text-ink-faint focus:outline-none focus:border-g-blue focus:shadow-glow-soft transition-all"
                />
              </div>

              {/* Real-time Weak Starter & Metric Warning */}
              <div className="mt-2 space-y-1.5">
                {detectedWeakStarter && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2"
                  >
                    <AlertCircle size={14} className="shrink-0 text-amber-500" />
                    <span>
                      <strong>Passive starter detected ("{detectedWeakStarter}"):</strong> ATS software penalizes passive starters. Our AI will replace it with executive action verbs like <em>Architected</em>, <em>Engineered</em>, or <em>Spearheaded</em>.
                    </span>
                  </motion.div>
                )}

                {!hasMetricInBullet && bullet.trim().length >= 15 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2"
                  >
                    <Lightbulb size={14} className="shrink-0 text-blue-500" />
                    <span>
                      <strong>Missing Quantifiable Metric:</strong> Bullet points with percentages or scale metrics get <strong>2.8x more interview callbacks</strong>. The AI will inject realistic benchmark metrics for you.
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Target Keywords Integration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" />
                  Target Keywords to Weave In <span className="font-normal lowercase">({selectedKeywords.length}/5)</span>
                </label>
                <span className="text-[11px] text-ink-faint dark:text-moon-soft">
                  Blended naturally into STAR formula
                </span>
              </div>

              {/* Quick-Pick Missing Keywords */}
              {suggestedKeywords.length > 0 && (
                <div className="mb-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedKeywords.slice(0, 8).map((kw) => {
                      const isSelected = selectedKeywords.includes(kw)
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => toggleSuggestedKeyword(kw)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-g-blue text-white border-g-blue shadow-glow-soft font-medium'
                              : 'bg-white/60 dark:bg-night-panel/60 border-line dark:border-night-line text-ink dark:text-moon hover:border-g-blue/50'
                          }`}
                        >
                          <span>{kw}</span>
                          {isSelected ? <Check size={11} /> : <Plus size={11} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selected Pills & Custom Input */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-line dark:border-night-line bg-canvas-deep/30 dark:bg-night-panel/30 min-h-[46px]">
                {selectedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-g-blue/15 text-g-blue border border-g-blue/30 font-medium"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {selectedKeywords.length < 5 && (
                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={customKeywordInput}
                      onChange={(e) => setCustomKeywordInput(e.target.value)}
                      onKeyDown={addCustomKeyword}
                      placeholder="+ Add custom keyword (Press Enter)"
                      className="bg-transparent text-xs text-ink dark:text-moon placeholder:text-ink-faint focus:outline-none w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Job Title and Executive Tone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
                  Target Job Role Context
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full rounded-xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 px-3.5 py-2.5 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-g-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
                  Executive Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['impactful', 'technical', 'executive'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`text-xs py-2 rounded-xl capitalize font-medium border transition-all ${
                        tone === t
                          ? 'bg-ink dark:bg-moon text-canvas dark:text-night border-ink dark:border-moon shadow-sm'
                          : 'border-line dark:border-night-line text-ink-soft dark:text-moon-soft hover:border-g-blue'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {rewriterError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{rewriterError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-ink-faint dark:text-moon-soft/70 flex items-center gap-1.5">
                <CheckCircle size={13} className="text-emerald-500" />
                <span>Follows Google's "Accomplished [X] measured by [Y] by doing [Z]" standard</span>
              </div>

              <button
                type="submit"
                disabled={optimizing || !bullet.trim()}
                className="w-full sm:w-auto btn-glow px-6 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {optimizing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Synthesizing STAR Variants...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Optimized Bullets</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results: STAR Variants */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="mt-8 pt-6 border-t border-line dark:border-night-line space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-base text-ink dark:text-moon flex items-center gap-2">
                      <span>3 STAR Variations Synthesized</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        {result.atsScoreBoostEstimate}
                      </span>
                    </h3>
                    <p className="text-xs text-ink-soft dark:text-moon-soft">
                      Choose the variant best matched to the seniority and focus of your target position.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {result.variants.map((v: OptimizedBulletVariant, idx: number) => {
                    const isCopied = copiedVariantIndex === idx
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 p-5 hover:border-g-blue/50 hover:shadow-card-hover transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="p-1 rounded-lg bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line">
                              {getVariantIcon(v.type)}
                            </div>
                            <span className="font-ui text-xs font-semibold text-ink dark:text-moon">
                              {v.label}
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-g-blue/10 text-g-blue border border-g-blue/20 font-medium">
                              Verb: <strong>{v.actionVerb}</strong>
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyVariant(v.bullet, idx)}
                            className={`btn-outline-glass text-xs py-1.5 px-3.5 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto ${
                              isCopied ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 font-medium' : ''
                            }`}
                            title="Copy to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check size={13} className="text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Bullet</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Rewritten Bullet Text */}
                        <p className="font-ui text-sm text-ink dark:text-moon leading-relaxed mb-3.5">
                          &bull; {v.bullet}
                        </p>

                        {/* Keywords & Improvement Tip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-line/40 dark:border-night-line/40 text-[11px] text-ink-soft dark:text-moon-soft">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-ink-faint">Embedded:</span>
                            {v.highlightedKeywords.length > 0 ? (
                              v.highlightedKeywords.map((kw, kIdx) => (
                                <span
                                  key={kIdx}
                                  className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]"
                                >
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="italic text-ink-faint">Industry standards</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-ink-faint">
                            <Lightbulb size={12} className="text-amber-500 shrink-0" />
                            <span>{v.improvementTip}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SMART KEYWORD INJECTOR */}
      {/* ========================================================= */}
      {activeTab === 'injector' && (
        <div className="mt-6 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-ink dark:text-moon">
            <div className="flex items-start gap-3">
              <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-sm text-amber-700 dark:text-amber-300">
                  Target Missing Keywords & 1-Click Resume Injection
                </h4>
                <p className="text-xs text-ink-soft dark:text-moon-soft mt-1 leading-relaxed">
                  Select your missing ATS skills below. Our engine will synthesize 3 ready-to-paste, production-grade bullet points demonstrating authentic experience with these tools without awkward keyword stuffing.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleInjectKeywords} className="space-y-5">
            {/* Missing Keywords Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft">
                  Select Missing Keywords to Target <span className="font-normal lowercase">({injectorKeywords.length}/6)</span>
                </label>
                <span className="text-[11px] text-ink-faint dark:text-moon-soft">
                  Click chips to toggle
                </span>
              </div>

              {suggestedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {suggestedKeywords.map((kw) => {
                    const isSelected = injectorKeywords.includes(kw)
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => toggleInjectorKeyword(kw)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 shadow-glow-soft font-semibold'
                            : 'bg-white/70 dark:bg-night-panel/70 border-line dark:border-night-line text-ink dark:text-moon hover:border-amber-500/60'
                        }`}
                      >
                        <span>{kw}</span>
                        {isSelected ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-ink-faint dark:text-moon-soft mb-2 italic">
                  Run an ATS Audit first to automatically pull your missing keyword gaps, or add custom skills below.
                </p>
              )}

              {/* Active Pills & Add Custom */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-line dark:border-night-line bg-canvas-deep/30 dark:bg-night-panel/30 min-h-[46px]">
                {injectorKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeInjectorKeyword(kw)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {injectorKeywords.length < 6 && (
                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={injectorCustomInput}
                      onChange={(e) => setInjectorCustomInput(e.target.value)}
                      onKeyDown={addInjectorCustomKeyword}
                      placeholder="+ Add custom keyword (Press Enter)"
                      className="bg-transparent text-xs text-ink dark:text-moon placeholder:text-ink-faint focus:outline-none w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Target Role & Domain Context Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={injectorRole}
                  onChange={(e) => setInjectorRole(e.target.value)}
                  placeholder="e.g. Full Stack Software Engineer"
                  className="w-full rounded-xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 px-3.5 py-2.5 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
                  Domain Context (Optional)
                </label>
                <input
                  type="text"
                  value={injectorContext}
                  onChange={(e) => setInjectorContext(e.target.value)}
                  placeholder="e.g. Fintech APIs, E-commerce, Microservices"
                  className="w-full rounded-xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 px-3.5 py-2.5 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {injectorError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{injectorError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={injecting || injectorKeywords.length === 0}
                className="w-full sm:w-auto btn-glow px-6 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 bg-amber-500 hover:bg-amber-600 border-amber-400 shadow-glow-amber text-white"
              >
                {injecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Synthesizing Tailored Experience Bullets...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Generate Injected Bullets ({injectorKeywords.length})</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results: Injected Bullets */}
          <AnimatePresence>
            {injectorResult && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="mt-8 pt-6 border-t border-line dark:border-night-line space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-base text-ink dark:text-moon flex items-center gap-2">
                      <span>Ready-to-Paste Bullets Generated</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                        {injectorResult.atsScoreBoostEstimate}
                      </span>
                    </h3>
                    <p className="text-xs text-ink-soft dark:text-moon-soft">
                      Copy these bullets directly into your resume's Experience or Projects section.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {injectorResult.injectedBullets.map((ib: InjectedBulletItem, idx: number) => {
                    const isCopied = copiedInjectorIndex === idx
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 p-5 hover:border-amber-500/50 hover:shadow-card-hover transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-ui text-xs font-semibold text-ink dark:text-moon">
                              {ib.category}
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
                              Verb: <strong>{ib.actionVerb}</strong>
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                              Impact: {ib.impactMetric}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyInjected(ib.bullet, idx)}
                            className={`btn-outline-glass text-xs py-1.5 px-3.5 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto ${
                              isCopied ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 font-medium' : ''
                            }`}
                            title="Copy to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check size={13} className="text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Bullet</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Bullet Text */}
                        <p className="font-ui text-sm text-ink dark:text-moon leading-relaxed mb-3.5">
                          &bull; {ib.bullet}
                        </p>

                        {/* Embedded Keywords & Recruiter Note */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-line/40 dark:border-night-line/40 text-[11px] text-ink-soft dark:text-moon-soft">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-ink-faint">Injected Skills:</span>
                            {ib.embeddedKeywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-semibold"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 text-ink-faint">
                            <Lightbulb size={12} className="text-amber-500 shrink-0" />
                            <span>{ib.whyItWorks}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
