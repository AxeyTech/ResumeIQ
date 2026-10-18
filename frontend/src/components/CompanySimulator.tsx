import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Rocket,
  Zap,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Loader2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import { api, PersonaDetail, PersonaSimulationsResponse } from '../services/api'

interface CompanySimulatorProps {
  analysisId: string
}

export default function CompanySimulator({ analysisId }: CompanySimulatorProps) {
  const [data, setData] = useState<PersonaSimulationsResponse | null>(null)
  const [activeTier, setActiveTier] = useState<'faang' | 'startup' | 'enterprise'>('faang')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSimulations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getPersonaSimulations(analysisId)
      setData(res)
    } catch (err: any) {
      console.error('Failed to load persona simulations:', err)
      setError(err?.message || 'Could not load company persona simulations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (analysisId) {
      fetchSimulations()
    }
  }, [analysisId])

  if (loading) {
    return (
      <div className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line text-center py-10">
        <Loader2 size={24} className="animate-spin text-g-blue mx-auto mb-2.5" />
        <p className="text-xs text-ink-soft dark:text-moon-soft">
          Simulating recruiter screening heuristics across FAANG, Tech Startups, and Global Enterprises...
        </p>
      </div>
    )
  }

  if (error || !data || !data.personas || !data.personas.faang || !data.personas.startup || !data.personas.enterprise) {
    return (
      <div className="glass rounded-3xl p-6 border border-line dark:border-night-line">
        <div className="flex items-center justify-between text-xs text-rose-500 mb-2">
          <span className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={15} /> Company Simulator Unavailable
          </span>
          <button
            onClick={fetchSimulations}
            className="text-ink-soft hover:text-ink dark:hover:text-moon flex items-center gap-1 underline text-[11px]"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
        <p className="text-xs text-ink-soft dark:text-moon-soft">{error || 'Unable to compute simulations.'}</p>
      </div>
    )
  }

  const currentPersona: PersonaDetail = data.personas[activeTier] || data.personas.faang

  const getTierIcon = (id: string) => {
    switch (id) {
      case 'faang':
        return <Rocket size={16} className="text-g-blue" />
      case 'startup':
        return <Zap size={16} className="text-g-yellow" />
      case 'enterprise':
        return <Globe size={16} className="text-g-green" />
      default:
        return <Building2 size={16} />
    }
  }

  const getBadgeBg = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case 'blue':
        return 'bg-g-blue/10 text-g-blue border-g-blue/20'
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    }
  }

  const getScoreRingColor = (score: number) => {
    if (score >= 75) return '#34A853'
    if (score >= 50) return '#FBBC05'
    return '#EA4335'
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-8 border border-line dark:border-night-line shadow-card overflow-hidden space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line dark:border-night-line">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-g-blue via-g-red to-g-green flex items-center justify-center text-white shadow-glow-blue shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon">
                Company-Specific ATS Simulator &amp; Recruiter Persona Scan
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20">
                Tier Intelligence
              </span>
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5">
              Simulate how different company types weight and rank your resume based on their distinct hiring priorities.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSimulations}
          className="p-2 rounded-xl text-ink-soft hover:text-ink dark:hover:text-moon border border-line dark:border-night-line self-start sm:self-auto"
          title="Refresh simulation"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Company Tier Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {(
          [
            { id: 'faang', label: 'FAANG & Top Product', count: `${data.personas.faang.score}% Match` },
            { id: 'startup', label: 'High-Growth Startups', count: `${data.personas.startup.score}% Match` },
            { id: 'enterprise', label: 'Global Enterprise & IT', count: `${data.personas.enterprise.score}% Match` }
          ] as const
        ).map((t) => {
          const isSelected = activeTier === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTier(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-g-blue/10 border-g-blue shadow-glow-soft'
                  : 'bg-canvas-deep/30 dark:bg-night-panel/30 border-line dark:border-night-line hover:border-g-blue/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getTierIcon(t.id)}
                <div className="truncate">
                  <div className="text-xs font-semibold text-ink dark:text-moon truncate">{t.label}</div>
                  <div className="text-[10px] text-ink-soft dark:text-moon-soft font-mono font-medium">{t.count}</div>
                </div>
              </div>
              {isSelected && <Sparkles size={14} className="text-g-blue shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Active Persona Deep-Dive Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPersona.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="p-5 sm:p-6 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-6"
        >
          {/* Persona Header & Score Ring */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-5 border-b border-line dark:border-night-line">
            <div className="space-y-1.5 flex-1">
              <div className="eyebrow mb-0.5">Target Hiring Persona</div>
              <h4 className="font-display font-semibold text-xl text-ink dark:text-moon flex items-center gap-2">
                {currentPersona.title}
              </h4>
              <p className="text-xs text-ink-soft dark:text-moon-soft">{currentPersona.subtitle}</p>
              <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold font-mono px-3 py-1 rounded-full border ${getBadgeBg(currentPersona.badgeColor)}`}>
                  {currentPersona.badge}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-moon-soft">
                  Persona Fit
                </div>
                <div className="text-[11px] text-ink-faint dark:text-moon-soft">Out of 100 points</div>
              </div>
              <ScoreRing
                to={currentPersona.score}
                size={96}
                strokeWidth={7}
                ringColor={getScoreRingColor(currentPersona.score)}
              />
            </div>
          </div>

          {/* Verdict Callout */}
          <div className="p-4 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs italic text-ink dark:text-moon leading-relaxed flex items-start gap-2.5 shadow-sm">
            <Sparkles size={16} className="text-g-blue shrink-0 mt-0.5" />
            <span>&ldquo;{currentPersona.verdict}&rdquo;</span>
          </div>

          {/* 4-Bar Criteria Breakdown */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-3 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-g-blue" /> Weighted Screening Pillars
            </h5>
            <div className="grid sm:grid-cols-2 gap-3.5">
              {(currentPersona.criteria || []).map((c, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-canvas dark:bg-night-card border border-line dark:border-night-line space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink dark:text-moon">{c.label}</span>
                    <span className="font-mono font-bold text-ink-soft dark:text-moon-soft">{c.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-canvas-deep dark:bg-night-panel overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.score}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.08 }}
                      className={`h-full ${c.score >= 75 ? 'bg-emerald-500' : c.score >= 55 ? 'bg-g-blue' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Strengths vs Red Flags Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> What Recruiters In This Tier Will Love
              </div>
              <ul className="space-y-1.5">
                {(currentPersona.strengths || []).map((s, idx) => (
                  <li key={idx} className="text-xs text-ink-soft dark:text-moon-soft flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags */}
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Potential Automated Screening Tripwires
              </div>
              <ul className="space-y-1.5">
                {(currentPersona.redFlags || []).map((rf, idx) => (
                  <li key={idx} className="text-xs text-ink-soft dark:text-moon-soft flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{rf}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tactical Recommendations */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-g-blue/5 via-g-green/5 to-transparent border border-g-blue/20 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-g-blue flex items-center gap-1.5">
              <ShieldCheck size={14} /> 3 Tailored Fixes To Clear This Tier&rsquo;s Screen
            </div>
            <div className="space-y-2">
              {(currentPersona.tacticalRecommendations || []).map((rec, idx) => (
                <div key={idx} className="text-xs text-ink-soft dark:text-moon-soft flex items-start gap-2.5 leading-relaxed">
                  <span className="font-mono font-bold text-g-blue shrink-0">{idx + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
