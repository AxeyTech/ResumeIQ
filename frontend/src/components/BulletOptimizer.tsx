import React, { useState } from 'react'
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
  Lightbulb
} from 'lucide-react'
import { api, BulletOptimizationResult, OptimizedBulletVariant } from '../services/api'

interface BulletOptimizerProps {
  suggestedKeywords?: string[]
}

export default function BulletOptimizer({ suggestedKeywords = [] }: BulletOptimizerProps) {
  const [bullet, setBullet] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [customKeywordInput, setCustomKeywordInput] = useState('')
  const [jobTitle, setJobTitle] = useState('Software Engineer')
  const [tone, setTone] = useState<'impactful' | 'technical' | 'executive'>('impactful')
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulletOptimizationResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

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
      setError('Please enter at least a few words to optimize.')
      return
    }

    setOptimizing(true)
    setError(null)

    try {
      const data = await api.optimizeBullet(
        bullet.trim(),
        selectedKeywords,
        jobTitle.trim() || 'Software Engineer',
        tone
      )
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to optimize bullet. Please try again.')
    } finally {
      setOptimizing(false)
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2200)
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
    <div className="card-glass p-6 md:p-8 rounded-3xl border border-line dark:border-night-line shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-line dark:border-night-line gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-g-gradient flex items-center justify-center text-white shadow-glow-blue">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon">
                AI Bullet Optimizer & STAR Rewriter
              </h2>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                PRO AI
              </span>
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft">
              Transform rough resume bullets into quantified, high-impact STAR statements optimized for ATS filters.
            </p>
          </div>
        </div>

        {result && (
          <div className="self-start sm:self-center px-3 py-1 rounded-full bg-g-blue/10 border border-g-blue/20 text-g-blue font-ui text-xs font-semibold flex items-center gap-1.5">
            <TrendingUp size={13} />
            <span>{result.atsScoreBoostEstimate}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleOptimize} className="mt-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-2">
            Paste rough bullet point to rewrite
          </label>
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
        </div>

        {/* Keywords Integration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft">
              Target Keywords to Embed <span className="font-normal lowercase">({selectedKeywords.length}/5)</span>
            </label>
            <span className="text-[11px] text-ink-faint dark:text-moon-soft">
              Keywords naturally blended into STAR bullet
            </span>
          </div>

          {/* Missing keywords from ATS analysis (Quick Picks) */}
          {suggestedKeywords.length > 0 && (
            <div className="mb-3">
              <span className="text-[11px] font-medium text-amber-500 block mb-1.5">
                ⚡ Quick Pick from your ATS Keyword Gaps:
              </span>
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
                          ? 'bg-g-blue text-white border-g-blue shadow-glow-soft'
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

          {/* Active keywords & custom add */}
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

        {/* Job Title and Tone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
              Target Job Role Context
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
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

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={optimizing || !bullet.trim()}
            className="btn-glow px-6 py-3 text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {optimizing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Synthesizing STAR Variants...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Optimized Bullets
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="mt-8 pt-8 border-t border-line dark:border-night-line space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base text-ink dark:text-moon flex items-center gap-2">
                <span>Optimized STAR Variations</span>
                <span className="text-xs font-normal text-ink-soft dark:text-moon-soft">
                  (Choose the variant best suited for your target job)
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {result.variants.map((v: OptimizedBulletVariant, idx: number) => {
                const isCopied = copiedIndex === idx
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 p-5 hover:border-g-blue/50 hover:shadow-card-hover transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="p-1 rounded-lg bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line">
                          {getVariantIcon(v.type)}
                        </div>
                        <span className="font-ui text-xs font-semibold text-ink dark:text-moon">
                          {v.label}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-g-blue/10 text-g-blue border border-g-blue/20 font-medium">
                          Verb: {v.actionVerb}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(v.bullet, idx)}
                        className={`btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1.5 transition-all ${
                          isCopied ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''
                        }`}
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check size={13} className="text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Copied!</span>
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
                    <p className="font-ui text-sm text-ink dark:text-moon leading-relaxed pl-1 mb-3">
                      &bull; {v.bullet}
                    </p>

                    {/* Integrated Keywords & Improvement Tip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-line/40 dark:border-night-line/40 text-[11px] text-ink-soft dark:text-moon-soft">
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

                      <div className="flex items-center gap-1 text-ink-faint">
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
  )
}
