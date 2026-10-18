import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Target,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Minus,
  Loader2,
  RefreshCw,
  PlusCircle
} from 'lucide-react'
import { api, VersionTimelineEntry, VersionDelta } from '../services/api'

interface VersionCompareProps {
  resumeId: string
  currentVersionNumber?: number
  onUploadRevision?: () => void
}

export default function VersionCompare({
  resumeId,
  currentVersionNumber = 1,
  onUploadRevision
}: VersionCompareProps) {
  const [timeline, setTimeline] = useState<VersionTimelineEntry[]>([])
  const [deltas, setDeltas] = useState<VersionDelta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeltaIndex, setSelectedDeltaIndex] = useState<number | null>(null)

  const fetchComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.compareVersions(resumeId)
      setTimeline(data.timeline || [])
      setDeltas(data.deltas || [])
      if (data.deltas && data.deltas.length > 0) {
        setSelectedDeltaIndex(data.deltas.length - 1) // default to latest comparison
      }
    } catch (err: any) {
      console.error('Failed to load version comparison:', err)
      setError(err?.message || 'Could not load version history comparison.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (resumeId) {
      fetchComparison()
    }
  }, [resumeId])

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-ink-faint'
    if (score >= 75) return 'text-emerald-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-rose-500'
  }

  if (loading) {
    return (
      <div className="glass rounded-3xl p-6 border border-line dark:border-night-line text-center py-10">
        <Loader2 size={24} className="animate-spin text-g-blue mx-auto mb-2.5" />
        <p className="text-xs text-ink-soft dark:text-moon-soft">
          Analyzing resume version evolution and calculating score deltas...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-3xl p-6 border border-line dark:border-night-line">
        <div className="flex items-center justify-between text-xs text-rose-500 mb-2">
          <span className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={15} /> Version Progression Unavailable
          </span>
          <button
            onClick={fetchComparison}
            className="text-ink-soft hover:text-ink dark:hover:text-moon flex items-center gap-1 underline text-[11px]"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
        <p className="text-xs text-ink-soft dark:text-moon-soft">{error}</p>
      </div>
    )
  }

  // Case 1: Only 1 version analyzed or no history yet
  if (timeline.length < 2) {
    const singleVersion = timeline[0]
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 sm:p-7 border border-line dark:border-night-line relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line dark:border-night-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-g-blue/10 text-g-blue flex items-center justify-center">
              <GitCompare size={20} />
            </div>
            <div>
              <div className="eyebrow mb-0.5">Lineage Tracking</div>
              <h3 className="font-display font-semibold text-base sm:text-lg">
                Resume Evolution &amp; Score Progression
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20 self-start sm:self-auto">
            Version v{singleVersion?.versionNumber || currentVersionNumber}.0 (Baseline)
          </span>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
            <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center gap-1 mb-1">
              <ShieldCheck size={13} className="text-g-green" /> Baseline ATS Compatibility
            </span>
            <div className="font-display font-bold text-2xl">
              <span className={getScoreColor(singleVersion?.atsCompatibilityScore ?? null)}>
                {singleVersion?.atsCompatibilityScore !== null ? `${singleVersion?.atsCompatibilityScore}%` : 'Pending'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
            <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center gap-1 mb-1">
              <Target size={13} className="text-g-blue" /> Baseline Keyword Match
            </span>
            <div className="font-display font-bold text-2xl">
              <span className={getScoreColor(singleVersion?.keywordMatchScore ?? null)}>
                {singleVersion?.keywordMatchScore !== null ? `${singleVersion?.keywordMatchScore}%` : 'Pending'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
            <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center gap-1 mb-1">
              <AlertTriangle size={13} className="text-amber-500" /> Detected Formatting Gaps
            </span>
            <div className="font-display font-bold text-2xl text-amber-500">
              {singleVersion?.issues?.length ?? 0} <span className="text-xs font-normal text-ink-soft">issues</span>
            </div>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-g-blue/5 via-g-green/5 to-transparent border border-g-blue/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-g-yellow shrink-0 mt-0.5" />
            <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed">
              <strong className="text-ink dark:text-moon font-medium">Ready to see your improvement delta?</strong> Use the AI Bullet Optimizer and Checklist to polish your document, then upload revision <strong className="font-mono text-g-blue">v{(singleVersion?.versionNumber || 1) + 1}.0</strong> to unlock side-by-side progression charts, keyword resolution tracking, and recruiter score deltas.
            </p>
          </div>
          {onUploadRevision && (
            <button
              onClick={onUploadRevision}
              className="btn-glow text-xs py-2 px-4 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <PlusCircle size={14} /> Upload Revision v{(singleVersion?.versionNumber || 1) + 1}
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  // Case 2: Multi-version history (2+ versions analyzed)
  const activeDelta = selectedDeltaIndex !== null ? deltas[selectedDeltaIndex] : deltas[deltas.length - 1]
  const latestEntry = timeline[timeline.length - 1]
  const firstEntry = timeline[0]

  const totalAtsDelta = (latestEntry?.atsCompatibilityScore ?? 0) - (firstEntry?.atsCompatibilityScore ?? 0)
  const totalKeywordDelta = (latestEntry?.keywordMatchScore ?? 0) - (firstEntry?.keywordMatchScore ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line relative space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line dark:border-night-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-g-blue/10 text-g-blue flex items-center justify-center">
            <GitCompare size={20} />
          </div>
          <div>
            <div className="eyebrow mb-0.5">Version Comparison Matrix</div>
            <h3 className="font-display font-semibold text-lg text-ink dark:text-moon flex items-center gap-2">
              Score Progression &amp; Delta Intelligence
              <span className="text-xs font-normal font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {timeline.length} Versions Tracked
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onUploadRevision && (
            <button
              onClick={onUploadRevision}
              className="btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <PlusCircle size={13} /> Next Revision (v{latestEntry.versionNumber + 1})
            </button>
          )}
          <button
            onClick={fetchComparison}
            className="p-2 rounded-xl text-ink-soft hover:text-ink dark:hover:text-moon border border-line dark:border-night-line"
            title="Refresh comparison"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Net Evolution Highlights Banner */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ATS Net Progress */}
        <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
          <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center justify-between">
            <span>ATS Format Clearance</span>
            <span className="font-mono text-[10px]">v1 → v{latestEntry.versionNumber}</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl text-ink dark:text-moon">
              {latestEntry.atsCompatibilityScore}%
            </span>
            <span
              className={`text-xs font-bold font-mono flex items-center ${
                totalAtsDelta > 0
                  ? 'text-emerald-500'
                  : totalAtsDelta < 0
                  ? 'text-rose-500'
                  : 'text-ink-soft'
              }`}
            >
              {totalAtsDelta > 0 ? (
                <>
                  <ArrowUpRight size={13} /> +{totalAtsDelta}%
                </>
              ) : totalAtsDelta < 0 ? (
                <>
                  <ArrowDownRight size={13} /> {totalAtsDelta}%
                </>
              ) : (
                <>
                  <Minus size={13} /> 0%
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] text-ink-faint">Baseline was {firstEntry.atsCompatibilityScore}%</span>
        </div>

        {/* Keyword Net Progress */}
        <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
          <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center justify-between">
            <span>Semantic Keyword Match</span>
            <span className="font-mono text-[10px]">v1 → v{latestEntry.versionNumber}</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl text-ink dark:text-moon">
              {latestEntry.keywordMatchScore}%
            </span>
            <span
              className={`text-xs font-bold font-mono flex items-center ${
                totalKeywordDelta > 0
                  ? 'text-emerald-500'
                  : totalKeywordDelta < 0
                  ? 'text-rose-500'
                  : 'text-ink-soft'
              }`}
            >
              {totalKeywordDelta > 0 ? (
                <>
                  <ArrowUpRight size={13} /> +{totalKeywordDelta}%
                </>
              ) : totalKeywordDelta < 0 ? (
                <>
                  <ArrowDownRight size={13} /> {totalKeywordDelta}%
                </>
              ) : (
                <>
                  <Minus size={13} /> 0%
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] text-ink-faint">Baseline was {firstEntry.keywordMatchScore}%</span>
        </div>

        {/* Resolved Issues */}
        <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
          <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center justify-between">
            <span>Remaining Issues</span>
            <span className="font-mono text-[10px]">v{latestEntry.versionNumber}</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl text-ink dark:text-moon">
              {latestEntry.issues?.length || 0}
            </span>
            <span className="text-xs text-ink-soft font-mono">warnings</span>
          </div>
          <span className="text-[10px] text-emerald-500">
            {Math.max(0, (firstEntry.issues?.length || 0) - (latestEntry.issues?.length || 0))} issues eradicated
          </span>
        </div>

        {/* Total Keywords Acquired */}
        <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
          <span className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft flex items-center justify-between">
            <span>Keywords Covered</span>
            <span className="font-mono text-[10px]">v{latestEntry.versionNumber}</span>
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl text-emerald-500">
              {latestEntry.matchedKeywords?.length || 0}
            </span>
            <span className="text-xs text-ink-soft font-mono">
              / {(latestEntry.matchedKeywords?.length || 0) + (latestEntry.missingKeywords?.length || 0)}
            </span>
          </div>
          <span className="text-[10px] text-ink-faint">
            {latestEntry.missingKeywords?.length || 0} skill gaps remaining
          </span>
        </div>
      </div>

      {/* Visual Progression Stepper */}
      <div className="p-5 rounded-2xl bg-canvas-deep/30 dark:bg-night-panel/30 border border-line dark:border-night-line">
        <div className="text-xs font-semibold text-ink-soft dark:text-moon-soft mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={13} className="text-g-blue" /> Version Step-by-Step Trajectory
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scroll-smooth touch-pan-x">
          {timeline.map((entry, idx) => {
            const isLast = idx === timeline.length - 1
            const deltaWithNext = deltas[idx]
            return (
              <div key={entry.resumeId} className="flex items-center gap-3 shrink-0">
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLast
                      ? 'border-g-blue bg-g-blue/10 shadow-glow-soft'
                      : 'border-line dark:border-night-line bg-white dark:bg-night-surface'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-mono text-xs font-bold text-ink dark:text-moon">
                      v{entry.versionNumber}.0
                    </span>
                    <span className="text-[10px] text-ink-faint dark:text-moon-soft">
                      {new Date(entry.analyzedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-[130px]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-soft">ATS:</span>
                      <span className={`font-mono font-bold ${getScoreColor(entry.atsCompatibilityScore)}`}>
                        {entry.atsCompatibilityScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-soft">Match:</span>
                      <span className={`font-mono font-bold ${getScoreColor(entry.keywordMatchScore)}`}>
                        {entry.keywordMatchScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {deltaWithNext && (
                  <div className="flex flex-col items-center justify-center px-1">
                    <div
                      className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                        deltaWithNext.keywordMatchDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {deltaWithNext.keywordMatchDelta >= 0 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      <span>
                        {deltaWithNext.keywordMatchDelta >= 0 ? '+' : ''}
                        {deltaWithNext.keywordMatchDelta}%
                      </span>
                    </div>
                    <div className="w-8 h-0.5 bg-line dark:bg-night-line my-1" />
                    <span className="text-[9px] text-ink-faint font-mono">
                      v{deltaWithNext.fromVersion}→v{deltaWithNext.toVersion}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Delta Inspection Card */}
      {activeDelta && (
        <div className="p-5 sm:p-6 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line dark:border-night-line">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft">
                Deep Delta Analysis:
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-g-blue/10 text-g-blue">
                v{activeDelta.fromVersion}.0 &rarr; v{activeDelta.toVersion}.0
              </span>
            </div>

            {deltas.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-ink-soft dark:text-moon-soft">
                <span>View transition:</span>
                <select
                  value={selectedDeltaIndex ?? 0}
                  onChange={(e) => setSelectedDeltaIndex(Number(e.target.value))}
                  className="rounded-lg bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon text-xs px-2 py-1 focus:outline-none"
                >
                  {deltas.map((d, i) => (
                    <option key={i} value={i} className="bg-white dark:bg-night-panel text-ink dark:text-moon">
                      v{d.fromVersion} to v{d.toVersion}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Newly Resolved / Matched Skills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Newly Incorporated Keywords (
                  {activeDelta.newlyMatchedKeywords.length})
                </span>
                <span className="text-[10px] text-ink-faint">Added in v{activeDelta.toVersion}</span>
              </div>

              {activeDelta.newlyMatchedKeywords.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-line dark:border-night-line text-xs text-ink-soft text-center">
                  No new target keywords added in this revision.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeDelta.newlyMatchedKeywords.map((k) => (
                    <span
                      key={k}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
                    >
                      <CheckCircle2 size={11} /> {k}
                    </span>
                  ))}
                </div>
              )}

              {activeDelta.resolvedKeywords.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-g-blue flex items-center gap-1 mb-1.5">
                    <Sparkles size={12} /> Eradicated Previous Skill Voids:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDelta.resolvedKeywords.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remaining or Newly Missing Skills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Next Opportunities for v{activeDelta.toVersion + 1}
                </span>
                <span className="text-[10px] text-ink-faint">High impact additions</span>
              </div>

              {activeDelta.newMissingKeywords.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Zero skill coverage regressions between these versions!
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-ink-soft">
                    Target skills still pending incorporation for higher ATS pass rates:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDelta.newMissingKeywords.slice(0, 10).map((k) => (
                      <span
                        key={k}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                      >
                        {k}
                      </span>
                    ))}
                    {activeDelta.newMissingKeywords.length > 10 && (
                      <span className="text-xs text-ink-faint self-center">
                        +{activeDelta.newMissingKeywords.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
