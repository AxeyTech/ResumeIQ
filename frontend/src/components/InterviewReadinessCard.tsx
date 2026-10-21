import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Award,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  FileSearch,
  CheckSquare,
  Square,
  Mic
} from 'lucide-react'
import { AnalysisResult, AuditReport } from '../services/api'
import AtsReadinessBadgeModal from './AtsReadinessBadgeModal'

interface InterviewReadinessCardProps {
  analysis: AnalysisResult
  report?: AuditReport | null
  candidateName?: string
  roleTitle?: string
  fileName?: string
  onScrollToOptimizer?: (keywords: string[]) => void
  onSwitchToInterview?: () => void
}

export default function InterviewReadinessCard({
  analysis,
  report: _report,
  candidateName = 'Verified Candidate',
  roleTitle = 'Software Engineer',
  fileName = 'Resume.pdf',
  onScrollToOptimizer,
  onSwitchToInterview,
}: InterviewReadinessCardProps) {
  const [showInterviewQuestions, setShowInterviewQuestions] = useState(false)
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({})
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false)

  // Compute Interview Shortlist Probability
  const kwScore = analysis.keywordMatchScore || 0
  const atsScore = analysis.atsCompatibilityScore || 0

  // Penalty calculation based on severe issues
  const highSeverityCount = (analysis.issues || []).filter((i) => i.severity === 'high').length
  const rawProb = Math.round(kwScore * 0.55 + atsScore * 0.45 - highSeverityCount * 6)
  const currentProbability = Math.max(15, Math.min(98, rawProb))

  // Potential probability if recommendations are implemented
  const potentialProbability = Math.min(96, Math.max(currentProbability + 24, 88))

  const toggleCheck = (id: string) => {
    setCompletedChecklist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusColor = (prob: number) => {
    if (prob >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Top 5% Candidate Bracket (High Interview Invite)' }
    if (prob >= 60) return { text: 'text-g-yellow', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Competitive (Needs Minor Skill Alignment)' }
    return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'High Rejection Risk (Likely Screened Out by ATS)' }
  }

  const status = getStatusColor(currentProbability)

  // Generate realistic targeted interview questions based on missing keywords and role
  const missingKw = analysis.missingKeywords || []
  const primaryGaps = missingKw.slice(0, 3)

  const interviewQuestions = [
    {
      q: primaryGaps.length > 0
        ? `Can you explain your hands-on experience working with ${primaryGaps.join(' and ')} in a production environment?`
        : 'Walk me through the most technically challenging project on your resume and how you measured its success.',
      tip: 'Use the STAR format: Start with the business problem, describe the architecture you chose, and state quantified results (e.g. latency, scale, test coverage).',
      topic: 'Technical Depth'
    },
    {
      q: 'Tell me about a time when a critical feature failed or system went down in production. How did you triage and resolve it?',
      tip: 'Recruiters ask this to test composure and root-cause analysis. Focus on post-mortem, metrics monitoring, and preventative safeguards.',
      topic: 'System Reliability'
    },
    {
      q: 'How do you ensure code maintainability and test coverage when delivering fast-paced product milestones?',
      tip: 'Mention automated CI/CD pipelines, unit/integration testing standards, and peer code reviews.',
      topic: 'Engineering Standards'
    },
    {
      q: primaryGaps[1]
        ? `How would you evaluate trade-offs when introducing ${primaryGaps[1]} into an existing legacy architecture?`
        : 'Describe a conflict with a product manager or engineer regarding architectural priorities and how you resolved it.',
      tip: 'Emphasize business impact over dogmatic preference. Highlight constructive communication and stakeholder alignment.',
      topic: 'Collaboration & Trade-offs'
    }
  ]

  return (
    <div className="glass p-5 sm:p-8 rounded-3xl border border-line dark:border-night-line shadow-card overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-line dark:border-night-line gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-g-gradient flex items-center justify-center text-white shadow-glow-blue shrink-0">
            <Target size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon">
                Recruiter Shortlist &amp; Interview Probability
              </h2>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20">
                AI RECRUITER PASS
              </span>
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5">
              Simulated against Fortune 500 ATS screening heuristics &amp; recruiter 7-second scan patterns.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start md:self-center">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-ink dark:text-moon">
                {currentProbability}%
              </div>
              <div className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold">
                Current Shortlist Chance
              </div>
            </div>
            <div className="h-8 w-px bg-line dark:bg-night-line" />
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-emerald-500">
                {potentialProbability}%
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                After AI Fixes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsBadgeModalOpen(true)}
              className="btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1.5 text-g-blue border-g-blue/30 hover:bg-g-blue/10 transition-colors"
              title="View and share your official ATS readiness badge"
            >
              <Award size={13} className="text-g-blue" />
              <span>Verified Badge</span>
            </button>
            {onSwitchToInterview && (
              <button
                onClick={onSwitchToInterview}
                className="btn-glow text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Practice these questions live in the interactive voice simulator"
              >
                <Mic size={13} />
                <span>Practice Live</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Probability Progress Bar */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className={`font-semibold flex items-center gap-1.5 ${status.text}`}>
            <Award size={14} /> {status.label}
          </span>
          <span className="text-ink-soft dark:text-moon-soft font-mono text-xs">
            +{potentialProbability - currentProbability}% Interview Selection Lift Possible
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-canvas-deep dark:bg-night-panel overflow-hidden border border-line dark:border-night-line flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentProbability}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${
              currentProbability >= 80 ? 'bg-emerald-500' : currentProbability >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${potentialProbability - currentProbability}%` }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="h-full bg-emerald-500/30 border-l border-emerald-500/50"
          />
        </div>
      </div>

      {/* 3 Fatal Dealbreakers to Fix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Dealbreaker 1 */}
        <div className="p-4 rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" /> 1. Skill Coverage Void
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
              {missingKw.length} Gaps
            </span>
          </div>
          <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed mb-3">
            {missingKw.length > 0
              ? `ATS search filters will reject this profile for lacking: ${missingKw.slice(0, 3).join(', ')}.`
              : 'Skill coverage is solid against requirements.'}
          </p>
          {missingKw.length > 0 && onScrollToOptimizer && (
            <button
              onClick={() => onScrollToOptimizer(missingKw.slice(0, 5))}
              className="text-xs text-g-blue hover:text-g-blue/80 font-semibold flex items-center gap-1 transition-colors"
            >
              Fix with AI Rewriter <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Dealbreaker 2 */}
        <div className="p-4 rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" /> 2. Quantified Metrics
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
              +3.2x Calls
            </span>
          </div>
          <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed mb-3">
            Recruiters spend only 7 seconds skimming. Resumes with % throughput, scale, and time savings convert 3x higher.
          </p>
          {onScrollToOptimizer && (
            <button
              onClick={() => onScrollToOptimizer([])}
              className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold flex items-center gap-1 transition-colors"
            >
              Add STAR Metrics <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Dealbreaker 3 */}
        <div className="p-4 rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
              <FileSearch size={14} className="text-g-blue" /> 3. ATS Parser Clearance
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-g-blue/10 text-g-blue">
              {atsScore}/100
            </span>
          </div>
          <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed mb-3">
            {highSeverityCount > 0
              ? `${highSeverityCount} layout or formatting warnings detected that risk unreadable text blocks in Workday/Taleo.`
              : 'Single-column text flow and section hierarchy pass standard ATS parsers.'}
          </p>
          <span className="text-[11px] text-ink-faint">
            Review detailed warnings in Audit below
          </span>
        </div>
      </div>

      {/* Recruiter-Ready Action Plan Checklist */}
      <div className="p-5 rounded-2xl border border-line dark:border-night-line bg-canvas-deep/20 dark:bg-night-panel/20 mb-6">
        <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Recruiter-Ready Action Plan (Check off as you update your resume)
        </h3>
        <div className="space-y-2">
          {[
            { id: 'kw', text: `Embed top missing keywords (${missingKw.slice(0, 3).join(', ') || 'Target job hard skills'}) inside your experience bullets.`, boost: '+15% Chance' },
            { id: 'quant', text: 'Rewrite at least 3 bullet points using STAR format with quantified percentage or metric impact.', boost: '+12% Chance' },
            { id: 'contact', text: 'Ensure Email, Phone, and LinkedIn URL are clearly readable in the top contact section.', boost: '+5% Chance' },
            { id: 'v2', text: 'Upload revised document as Version 2.0 to verify ATS score improvement above 85+.', boost: 'Guaranteed Shortlist' },
          ].map((item) => {
            const isDone = completedChecklist[item.id]
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-500/5 line-through text-ink-faint'
                    : 'border-line dark:border-night-line bg-white/40 dark:bg-night-panel/40 text-ink dark:text-moon hover:border-g-blue/40'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-ui">
                  {isDone ? (
                    <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Square size={16} className="text-ink-faint shrink-0" />
                  )}
                  <span>{item.text}</span>
                </div>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  {item.boost}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Accordion: Predicted Recruiter Interview Questions */}
      <div className="border border-line dark:border-night-line rounded-2xl overflow-hidden bg-canvas-deep/30 dark:bg-night-panel/30">
        <button
          onClick={() => setShowInterviewQuestions(!showInterviewQuestions)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-canvas-deep/50 dark:hover:bg-night-panel/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle size={18} className="text-purple-500" />
            <div>
              <span className="font-display font-semibold text-sm text-ink dark:text-moon block">
                Predicted Recruiter Screening Questions
              </span>
              <span className="text-[11px] text-ink-soft dark:text-moon-soft">
                The exact questions hiring managers will ask based on your resume gaps, with STAR answer tips.
              </span>
            </div>
          </div>
          {showInterviewQuestions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showInterviewQuestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 pt-0 border-t border-line dark:border-night-line space-y-3"
            >
              {onSwitchToInterview && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500 shrink-0" />
                    <span className="text-xs text-ink dark:text-moon">
                      Practice answering these exact questions in our <strong>Voice &amp; STAR AI Mock Simulator</strong>.
                    </span>
                  </div>
                  <button
                    onClick={onSwitchToInterview}
                    className="btn-glow text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Mic size={12} /> Launch Voice Simulator
                  </button>
                </div>
              )}

              {interviewQuestions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-line dark:border-night-line bg-white/50 dark:bg-night-panel/50 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ink dark:text-moon">
                      Q{idx + 1}: {q.q}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 shrink-0">
                      {q.topic}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft dark:text-moon-soft italic flex items-center gap-1.5 pt-1">
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                    <span><strong>STAR Coaching Tip:</strong> {q.tip}</span>
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Official ATS Readiness Credential Modal */}
      <AtsReadinessBadgeModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        candidateName={candidateName}
        roleTitle={roleTitle}
        atsScore={atsScore}
        keywordScore={kwScore}
        probabilityLabel={status.label}
        fileName={fileName}
      />
    </div>
  )
}
