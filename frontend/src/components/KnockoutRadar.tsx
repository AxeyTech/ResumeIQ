import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  Layers,
  MapPin,
  FileText,
  RefreshCw,
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import { api, KnockoutRadarResponse, KnockoutRadarItem } from '../services/api'

interface KnockoutRadarProps {
  analysisId: string
  onSwitchToBuilder?: () => void
}

type FilterType = 'all' | 'disqualifier' | 'friction' | 'passed'

export default function KnockoutRadar({ analysisId, onSwitchToBuilder }: KnockoutRadarProps) {
  const [data, setData] = useState<KnockoutRadarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const fetchRadar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getKnockoutRadar(analysisId)
      setData(res)
    } catch (err: any) {
      console.error('Failed to load knockout radar data:', err)
      setError(err?.message || 'Could not load knockout criteria scan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (analysisId) {
      fetchRadar()
    }
  }, [analysisId])

  if (loading) {
    return (
      <div className="glass rounded-3xl p-8 border border-line dark:border-night-line text-center py-12">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-g-blue/20 border-t-g-blue animate-spin" />
          <div className="absolute inset-2 rounded-full border border-dashed border-g-green/30 animate-pulse" />
          <div className="w-full h-full flex items-center justify-center">
            <ShieldAlert size={22} className="text-g-blue animate-bounce" />
          </div>
        </div>
        <h4 className="font-display font-semibold text-sm mb-1">Scanning Commercial ATS Knockout Filters...</h4>
        <p className="text-xs text-ink-soft dark:text-moon-soft max-w-sm mx-auto">
          Inspecting hard thresholds across Workday, Taleo, Greenhouse, and Lever for instant auto-rejection triggers.
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass rounded-3xl p-6 border border-line dark:border-night-line text-center py-8">
        <AlertTriangle size={32} className="text-amber-500 mx-auto mb-2 opacity-80" />
        <p className="text-xs text-ink-soft dark:text-moon-soft mb-3">{error || 'Radar scan currently unavailable.'}</p>
        <button onClick={fetchRadar} className="btn-outline-glass text-xs py-1.5 px-3 inline-flex items-center gap-1.5">
          <RefreshCw size={12} /> Retry Radar Scan
        </button>
      </div>
    )
  }

  const filteredItems = (data.items || []).filter((item) => {
    if (activeFilter === 'disqualifier') return item.status === 'DISQUALIFIER'
    if (activeFilter === 'friction') return item.status === 'FRICTION'
    if (activeFilter === 'passed') return item.status === 'PASSED'
    return true
  })

  const getCategoryIcon = (category: KnockoutRadarItem['category']) => {
    switch (category) {
      case 'experience':
        return <Briefcase size={15} />
      case 'education':
        return <GraduationCap size={15} />
      case 'skill':
        return <Layers size={15} />
      case 'authorization':
        return <ShieldCheck size={15} />
      case 'location':
        return <MapPin size={15} />
      case 'formatting':
        return <FileText size={15} />
      default:
        return <HelpCircle size={15} />
    }
  }

  const getStatusBadge = (status: KnockoutRadarItem['status']) => {
    switch (status) {
      case 'DISQUALIFIER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm">
            <XCircle size={11} className="stroke-[2.5]" /> Disqualifier
          </span>
        )
      case 'FRICTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
            <AlertTriangle size={11} className="stroke-[2.5]" /> Caution
          </span>
        )
      case 'PASSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
            <CheckCircle2 size={11} className="stroke-[2.5]" /> Cleared
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Radar Status Panel */}
      <div className="glass rounded-3xl p-6 sm:p-7 border border-line dark:border-night-line shadow-card relative overflow-hidden">
        {/* Ambient atmospheric aura */}
        <div
          className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
            data.overallStatus === 'CLEARED'
              ? 'bg-emerald-500'
              : data.overallStatus === 'CAUTION'
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            {/* Visual Radar Scanner Orb */}
            <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-canvas-deep/80 dark:bg-night-panel/80 border border-line dark:border-night-line flex items-center justify-center p-2 shadow-inner">
              {/* Concentric radar rings */}
              <div className="absolute inset-2 rounded-full border border-g-blue/20" />
              <div className="absolute inset-4 rounded-full border border-g-green/20" />
              {/* Rotating radar sweep */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-40 animate-spin"
                style={{
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(66, 133, 244, 0.4) 0deg, transparent 60deg, transparent 360deg)',
                  animationDuration: '4s'
                }}
              />
              <div className="relative z-10">
                {data.overallStatus === 'CLEARED' ? (
                  <ShieldCheck size={28} className="text-emerald-500 drop-shadow-[0_0_12px_rgba(52,168,83,0.4)]" />
                ) : data.overallStatus === 'CAUTION' ? (
                  <AlertTriangle size={28} className="text-amber-500 drop-shadow-[0_0_12px_rgba(251,188,5,0.4)]" />
                ) : (
                  <ShieldAlert size={28} className="text-red-500 drop-shadow-[0_0_12px_rgba(234,67,53,0.4)]" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="eyebrow">Hard Disqualifier Radar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-canvas-deep dark:bg-night-panel border border-line dark:border-night-line text-ink-soft dark:text-moon-soft">
                  Workday • Greenhouse • Taleo
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg sm:text-xl flex items-center gap-2">
                {data.overallStatus === 'CLEARED' && (
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    Clearance Guaranteed <CheckCircle2 size={18} />
                  </span>
                )}
                {data.overallStatus === 'CAUTION' && (
                  <span className="text-amber-500 flex items-center gap-1.5">
                    Screening Friction Flagged <AlertTriangle size={18} />
                  </span>
                )}
                {data.overallStatus === 'HIGH_RISK' && (
                  <span className="text-red-500 flex items-center gap-1.5">
                    High Knockout Risk Detected <ShieldAlert size={18} />
                  </span>
                )}
              </h3>
              <p className="text-xs text-ink-soft dark:text-moon-soft mt-1 max-w-xl leading-relaxed">
                {data.summary}
              </p>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <div className="glass px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-line dark:border-night-line text-center min-w-0 sm:min-w-[76px]">
              <div className="text-[10px] text-ink-soft dark:text-moon-soft font-medium">Checked</div>
              <div className="text-base sm:text-lg font-display font-bold text-ink dark:text-moon">{data.totalChecked}</div>
            </div>
            <div className="glass px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center min-w-0 sm:min-w-[76px]">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Cleared</div>
              <div className="text-base sm:text-lg font-display font-bold text-emerald-500">{data.clearedCount}</div>
            </div>
            <div className="glass px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center min-w-0 sm:min-w-[76px]">
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Caution</div>
              <div className="text-base sm:text-lg font-display font-bold text-amber-500">{data.warningCount}</div>
            </div>
            <div className="glass px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-red-500/20 bg-red-500/5 text-center min-w-0 sm:min-w-[76px]">
              <div className="text-[10px] text-red-600 dark:text-red-400 font-medium">Knockouts</div>
              <div className="text-base sm:text-lg font-display font-bold text-red-500">{data.knockoutCount}</div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Chips */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-line dark:border-night-line overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeFilter === 'all'
                ? 'bg-ink dark:bg-moon text-paper dark:text-night shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
            }`}
          >
            All Criteria ({data.items.length})
          </button>
          <button
            onClick={() => setActiveFilter('disqualifier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'disqualifier'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:bg-red-500/10 hover:text-red-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Disqualifiers ({data.knockoutCount})
          </button>
          <button
            onClick={() => setActiveFilter('friction')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'friction'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:bg-amber-500/10 hover:text-amber-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Cautions ({data.warningCount})
          </button>
          <button
            onClick={() => setActiveFilter('passed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'passed'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:bg-emerald-500/10 hover:text-emerald-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Cleared ({data.clearedCount})
          </button>
          <button
            onClick={fetchRadar}
            title="Re-run Knockout Scan"
            className="ml-auto p-1.5 rounded-xl text-ink-soft dark:text-moon-soft hover:text-g-blue hover:bg-canvas-deep dark:hover:bg-night-panel transition-all shrink-0"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Itemized Criteria Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id + idx}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className={`glass rounded-2xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
                item.status === 'DISQUALIFIER'
                  ? 'border-red-500/30 bg-red-500/[0.03]'
                  : item.status === 'FRICTION'
                  ? 'border-amber-500/30 bg-amber-500/[0.03]'
                  : 'border-line dark:border-night-line'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft dark:text-moon-soft">
                    <span className="p-1.5 rounded-lg bg-canvas-deep dark:bg-night-panel text-ink dark:text-moon border border-line dark:border-night-line">
                      {getCategoryIcon(item.category)}
                    </span>
                    <span className="capitalize">{item.category} Filter</span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <h4 className="font-display font-semibold text-sm mb-2">{item.title}</h4>

                <div className="space-y-2 text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line/60 dark:border-night-line/60">
                    <div className="text-[10px] uppercase font-bold text-ink-soft dark:text-moon-soft mb-0.5 tracking-wider">
                      ATS Requirement
                    </div>
                    <div className="text-ink dark:text-moon leading-relaxed font-medium">{item.requirement}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line/40 dark:border-night-line/40">
                    <div className="text-[10px] uppercase font-bold text-ink-soft dark:text-moon-soft mb-0.5 tracking-wider">
                      Detected in Resume
                    </div>
                    <div className="text-ink-soft dark:text-moon-soft leading-relaxed">{item.candidateStatus}</div>
                  </div>
                </div>
              </div>

              {/* Tactical Recommendation */}
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed mt-auto ${
                  item.status === 'DISQUALIFIER'
                    ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                    : item.status === 'FRICTION'
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px]">
                  <Sparkles size={12} /> Tactical Bypass Recommendation:
                </div>
                {item.recommendation}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Simulated Workday / Greenhouse Screening Questions */}
      {data.simulatedAtsQuestions && data.simulatedAtsQuestions.length > 0 && (
        <div className="glass rounded-3xl p-6 sm:p-7 border border-line dark:border-night-line shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow text-g-blue">Workday / Greenhouse Knockout Simulator</span>
          </div>
          <h4 className="font-display font-semibold text-base mb-1">
            Simulated Applicant Screening Questions
          </h4>
          <p className="text-xs text-ink-soft dark:text-moon-soft mb-5">
            Commercial ATS forms ask these mandatory screening questions during the application submission flow. One wrong answer triggers automated auto-disqualification.
          </p>

          <div className="space-y-3">
            {data.simulatedAtsQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-line dark:border-night-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="font-medium text-xs sm:text-sm text-ink dark:text-moon mb-1">
                    &ldquo;{q.question}&rdquo;
                  </div>
                  <div className="text-[11px] text-ink-soft dark:text-moon-soft">
                    {q.guidance}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-ink-soft dark:text-moon-soft font-mono uppercase">Detected Answer:</span>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold tracking-wide ${
                      q.applicantAnswer === 'Yes'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : q.applicantAnswer === 'No'
                        ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    }`}
                  >
                    {q.applicantAnswer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer Callout */}
      <div className="glass rounded-2xl p-5 border border-g-blue/30 bg-g-blue/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
        <div>
          <div className="font-semibold text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-g-blue" />
            Resolve Disqualifiers with 1-Click Studio
          </div>
          <p className="text-xs text-ink-soft dark:text-moon-soft mt-0.5">
            Update your bullet points, inject missing keywords, and export a clean single-column PDF to clear all ATS radars.
          </p>
        </div>
        {onSwitchToBuilder && (
          <button
            onClick={onSwitchToBuilder}
            className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5 shrink-0 shadow-glow"
          >
            Launch Resume Studio <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
