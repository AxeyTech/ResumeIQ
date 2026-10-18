import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import ScoreRing from './ScoreRing'

const issues = [
  {
    title: 'Missing "Skills" section header',
    detail: 'ATS parsers look for this exact heading to index your core technical proficiencies.',
    severity: 'High Impact',
    severityColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    type: 'Parser Trap',
  },
  {
    title: '6 target job-description keywords not found',
    detail: '"React", "TypeScript", "CI/CD", and 3 core stack requirements appear in the JD but not in your resume.',
    severity: 'High Impact',
    severityColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    type: 'Keyword Gap',
  },
  {
    title: 'Two-column layout risk detected',
    detail: 'Legacy ATS parsers can read two-column documents sideways. Switching to single-column ensures 100% linear read flow.',
    severity: 'Format Warning',
    severityColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    type: 'Structure',
  },
]

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10 sm:mb-16"
      >
        <div className="eyebrow justify-center mb-4">See It In Action</div>
        <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-[2.6rem] tracking-tight max-w-2xl mx-auto text-ink dark:text-moon">
          Your results, laid out plainly.
        </h2>
        <p className="font-body text-sm sm:text-base text-ink-soft dark:text-moon-soft max-w-lg mx-auto mt-3">
          No vague advice. Direct line-by-line diagnostics with actionable fixes to pass recruiter and ATS screening filters.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong rounded-3xl shadow-frame dark:shadow-night-card overflow-hidden border border-line dark:border-night-line"
      >
        {/* macOS window chrome */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-line dark:border-night-line bg-canvas-deep/70 dark:bg-night-panel/70">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-g-red/80 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-g-yellow/80 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-g-green/80 shadow-xs" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-night-surface/80 border border-line/60 dark:border-white/5 font-mono text-[11px] text-ink-soft dark:text-moon-soft max-w-[280px] sm:max-w-xs truncate shadow-xs">
            <Lock size={11} className="text-emerald-500 shrink-0" />
            <span className="truncate">app.resumeiq.com/analysis/sample-audit</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE AUDIT
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
          {/* Top 3 Metric Cards Grid */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Keywords */}
            <div className="rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-panel/50 p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:border-g-blue/40 transition-colors">
              <ScoreRing to={72} size={82} strokeWidth={6} label="" ringColor="#4285F4" />
              <div className="min-w-0">
                <div className="font-ui text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest2 text-ink-soft dark:text-moon-soft mb-1">
                  Keyword Match
                </div>
                <div className="font-mono text-base font-bold text-g-blue">72 / 100</div>
                <div className="text-[11px] text-ink-faint dark:text-moon-soft mt-0.5 font-medium">6 critical gaps</div>
              </div>
            </div>

            {/* Card 2: ATS Parse */}
            <div className="rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-panel/50 p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:border-g-green/40 transition-colors">
              <ScoreRing to={85} size={82} strokeWidth={6} label="" delay={0.15} ringColor="#34A853" />
              <div className="min-w-0">
                <div className="font-ui text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest2 text-ink-soft dark:text-moon-soft mb-1">
                  ATS Parse Score
                </div>
                <div className="font-mono text-base font-bold text-g-green">85 / 100</div>
                <div className="text-[11px] text-ink-faint dark:text-moon-soft mt-0.5 font-medium">Single-column ready</div>
              </div>
            </div>

            {/* Card 3: Recruiter Persona */}
            <div className="rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-panel/50 p-4 sm:p-5 flex items-center gap-4 sm:gap-5 shadow-sm hover:border-g-yellow/40 transition-colors">
              <ScoreRing to={88} size={82} strokeWidth={6} label="" delay={0.3} ringColor="#FBBC05" />
              <div className="min-w-0">
                <div className="font-ui text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest2 text-ink-soft dark:text-moon-soft mb-1">
                  FAANG Persona
                </div>
                <div className="font-mono text-base font-bold text-g-yellow">88 / 100</div>
                <div className="text-[11px] text-ink-faint dark:text-moon-soft mt-0.5 font-medium">Impact metrics pass</div>
              </div>
            </div>
          </div>

          {/* Top Issues Diagnostic Box */}
          <div className="rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night-panel/50 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-line dark:border-night-line flex items-center justify-between bg-canvas-deep/40 dark:bg-night-surface/40">
              <div className="font-ui text-xs sm:text-[13px] font-semibold uppercase tracking-wider text-ink dark:text-moon flex items-center gap-2">
                <ShieldCheck size={16} className="text-g-blue" />
                <span>Identified Screening Tripwires (3)</span>
              </div>
              <span className="font-mono text-[11px] text-ink-faint dark:text-moon-soft hidden sm:inline">
                Target Role: Senior Software Engineer
              </span>
            </div>

            <div className="divide-y divide-line-soft dark:divide-night-line">
              {issues.map((issue, i) => (
                <motion.div
                  key={issue.title}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group p-4 sm:px-6 sm:py-4 hover:bg-white/70 dark:hover:bg-white/[0.03] transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={16} className={i === 2 ? 'text-amber-500' : 'text-rose-500'} />
                      <span className="font-ui text-xs sm:text-[14px] font-semibold text-ink dark:text-moon">
                        {issue.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="font-mono text-[10px] text-ink-faint dark:text-moon-soft uppercase tracking-wider">
                        {issue.type}
                      </span>
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${issue.severityColor}`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-ink-soft dark:text-moon-soft pl-6 sm:pl-7">
                    {issue.detail}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bottom Action Footer */}
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-canvas-deep/30 dark:bg-night-surface/30 border-t border-line dark:border-night-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-ink-soft dark:text-moon-soft flex items-center gap-1.5 text-center sm:text-left">
                <Sparkles size={14} className="text-g-blue shrink-0" />
                <span>Our AI generates 1-click bullet rewrites and STAR formulas for each issue.</span>
              </div>
              <a
                href="#upload"
                className="btn-glow text-xs py-2.5 px-5 shrink-0 inline-flex items-center gap-2 shadow-glow-blue"
              >
                Scan Your Resume Now <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
