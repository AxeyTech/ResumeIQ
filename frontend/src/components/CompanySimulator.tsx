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
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info,
  Users,
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import {
  api,
  PersonaDetail,
  PersonaSimulationsResponse,
  MultiAtsSimulationResponse,
  AtsSystemDetail,
} from '../services/api'

interface CompanySimulatorProps {
  analysisId: string
  resumeId?: string
}

type SimulatorViewMode = 'enterprise-ats' | 'personas'

export default function CompanySimulator({ analysisId, resumeId }: CompanySimulatorProps) {
  const [viewMode, setViewMode] = useState<SimulatorViewMode>('enterprise-ats')

  // Persona State
  const [personaData, setPersonaData] = useState<PersonaSimulationsResponse | null>(null)
  const [activeTier, setActiveTier] = useState<'faang' | 'startup' | 'enterprise'>('faang')
  const [loadingPersona, setLoadingPersona] = useState(true)

  // Multi-ATS State
  const [atsData, setAtsData] = useState<MultiAtsSimulationResponse | null>(null)
  const [activeAtsId, setActiveAtsId] = useState<'workday' | 'taleo' | 'greenhouse' | 'lever'>('workday')
  const [loadingAts, setLoadingAts] = useState(true)
  const [copiedTerminal, setCopiedTerminal] = useState(false)

  const fetchSimulations = async () => {
    setLoadingPersona(true)
    setLoadingAts(true)

    // Fetch Personas
    try {
      if (analysisId) {
        const pRes = await api.getPersonaSimulations(analysisId)
        setPersonaData(pRes)
      }
    } catch (err: any) {
      console.error('Failed to load persona simulations:', err)
    } finally {
      setLoadingPersona(false)
    }

    // Fetch Multi-ATS Simulation
    try {
      if (resumeId) {
        const aRes = await api.getMultiAtsSimulation(resumeId)
        setAtsData(aRes)
        if (aRes.mostVulnerableAts?.id) {
          setActiveAtsId(aRes.mostVulnerableAts.id as any)
        }
      }
    } catch (err: any) {
      console.error('Failed to load multi-ATS simulation:', err)
    } finally {
      setLoadingAts(false)
    }
  }

  useEffect(() => {
    fetchSimulations()
  }, [analysisId, resumeId])

  const handleCopyTerminal = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTerminal(true)
    setTimeout(() => setCopiedTerminal(false), 2000)
  }

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

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    if (score >= 55) return 'text-amber-500 border-amber-500/30 bg-amber-500/10'
    return 'text-g-red border-g-red/30 bg-g-red/10'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      case 'CAUTION':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      default:
        return 'bg-g-red/10 text-g-red border-g-red/30'
    }
  }

  const activeAtsSystem: AtsSystemDetail | undefined =
    atsData?.systems.find((s) => s.id === activeAtsId) || atsData?.systems[0]

  return (
    <div className="glass rounded-3xl p-5 sm:p-8 border border-line dark:border-night-line shadow-card overflow-hidden space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-line dark:border-night-line">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-g-blue via-g-red to-g-green flex items-center justify-center text-white shadow-glow-blue shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon">
                Company &amp; Multi-ATS Parser Simulator
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20">
                1-of-1 Engine
              </span>
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5">
              Simulate exact parsing quirks of Workday, Taleo, Greenhouse, and Lever alongside hiring team priorities.
            </p>
          </div>
        </div>

        {/* View Mode Toggle Strip */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="p-1 rounded-xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line dark:border-night-line flex items-center gap-1">
            <button
              onClick={() => setViewMode('enterprise-ats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'enterprise-ats'
                  ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-2xs border border-line dark:border-night-line'
                  : 'text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
              }`}
            >
              <Building2 size={13} className={viewMode === 'enterprise-ats' ? 'text-g-blue' : ''} />
              <span>Big-4 ATS Parsers</span>
            </button>

            <button
              onClick={() => setViewMode('personas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'personas'
                  ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-2xs border border-line dark:border-night-line'
                  : 'text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
              }`}
            >
              <Users size={13} className={viewMode === 'personas' ? 'text-purple-500' : ''} />
              <span>Recruiter Personas</span>
            </button>
          </div>

          <button
            onClick={fetchSimulations}
            className="p-2 rounded-xl text-ink-soft hover:text-ink dark:hover:text-moon border border-line dark:border-night-line shrink-0"
            title="Refresh simulation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: BIG-4 ENTERPRISE ATS PARSERS (Workday, Taleo, Greenhouse, Lever)  */}
      {/* ========================================================================= */}
      {viewMode === 'enterprise-ats' && (
        <div className="space-y-6">
          {loadingAts ? (
            <div className="py-12 text-center">
              <RefreshCw size={24} className="animate-spin text-g-blue mx-auto mb-2.5" />
              <p className="text-xs text-ink-soft dark:text-moon-soft">
                Auditing layout against Workday table-flattening bugs, Taleo date rules, and Greenhouse scorecards...
              </p>
            </div>
          ) : !atsData ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
              Multi-ATS simulator data could not be computed for this resume.
            </div>
          ) : (
            <>
              {/* High-Level Comparison Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-g-blue/10 border border-g-blue/20 text-g-blue grid place-items-center shrink-0">
                    <span className="font-display font-bold text-lg">{atsData.overallMultiAtsScore}%</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink dark:text-moon">Average Clearance</div>
                    <p className="text-[11px] text-ink-soft dark:text-moon-soft">
                      Combined pass rate across enterprise parsers
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 grid place-items-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Safest: {atsData.safestAts.name}
                    </div>
                    <p className="text-[11px] text-ink-soft dark:text-moon-soft">
                      Highest compatibility ({atsData.safestAts.score}%)
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-g-red/5 dark:bg-g-red/10 border border-g-red/20 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-g-red/10 border border-g-red/20 text-g-red grid place-items-center shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-g-red">
                      High Risk: {atsData.mostVulnerableAts.name}
                    </div>
                    <p className="text-[11px] text-ink-soft dark:text-moon-soft truncate">
                      {atsData.mostVulnerableAts.primaryHazard}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Systems Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {atsData.systems.map((sys) => {
                  const isSelected = activeAtsId === sys.id
                  const scoreCls = getScoreColor(sys.score)
                  const statusCls = getStatusBadge(sys.status)

                  return (
                    <button
                      key={sys.id}
                      onClick={() => setActiveAtsId(sys.id)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-g-blue/10 border-g-blue shadow-glow-soft'
                          : 'bg-canvas-deep/30 dark:bg-night-panel/30 border-line dark:border-night-line hover:border-g-blue/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-ink dark:text-moon flex items-center gap-1.5">
                            <span>{sys.name}</span>
                          </div>
                          <span className="text-[10px] text-ink-soft dark:text-moon-soft">
                            {sys.marketShare}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls}`}>
                          {sys.status}
                        </span>
                      </div>

                      <div className="flex items-end justify-between gap-2 pt-2 border-t border-line/40 dark:border-night-line/40">
                        <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${scoreCls}`}>
                          {sys.score}% Match
                        </div>
                        <span className="text-[10.5px] text-ink-soft dark:text-moon-soft flex items-center gap-1">
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Active ATS Deep-Dive Detail Card */}
              {activeAtsSystem && (
                <div className="p-5 sm:p-7 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-6">
                  {/* System Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line dark:border-night-line">
                    <div>
                      <div className="eyebrow text-g-blue mb-1">Active ATS Emulation</div>
                      <h4 className="font-display font-bold text-xl text-ink dark:text-moon flex items-center gap-2">
                        <span>{activeAtsSystem.name}</span>
                        <span className="text-xs font-normal text-ink-soft dark:text-moon-soft">
                          by {activeAtsSystem.vendor}
                        </span>
                      </h4>
                      <p className="text-xs text-ink-soft dark:text-moon-soft mt-1">
                        Emulating actual parsing pipeline used by: <strong>{activeAtsSystem.topEmployers.join(', ')}</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${getStatusBadge(activeAtsSystem.status)}`}>
                        {activeAtsSystem.status === 'PASSED'
                          ? 'Clear of Disqualification'
                          : activeAtsSystem.status === 'CAUTION'
                          ? 'Moderate Parsing Friction'
                          : 'High Disqualification Risk'}
                      </span>
                    </div>
                  </div>

                  {/* Quirks & Rules Checklist */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-moon flex items-center gap-1.5">
                      <Layers size={13} className="text-g-blue" />
                      <span>Platform-Specific Parsing Rules &amp; Quirks</span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeAtsSystem.quirks.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                              {q.status === 'PASS' ? (
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              ) : q.status === 'WARNING' ? (
                                <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                              ) : (
                                <ShieldAlert size={13} className="text-g-red shrink-0" />
                              )}
                              <span>{q.name}</span>
                            </span>
                            <span
                              className={`text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                q.status === 'PASS'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : q.status === 'WARNING'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-g-red/10 text-g-red'
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-ink-soft dark:text-moon-soft leading-relaxed pl-5">
                            {q.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Emulation Window */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-moon flex items-center gap-1.5">
                        <Terminal size={13} className="text-g-green" />
                        <span>Machine Ingestion Terminal View (&ldquo;What {activeAtsSystem.name} Ingests&rdquo;)</span>
                      </span>
                      <button
                        onClick={() => handleCopyTerminal(activeAtsSystem.emulatedParserView)}
                        className="text-[11px] font-semibold text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon flex items-center gap-1"
                      >
                        {copiedTerminal ? (
                          <>
                            <Check size={11} className="text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy Terminal Output</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-ink-dark dark:bg-[#07090E] border border-night-line font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed scrollbar-none">
                      {activeAtsSystem.emulatedParserView}
                    </div>
                  </div>

                  {/* Actionable Fix Directive */}
                  <div className="p-4 rounded-xl bg-g-blue/5 dark:bg-g-blue/10 border border-g-blue/20 flex items-start gap-3">
                    <Info size={16} className="text-g-blue shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-g-blue block mb-0.5">
                        High-Impact Actionable Fix for {activeAtsSystem.name}:
                      </span>
                      <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed">
                        {activeAtsSystem.actionableFix}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: RECRUITER PERSONA HEURISTICS (FAANG vs Startup vs Enterprise)     */}
      {/* ========================================================================= */}
      {viewMode === 'personas' && (
        <div className="space-y-6">
          {loadingPersona ? (
            <div className="py-12 text-center">
              <RefreshCw size={24} className="animate-spin text-g-blue mx-auto mb-2.5" />
              <p className="text-xs text-ink-soft dark:text-moon-soft">
                Evaluating candidate alignment across FAANG, Startups, and Enterprises...
              </p>
            </div>
          ) : !personaData || !personaData.personas ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
              Recruiter persona simulations are currently unavailable.
            </div>
          ) : (
            <>
              {/* Company Tier Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'faang', label: 'FAANG & Top Product', count: `${personaData.personas.faang.score}% Match` },
                    { id: 'startup', label: 'High-Growth Startups', count: `${personaData.personas.startup.score}% Match` },
                    { id: 'enterprise', label: 'Global Enterprise & IT', count: `${personaData.personas.enterprise.score}% Match` },
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
              {(() => {
                const currentPersona: PersonaDetail = personaData.personas[activeTier] || personaData.personas.faang
                return (
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

                        <div className="flex items-center gap-4 self-center sm:self-auto">
                          <ScoreRing
                            to={currentPersona.score}
                            size={76}
                            strokeWidth={7}
                            label="Match"
                            ringColor={currentPersona.score >= 75 ? '#34A853' : currentPersona.score >= 50 ? '#FBBC05' : '#EA4335'}
                          />
                        </div>
                      </div>

                      {/* Radar Breakdown Metrics */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                          <Sparkles size={13} className="text-g-blue" />
                          <span>Key Hiring Signals Evaluated:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentPersona.criteria?.map((b, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-white/70 dark:bg-night-surface/70 border border-line dark:border-night-line space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-ink dark:text-moon">{b.label}</span>
                                <span className="font-mono font-bold text-ink-soft dark:text-moon-soft">{b.score}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-line dark:bg-night-line overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 bg-g-blue"
                                  style={{ width: `${b.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Positive Signals & Improvements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>What Impresses This Persona:</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-ink-soft dark:text-moon-soft">
                            {currentPersona.strengths?.map((sig, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span>{sig}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            <span>Persona-Specific Friction &amp; Gaps:</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-ink-soft dark:text-moon-soft">
                            {currentPersona.redFlags?.map((adv, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{adv}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )
              })()}
            </>
          )}
        </div>
      )}
    </div>
  )
}
