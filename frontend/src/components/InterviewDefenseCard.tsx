import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  ShieldCheck,
  Target,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Layers,
  Wand2,
  Info,
  Terminal,
} from 'lucide-react'
import {
  api,
  ResumeDefenseResponse,
} from '../services/api'

interface InterviewDefenseCardProps {
  resumeId: string
  onSwitchToBuilder?: () => void
}

type FilterRisk = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'FLUFF'

export default function InterviewDefenseCard({ resumeId }: InterviewDefenseCardProps) {
  const [data, setData] = useState<ResumeDefenseResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterRisk>('ALL')
  const [expandedBullets, setExpandedBullets] = useState<Record<string, boolean>>({})
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null)

  const fetchDefense = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const res = forceRefresh
        ? await api.refreshResumeDefense(resumeId)
        : await api.getResumeDefense(resumeId)
      setData(res)

      // Auto-expand high risk bullets by default
      const initialExpanded: Record<string, boolean> = {}
      res.bullets.forEach((b) => {
        if (b.interviewDefense.riskLevel === 'HIGH') {
          initialExpanded[b.id] = true
        }
      })
      setExpandedBullets(initialExpanded)
    } catch (err: any) {
      setError(err?.message || 'Could not load interview defense matrix.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (resumeId) {
      fetchDefense(false)
    }
  }, [resumeId])

  const toggleExpand = (id: string) => {
    setExpandedBullets((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedBulletId(id)
    setTimeout(() => {
      setCopiedBulletId((curr) => (curr === id ? null : curr))
    }, 2200)
  }

  if (loading) {
    return (
      <div className="glass rounded-3xl p-8 sm:p-12 border border-line dark:border-night-line text-center">
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-g-red/10 border border-g-red/20 grid place-items-center animate-pulse">
            <ShieldAlert size={28} className="text-g-red" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-g-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-g-red"></span>
          </span>
        </div>
        <h3 className="font-display font-bold text-lg text-ink dark:text-moon mb-2">
          Auditing Bullets Against Google X-Y-Z &amp; Interview Grilling
        </h3>
        <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto mb-6">
          Simulating tough interview cross-examination from Principal Architects and evaluating quantifiable impact across all resume claims...
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-g-blue">
          <RefreshCw size={14} className="animate-spin" />
          <span>Running Defense Pipeline...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass rounded-3xl p-8 border border-line dark:border-night-line text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center mx-auto mb-4 text-amber-500">
          <AlertTriangle size={24} />
        </div>
        <h3 className="font-display font-semibold text-base text-ink dark:text-moon mb-2">
          Interview Defense Analysis Unavailable
        </h3>
        <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto mb-5">
          {error || 'Unable to load defense matrix. Please verify this resume has extracted bullet points.'}
        </p>
        <button
          onClick={() => fetchDefense(true)}
          className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-2"
        >
          <RefreshCw size={13} />
          <span>Retry Defense Analysis</span>
        </button>
      </div>
    )
  }

  // Filter bullets
  const filteredBullets = data.bullets.filter((b) => {
    if (filter === 'HIGH') return b.interviewDefense.riskLevel === 'HIGH'
    if (filter === 'MEDIUM') return b.interviewDefense.riskLevel === 'MEDIUM'
    if (filter === 'LOW') return b.interviewDefense.riskLevel === 'LOW'
    if (filter === 'FLUFF') return b.xyzEvaluation.fluffWordsDetected.length > 0
    return true
  })

  const defensibilityScore = Math.round(data.overallDefensibilityScore)
  const scoreColor =
    defensibilityScore >= 75
      ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
      : defensibilityScore >= 50
      ? 'text-amber-500 border-amber-500/30 bg-amber-500/10'
      : 'text-g-red border-g-red/30 bg-g-red/10'

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-g-red/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-g-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-line dark:border-night-line">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-g-red/10 text-g-red border border-g-red/25">
                <ShieldAlert size={12} />
                <span>1-of-1 Category Feature</span>
              </span>
              <span className="text-xs text-ink-soft dark:text-moon-soft flex items-center gap-1">
                <Target size={12} className="text-g-blue" />
                <span>Google X-Y-Z Certified</span>
              </span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink dark:text-moon tracking-tight">
              Reverse Interview Defense Matrix
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft dark:text-moon-soft mt-1 max-w-2xl leading-relaxed">
              We simulate a Principal Staff Architect cross-examining your claims. Every bullet is audited against Google&apos;s strict XYZ formula (*Accomplished [X] as measured by [Y], by doing [Z]*), highlighting claims that will get you grilled in interviews.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDefense(true)}
              disabled={refreshing}
              className="btn-outline-glass text-xs py-2 px-3.5 flex items-center gap-2 text-ink dark:text-moon hover:border-g-blue/60 disabled:opacity-50 transition-all"
              title="Re-run deep defense analysis"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-g-blue' : ''} />
              <span>{refreshing ? 'Re-Auditing...' : 'Re-Run Defense'}</span>
            </button>
          </div>
        </div>

        {/* Metric Gauges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          {/* Gauge 1: Defensibility Score */}
          <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-surface/40 border border-line dark:border-night-line flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl border grid place-items-center shrink-0 ${scoreColor}`}>
              <span className="font-display font-bold text-xl">{defensibilityScore}%</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-g-blue" />
                <span>Defensibility Score</span>
              </div>
              <p className="text-[11px] text-ink-soft dark:text-moon-soft mt-0.5">
                {defensibilityScore >= 75
                  ? 'Strongly grounded against technical grilling'
                  : defensibilityScore >= 50
                  ? 'Moderate risk of interview cross-examination'
                  : 'High risk of failing deep architectural grilling'}
              </p>
            </div>
          </div>

          {/* Gauge 2: Google XYZ Compliance */}
          <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-surface/40 border border-line dark:border-night-line flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border border-g-blue/30 bg-g-blue/10 text-g-blue grid place-items-center shrink-0">
              <span className="font-display font-bold text-xl">{Math.round(data.xyzComplianceRate)}%</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                <Target size={14} className="text-g-blue" />
                <span>Google XYZ Formula</span>
              </div>
              <p className="text-[11px] text-ink-soft dark:text-moon-soft mt-0.5">
                Bullets satisfying *Action + Metric + Context* without robot fluff.
              </p>
            </div>
          </div>

          {/* Gauge 3: Risk Breakdown */}
          <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-surface/40 border border-line dark:border-night-line flex flex-col justify-between">
            <div className="text-xs font-semibold text-ink dark:text-moon flex items-center justify-between">
              <span>Interview Risk Breakdown</span>
              <span className="text-[11px] text-ink-soft dark:text-moon-soft">
                {data.bullets.length} Bullets Audited
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-g-red/10 text-g-red border border-g-red/20">
                {data.riskDistribution.high} High
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {data.riskDistribution.medium} Med
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {data.riskDistribution.low} Low
              </span>
            </div>
          </div>
        </div>

        {/* Strengths & Vulnerabilities Pills */}
        <div className="mt-6 pt-5 border-t border-line dark:border-night-line grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.keyStrengths?.length > 0 && (
            <div className="flex items-start gap-2.5 text-xs text-ink dark:text-moon bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Grounded Strengths: </span>
                <span className="text-ink-soft dark:text-moon-soft">{data.keyStrengths.join(' ')}</span>
              </div>
            </div>
          )}
          {data.topVulnerabilities?.length > 0 && (
            <div className="flex items-start gap-2.5 text-xs text-ink dark:text-moon bg-g-red/5 dark:bg-g-red/10 p-3 rounded-xl border border-g-red/20">
              <Flame size={16} className="text-g-red shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-g-red">Critical Vulnerabilities: </span>
                <span className="text-ink-soft dark:text-moon-soft">{data.topVulnerabilities.join(' ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar (Horizontal scrolling safe for mobile) */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-ink text-white dark:bg-moon dark:text-ink-dark shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep/70 dark:hover:bg-night-surface/70'
            }`}
          >
            All Claims ({data.bullets.length})
          </button>

          <button
            onClick={() => setFilter('HIGH')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'HIGH'
                ? 'bg-g-red text-white shadow-sm'
                : 'text-g-red hover:bg-g-red/10'
            }`}
          >
            <ShieldAlert size={13} />
            <span>High Risk ({data.riskDistribution.high})</span>
          </button>

          <button
            onClick={() => setFilter('MEDIUM')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'MEDIUM'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            <AlertTriangle size={13} />
            <span>Medium Risk ({data.riskDistribution.medium})</span>
          </button>

          <button
            onClick={() => setFilter('LOW')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'LOW'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-emerald-500 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Defensible ({data.riskDistribution.low})</span>
          </button>

          {data.bullets.some((b) => b.xyzEvaluation.fluffWordsDetected.length > 0) && (
            <button
              onClick={() => setFilter('FLUFF')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === 'FLUFF'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-500 hover:bg-purple-500/10'
              }`}
            >
              <Wand2 size={13} />
              <span>Fluff Detected</span>
            </button>
          )}
        </div>

        <span className="text-[11px] text-ink-soft dark:text-moon-soft hidden sm:inline-block">
          Showing {filteredBullets.length} of {data.bullets.length} items
        </span>
      </div>

      {/* Bullets List */}
      <div className="space-y-4">
        {filteredBullets.length === 0 ? (
          <div className="glass rounded-3xl p-8 border border-line dark:border-night-line text-center">
            <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-ink-soft dark:text-moon-soft">
              No bullets match the selected risk filter.
            </p>
          </div>
        ) : (
          filteredBullets.map((item, index) => {
            const isExpanded = Boolean(expandedBullets[item.id])
            const isCopied = copiedBulletId === item.id
            const risk = item.interviewDefense.riskLevel

            const riskBadge =
              risk === 'HIGH'
                ? 'bg-g-red/10 text-g-red border-g-red/30'
                : risk === 'MEDIUM'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className={`glass rounded-2xl p-5 sm:p-6 border transition-all ${
                  risk === 'HIGH'
                    ? 'border-g-red/30 hover:border-g-red/50 shadow-sm'
                    : 'border-line dark:border-night-line hover:border-line-hover dark:hover:border-night-line-hover'
                }`}
              >
                {/* Header Row: Role & Risk Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-canvas-deep dark:bg-night-surface text-ink-soft dark:text-moon-soft border border-line dark:border-night-line">
                      {item.roleOrProject || 'Resume Claim'}
                    </span>
                    <span className="text-[10px] text-ink-soft dark:text-moon-soft uppercase tracking-wider">
                      {item.section}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${riskBadge}`}>
                      {risk === 'HIGH' ? (
                        <ShieldAlert size={13} />
                      ) : risk === 'MEDIUM' ? (
                        <AlertTriangle size={13} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      <span>{risk} INTERVIEW RISK</span>
                    </span>
                  </div>
                </div>

                {/* Original Bullet Statement */}
                <div className="p-3.5 rounded-xl bg-canvas-deep/40 dark:bg-night-surface/40 border border-line dark:border-night-line mb-3.5">
                  <p className="text-xs sm:text-sm font-medium text-ink dark:text-moon leading-relaxed font-sans">
                    &ldquo;{item.originalBullet}&rdquo;
                  </p>
                </div>

                {/* Google XYZ Formula Anatomy Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
                  {/* Action Verb */}
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                      item.xyzEvaluation.hasAction
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                        : 'bg-g-red/10 text-g-red border-g-red/25'
                    }`}
                  >
                    <Check size={11} />
                    <span>Action: {item.xyzEvaluation.actionVerb || 'Missing Action Verb'}</span>
                  </span>

                  {/* Metric */}
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                      item.xyzEvaluation.hasMetric
                        ? 'bg-g-blue/10 text-g-blue border-g-blue/25'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                    }`}
                  >
                    <Target size={11} />
                    <span>Metric: {item.xyzEvaluation.metric || 'No Quantified Metric'}</span>
                  </span>

                  {/* Context */}
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                      item.xyzEvaluation.hasContext
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
                        : 'bg-canvas-deep dark:bg-night-surface text-ink-soft dark:text-moon-soft border-line dark:border-night-line'
                    }`}
                  >
                    <Layers size={11} />
                    <span>Context: {item.xyzEvaluation.context || 'General Context'}</span>
                  </span>

                  {/* Fluff Detected */}
                  {item.xyzEvaluation.fluffWordsDetected.map((fluff, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg border bg-g-yellow/10 text-g-yellow border-g-yellow/30 font-semibold"
                    >
                      Fluff: &ldquo;{fluff}&rdquo;
                    </span>
                  ))}
                </div>

                {/* Why It Is Risky Explanation */}
                <div className="flex items-start gap-2 text-xs text-ink-soft dark:text-moon-soft mb-4 bg-canvas-deep/20 dark:bg-night-surface/20 p-2.5 rounded-xl border border-line/60 dark:border-night-line/60">
                  <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink dark:text-moon">Risk Assessment: </strong>
                    {item.interviewDefense.riskReason}
                  </span>
                </div>

                {/* Google XYZ 1-Click Polish Recommendation */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-g-blue/5 via-g-green/5 to-transparent border border-g-blue/20 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-g-blue flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>Google X-Y-Z Certified Rewrite</span>
                    </span>
                    <button
                      onClick={() => handleCopy(item.id, item.xyzEvaluation.googleXyzRewrite)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-night-surface border border-line dark:border-night-line hover:border-g-blue/50 text-ink dark:text-moon flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="text-g-blue" />
                          <span>Copy XYZ Bullet</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-ink dark:text-moon leading-relaxed">
                    {item.xyzEvaluation.googleXyzRewrite}
                  </p>
                  {item.xyzEvaluation.rewriteExplanation && (
                    <p className="text-[11px] text-ink-soft dark:text-moon-soft mt-1.5 italic">
                      Why this works: {item.xyzEvaluation.rewriteExplanation}
                    </p>
                  )}
                </div>

                {/* Collapsible Simulated Interview Grilling Section */}
                <div className="border-t border-line dark:border-night-line pt-3">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-ink dark:text-moon hover:text-g-red transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal size={14} className="text-g-red" />
                      <span>
                        Simulate Interviewer Grilling ({item.interviewDefense.grillingQuestions?.length || 0} Questions &amp; Cheat Sheet)
                      </span>
                    </span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3 pt-3 overflow-hidden"
                      >
                        {item.interviewDefense.grillingQuestions?.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-3.5 rounded-xl bg-canvas-deep/70 dark:bg-night-surface/70 border border-line dark:border-night-line space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-g-red flex items-center gap-1">
                                <HelpCircle size={12} />
                                <span>{q.interviewerRole || 'Interviewer'}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-white dark:bg-night-panel text-ink-soft dark:text-moon-soft border border-line dark:border-night-line">
                                {q.focusArea || 'System Design'}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-ink dark:text-moon leading-snug">
                              &ldquo;{q.question}&rdquo;
                            </p>

                            {/* Defense Cheat Sheet */}
                            {q.keyPreparationPointers?.length > 0 && (
                              <div className="pt-2 border-t border-line/60 dark:border-night-line/60">
                                <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                                  Tactical Defense Cheat Sheet (How to answer):
                                </span>
                                <ul className="space-y-1 text-[11.5px] text-ink-soft dark:text-moon-soft">
                                  {q.keyPreparationPointers.map((pointer, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-1.5">
                                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                                      <span>{pointer}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
