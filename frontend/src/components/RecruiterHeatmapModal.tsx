import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Target,
  RefreshCw,
} from 'lucide-react'
import {
  api,
  HeatmapSimulationResponse,
  GazeFixationPoint,
} from '../services/api'

interface RecruiterHeatmapModalProps {
  resumeId: string
  displayName: string
  isOpen: boolean
  onClose: () => void
}

export default function RecruiterHeatmapModal({
  resumeId,
  displayName,
  isOpen,
  onClose,
}: RecruiterHeatmapModalProps) {
  const [data, setData] = useState<HeatmapSimulationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Interactive controls
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState(true)
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(false)
  const [activeGazeStep, setActiveGazeStep] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'canvas' | 'blind-spots' | 'gaze-sequence'>('canvas')

  const simulationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadHeatmapData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getHeatmapSimulation(resumeId)
      setData(res)
    } catch (err: any) {
      console.error('Failed to load heatmap simulation:', err)
      setError(err?.message || 'Could not compute eye-tracking heatmap.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && resumeId) {
      loadHeatmapData()
    }
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current)
    }
  }, [isOpen, resumeId])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 6-Second Simulation Ticker
  useEffect(() => {
    if (!isPlayingSimulation || !data || data.gazeSequence.length === 0) return

    const totalSteps = data.gazeSequence.length
    const currentStepData = data.gazeSequence[activeGazeStep]
    const stepDurationMs = (currentStepData?.durationSeconds || 1) * 1000

    simulationTimerRef.current = setTimeout(() => {
      if (activeGazeStep < totalSteps - 1) {
        setActiveGazeStep((prev) => prev + 1)
      } else {
        setIsPlayingSimulation(false)
        setActiveGazeStep(0)
      }
    }, stepDurationMs)

    return () => {
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current)
    }
  }, [isPlayingSimulation, activeGazeStep, data])

  const toggleSimulation = () => {
    if (isPlayingSimulation) {
      setIsPlayingSimulation(false)
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current)
    } else {
      setActiveGazeStep(0)
      setIsPlayingSimulation(true)
    }
  }

  const resetSimulation = () => {
    setIsPlayingSimulation(false)
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current)
    setActiveGazeStep(0)
  }

  if (!isOpen) return null

  const activeGazePoint: GazeFixationPoint | undefined =
    data?.gazeSequence[activeGazeStep] || data?.gazeSequence[0]

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
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-canvas dark:bg-night-surface rounded-3xl border border-line dark:border-night-line shadow-2xl overflow-hidden z-10"
        >
          {/* Header Bar */}
          <div className="px-5 sm:px-7 py-4 border-b border-line dark:border-night-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas-deep/40 dark:bg-night-panel/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-g-red via-g-yellow to-g-blue text-white grid place-items-center shadow-glow-soft shrink-0">
                <Flame size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink dark:text-moon">
                    Recruiter 6-Second Attention Heatmap
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-g-red/10 text-g-red border border-g-red/25 uppercase">
                    Eye-Tracking AI
                  </span>
                </div>
                <p className="text-xs text-ink-soft dark:text-moon-soft truncate max-w-md">
                  Auditing <span className="font-semibold text-g-blue">{displayName}</span> • Simulating human recruiter F-pattern gaze and blind spots.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={loadHeatmapData}
                disabled={loading}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-ink-soft hover:text-ink dark:hover:text-moon border border-line dark:border-night-line flex items-center justify-center transition-colors"
                title="Refresh Heatmap"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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

          {/* Sub-Tabs / View Switcher */}
          <div className="px-5 sm:px-7 py-2.5 border-b border-line dark:border-night-line flex flex-wrap items-center justify-between gap-3 bg-canvas/60 dark:bg-night-surface/60 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('canvas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'canvas'
                    ? 'bg-g-red text-white shadow-sm'
                    : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
                }`}
              >
                <Flame size={13} />
                <span>Visual Heatmap Canvas</span>
              </button>

              <button
                onClick={() => setActiveTab('blind-spots')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'blind-spots'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
                }`}
              >
                <AlertTriangle size={13} />
                <span>Blind Spot Alerts ({data?.blindSpotRiskCount || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('gaze-sequence')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'gaze-sequence'
                    ? 'bg-g-blue text-white shadow-sm'
                    : 'text-ink-soft dark:text-moon-soft hover:bg-canvas-deep dark:hover:bg-night-panel'
                }`}
              >
                <Clock size={13} />
                <span>6-Second Gaze Timeline</span>
              </button>
            </div>

            {/* Quick Saliency Stats Pill */}
            {data && (
              <div className="flex items-center gap-3 text-xs text-ink-soft dark:text-moon-soft">
                <span className="flex items-center gap-1 font-semibold text-ink dark:text-moon">
                  <Target size={13} className="text-g-red" />
                  <span>Saliency: {data.saliencyScore}/100</span>
                </span>
                <span className="hidden sm:inline-block">•</span>
                <span className="hidden sm:inline-block">F-Pattern: {data.fPatternCompliance}%</span>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw size={28} className="animate-spin text-g-red mx-auto mb-3" />
                <h4 className="font-display font-semibold text-sm text-ink dark:text-moon mb-1">
                  Computing 6-Second Eye-Tracking Simulation...
                </h4>
                <p className="text-xs text-ink-soft dark:text-moon-soft max-w-sm mx-auto">
                  Running predictive visual saliency algorithms, F-pattern fixation mapping, and blind spot diagnostics.
                </p>
              </div>
            ) : error || !data ? (
              <div className="p-8 text-center glass rounded-2xl border border-line dark:border-night-line">
                <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-ink-soft dark:text-moon-soft">{error || 'Could not compute visual heatmap.'}</p>
              </div>
            ) : (
              <>
                {/* ========================================================= */}
                {/* TAB 1: VISUAL HEATMAP CANVAS & GAZE SIMULATOR             */}
                {/* ========================================================= */}
                {activeTab === 'canvas' && (
                  <div className="space-y-4">
                    {/* Controls Bar */}
                    <div className="p-3 rounded-2xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-line dark:border-night-line flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleSimulation}
                          className={`btn-primary text-xs py-1.5 px-3.5 flex items-center gap-2 font-semibold ${
                            isPlayingSimulation ? 'bg-amber-600 hover:bg-amber-700' : ''
                          }`}
                        >
                          {isPlayingSimulation ? <Pause size={13} /> : <Play size={13} />}
                          <span>{isPlayingSimulation ? 'Pause Simulation' : 'Play 6-Second Simulation'}</span>
                        </button>

                        <button
                          onClick={resetSimulation}
                          className="btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1.5 text-ink dark:text-moon"
                          title="Reset to beginning"
                        >
                          <RotateCcw size={12} />
                          <span>Reset</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                            showHeatmapOverlay
                              ? 'bg-g-red/10 text-g-red border-g-red/30'
                              : 'bg-canvas-deep text-ink-soft dark:text-moon-soft border-line dark:border-night-line'
                          }`}
                        >
                          {showHeatmapOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span>{showHeatmapOverlay ? 'Heatmap Overlay: Active' : 'Heatmap Overlay: Hidden'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Recruiter Thought Bubble */}
                    {activeGazePoint && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-g-red/10 via-g-yellow/10 to-g-blue/10 border border-g-red/25 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-g-red/20 text-g-red grid place-items-center shrink-0 font-bold text-xs">
                          {activeGazePoint.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-g-red flex items-center gap-1.5">
                            <span>Step {activeGazePoint.order} of {data.gazeSequence.length}:</span>
                            <span className="text-ink dark:text-moon truncate">{activeGazePoint.targetName}</span>
                            <span className="text-ink-soft dark:text-moon-soft">({activeGazePoint.durationSeconds}s)</span>
                          </div>
                          <p className="text-xs font-medium text-ink dark:text-moon italic truncate">
                            &ldquo;{activeGazePoint.recruiterThought}&rdquo;
                          </p>
                        </div>
                      </div>
                    )}

                    {/* The Document Canvas with Simulated Heatmap Blobs */}
                    <div className="relative rounded-2xl bg-white dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 p-6 sm:p-10 shadow-lg overflow-hidden select-none font-sans text-xs leading-normal">
                      {/* --- HEATMAP OVERLAY LAYER --- */}
                      {showHeatmapOverlay && (
                        <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300">
                          {/* Top-Left Red Hotspot (Name & Headline: Maximum Gaze) */}
                          <div
                            className="absolute top-4 left-6 sm:top-6 sm:left-10 w-64 h-32 rounded-full blur-2xl opacity-60"
                            style={{
                              background: 'radial-gradient(circle, rgba(234,67,53,0.85) 0%, rgba(251,188,5,0.6) 45%, rgba(52,168,83,0.2) 75%, transparent 100%)',
                            }}
                          />

                          {/* Primary Experience Role Hotspot (Above-the-fold Left Scan) */}
                          <div
                            className="absolute top-28 left-6 sm:top-36 sm:left-10 w-72 h-44 rounded-full blur-2xl opacity-55"
                            style={{
                              background: 'radial-gradient(circle, rgba(234,67,53,0.8) 0%, rgba(251,188,5,0.55) 50%, rgba(66,133,244,0.15) 80%, transparent 100%)',
                            }}
                          />

                          {/* Top-Right Dates Amber Hotspot */}
                          <div
                            className="absolute top-28 right-6 sm:top-36 sm:right-10 w-44 h-24 rounded-full blur-2xl opacity-40"
                            style={{
                              background: 'radial-gradient(circle, rgba(251,188,5,0.7) 0%, rgba(52,168,83,0.3) 60%, transparent 100%)',
                            }}
                          />

                          {/* Middle Experience F-Stem Cyan/Green Glow */}
                          <div
                            className="absolute top-72 left-6 sm:top-84 sm:left-10 w-52 h-36 rounded-full blur-2xl opacity-35"
                            style={{
                              background: 'radial-gradient(circle, rgba(52,168,83,0.6) 0%, rgba(66,133,244,0.3) 60%, transparent 100%)',
                            }}
                          />

                          {/* Bottom-Right "Recruiter Blind Spot" Shading Overlay */}
                          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-64 h-44 rounded-2xl border border-dashed border-g-red/40 bg-g-red/5 backdrop-blur-[0.5px] grid place-items-center p-3 text-center">
                            <span className="text-[10px] font-bold text-g-red tracking-wider uppercase bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded shadow-sm">
                              ⚠️ RECRUITER BLIND SPOT (&lt;18% Gaze)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* --- ANIMATED EYE-TRACKING GAZE CURSOR --- */}
                      {isPlayingSimulation && activeGazePoint && (
                        <motion.div
                          className="absolute z-20 pointer-events-none"
                          animate={{
                            left: `${activeGazePoint.xPercent}%`,
                            top: `${activeGazePoint.yPercent}%`,
                          }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                        >
                          <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                            {/* Outer pulsing ring */}
                            <span className="animate-ping absolute inline-flex h-14 w-14 rounded-full bg-g-red opacity-60" />
                            {/* Inner ring */}
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-g-red/80 shadow-glow-soft grid place-items-center text-white font-bold text-xs">
                              <Eye size={16} />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* --- RESUME CONTENT RENDER --- */}
                      <div className="relative z-0 space-y-5">
                        {/* Header Zone */}
                        <div className="border-b pb-3 border-slate-200 dark:border-slate-800">
                          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {data.rawFormattedContent.header.name}
                          </h1>
                          <div className="text-xs font-semibold text-g-blue mt-0.5">
                            {data.rawFormattedContent.header.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            {data.rawFormattedContent.header.contacts.map((c, i) => (
                              <span key={i}>{c}</span>
                            ))}
                          </div>
                        </div>

                        {/* Experience Section */}
                        <div className="space-y-4">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b pb-1 border-slate-200 dark:border-slate-800">
                            Professional Experience
                          </h2>

                          {data.rawFormattedContent.experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between font-semibold text-slate-900 dark:text-white">
                                <span>{exp.role}</span>
                                <span className="text-[11px] text-slate-500 font-normal">{exp.dates}</span>
                              </div>
                              <ul className="space-y-1 text-[11.5px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                                {exp.bullets.map((b, bIdx) => (
                                  <li key={bIdx} className="leading-relaxed">
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {/* Education Section */}
                        <div className="space-y-2 pt-2">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b pb-1 border-slate-200 dark:border-slate-800">
                            Education &amp; Credentials
                          </h2>
                          {data.rawFormattedContent.education.map((edu, idx) => (
                            <div key={idx} className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300">
                              {edu.degree}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: BLIND SPOT ALERTS & REPOSITIONING DIRECTIVES       */}
                {/* ========================================================= */}
                {activeTab === 'blind-spots' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                      <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          Why Blind Spot Placement Harms Job Search Conversion
                        </h4>
                        <p className="text-xs text-ink-soft dark:text-moon-soft mt-0.5 leading-relaxed">
                          Recruiters scanning resumes follow strict top-left F-patterns. Information placed in trailing bullets (bullet #3+) or the bottom-right quadrant has an <strong>82% drop-off rate</strong>. If your best achievements are placed here, recruiters make rejection decisions before ever reading them.
                        </p>
                      </div>
                    </div>

                    {data.blindSpotAlerts.length === 0 ? (
                      <div className="p-8 text-center glass rounded-2xl border border-line dark:border-night-line">
                        <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                        <h4 className="font-display font-semibold text-sm text-ink dark:text-moon">
                          Zero High-Value Metrics Buried in Blind Spots!
                        </h4>
                        <p className="text-xs text-ink-soft dark:text-moon-soft max-w-sm mx-auto mt-1">
                          Your key quantifiable metrics are positioned within the primary 6-second recruiter gaze sequence.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.blindSpotAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-g-red/30 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-g-red flex items-center gap-1.5">
                                <Flame size={14} />
                                <span>{alert.title}</span>
                              </span>
                              {alert.buriedMetric && (
                                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-g-red/10 text-g-red border border-g-red/20">
                                  Metric: &ldquo;{alert.buriedMetric}&rdquo;
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed">
                              {alert.issue}
                            </p>

                            <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-ink dark:text-moon flex items-start gap-2">
                              <Sparkles size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-emerald-600 dark:text-emerald-400">Optimization Directive: </strong>
                                <span>{alert.fixDirective}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: 6-SECOND GAZE TIMELINE STEPS                       */}
                {/* ========================================================= */}
                {activeTab === 'gaze-sequence' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={15} className="text-g-blue" />
                        <h4 className="text-xs font-bold text-ink dark:text-moon uppercase tracking-wider">
                          The 6-Second Chronological Fixation Sequence
                        </h4>
                      </div>
                      <p className="text-xs text-ink-soft dark:text-moon-soft">
                        Average time distribution based on eye-tracking studies across 500+ tech recruiters.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {data.gazeSequence.map((step) => (
                        <div
                          key={step.order}
                          className="p-3.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-g-blue/10 text-g-blue font-bold text-xs grid place-items-center shrink-0">
                              {step.order}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-ink dark:text-moon">{step.targetName}</div>
                              <div className="text-[11px] text-ink-soft dark:text-moon-soft italic">
                                &ldquo;{step.recruiterThought}&rdquo;
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <span className="font-mono text-xs font-bold text-g-red">
                              {step.durationSeconds}s
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                step.attentionIntensity === 'high'
                                  ? 'bg-g-red/10 text-g-red border-g-red/25'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                              }`}
                            >
                              {step.attentionIntensity} intensity
                            </span>
                          </div>
                        </div>
                      ))}
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
