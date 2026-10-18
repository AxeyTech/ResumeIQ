import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UploadCloud, FileCheck2, Loader2, ShieldCheck, Zap, FileText, Sparkles, ArrowRight } from 'lucide-react'
import ScoreRing from './ScoreRing'

type Stage = 'idle' | 'dragging' | 'analyzing' | 'done'

export default function UploadDemo() {
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const runAnalysis = useCallback((name: string) => {
    setFileName(name)
    setStage('analyzing')
    window.setTimeout(() => setStage('done'), 1900)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      runAnalysis(file ? file.name : 'resume.pdf')
    },
    [runAnalysis],
  )

  const onBrowse = () => inputRef.current?.click()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) runAnalysis(file.name)
  }

  const reset = () => {
    setStage('idle')
    setFileName('')
  }

  return (
    <section id="upload" className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-14"
      >
        <div className="eyebrow justify-center mb-4">Try It Now</div>
        <h2 className="font-display font-semibold text-3xl md:text-[2.6rem] tracking-tight max-w-2xl mx-auto text-ink dark:text-moon">
          See your score in under a minute.
        </h2>
        <p className="font-body text-sm sm:text-base text-ink-soft dark:text-moon-soft max-w-lg mx-auto mt-3">
          Drop in your resume to instantly simulate how enterprise ATS software ranks and filters your application.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto relative group"
      >
        {/* Ambient Shifting Rainbow Glow */}
        <div className="absolute -inset-2.5 rounded-[36px] bg-g-gradient bg-[length:300%_300%] animate-gradient-x blur-2xl opacity-20 dark:opacity-40 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />

        <AnimatePresence mode="wait">
          {stage === 'idle' || stage === 'dragging' ? (
            <motion.div
              key="drop"
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              onDragOver={(e) => {
                e.preventDefault()
                setStage('dragging')
              }}
              onDragLeave={() => setStage('idle')}
              onDrop={onDrop}
              className={`rounded-3xl border-2 border-dashed p-8 sm:p-12 md:p-14 text-center transition-all duration-300 relative z-10 ${
                stage === 'dragging'
                  ? 'border-g-blue bg-white/90 dark:bg-night-panel/90 shadow-glow-blue scale-[1.01]'
                  : 'border-line-strong/40 dark:border-night-line bg-white/80 dark:bg-night-panel/60 backdrop-blur-xl hover:border-g-blue/60 hover:shadow-card'
              }`}
            >
              {/* Centerpiece Icon Badge */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-g-blue/15 via-g-red/10 via-g-yellow/10 to-g-green/15 border border-g-blue/20 flex items-center justify-center text-g-blue mx-auto mb-5 shadow-glow-soft group-hover:scale-105 transition-transform duration-300">
                <UploadCloud size={34} strokeWidth={1.8} className="animate-pulse" />
              </div>

              <h3 className="font-display font-semibold text-xl sm:text-2xl text-ink dark:text-moon mb-2">
                Drag &amp; drop your resume here
              </h3>
              <p className="font-ui text-xs sm:text-sm text-ink-soft dark:text-moon-soft max-w-sm mx-auto mb-6">
                Supports PDF or DOCX formats (up to 10 MB). We never share your data.
              </p>

              {/* Primary Call-to-Action Button */}
              <button
                onClick={onBrowse}
                className="btn-glow text-xs sm:text-sm font-semibold px-7 py-3 rounded-full inline-flex items-center gap-2 mb-4 shadow-glow-blue"
              >
                <FileText size={16} /> Browse Local Files <ArrowRight size={14} />
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={onFileChange}
              />

              {/* Secondary Sample Resume Button */}
              <div className="mt-1">
                <button
                  onClick={() => runAnalysis('sample-resume.pdf')}
                  className="font-ui text-xs font-medium text-g-blue hover:text-g-blue-dim dark:hover:text-moon transition-colors inline-flex items-center gap-1.5 underline underline-offset-4"
                >
                  <Sparkles size={13} /> Or test with a pre-loaded sample resume
                </button>
              </div>

              {/* Trust Badges Footer */}
              <div className="pt-6 mt-8 border-t border-line-soft dark:border-night-line flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-[11px] text-ink-faint dark:text-moon-soft font-ui">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" /> 100% Private &amp; Secure
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-g-yellow" /> Instant 15-Sec Scan
                </span>
                <span className="flex items-center gap-1.5">
                  <FileCheck2 size={14} className="text-g-blue" /> Single-Column ATS Verified
                </span>
              </div>
            </motion.div>
          ) : stage === 'analyzing' ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl glass-strong p-8 sm:p-12 md:p-14 text-center border border-line dark:border-night-line relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-g-blue/10 border border-g-blue/20 flex items-center justify-center text-g-blue mx-auto mb-6 shadow-glow-blue">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h3 className="font-display font-semibold text-xl text-ink dark:text-moon mb-2">
                Analyzing <span className="text-g-blue">{fileName}</span>
              </h3>
              <p className="font-ui text-xs sm:text-sm text-ink-soft dark:text-moon-soft max-w-sm mx-auto mb-6">
                Simulating enterprise ATS parser heuristics, indexing keywords, and calculating persona fit&hellip;
              </p>

              <div className="max-w-xs mx-auto space-y-2 text-left font-ui text-xs text-ink-soft dark:text-moon-soft bg-canvas dark:bg-night-panel/50 p-4 rounded-xl border border-line dark:border-night-line">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Document structure parsed
                </div>
                <div className="flex items-center gap-2 text-g-blue font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-g-blue animate-ping" /> Matching target skills &amp; keywords...
                </div>
                <div className="flex items-center gap-2 text-ink-faint dark:text-moon-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-faint/40" /> Testing screening tripwires
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl glass-strong shadow-frame dark:shadow-night-card p-6 sm:p-10 md:p-12 text-center relative z-10 border border-line dark:border-night-line"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold mb-6">
                <FileCheck2 size={15} />
                <span>SCAN COMPLETE &bull; {fileName}</span>
              </div>

              <div className="flex justify-center mb-6">
                <ScoreRing from={0} to={78} size={160} sublabel={'Was 47 \u2192 Now 78'} />
              </div>

              <p className="font-ui text-xs sm:text-sm text-ink-soft dark:text-moon-soft max-w-md mx-auto mb-6">
                We detected <strong>6 high-impact fixes</strong> to boost your resume score into the top 10% tier.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#dashboard" className="btn-glow text-xs px-6 py-3 rounded-full inline-flex items-center gap-2">
                  View Full Breakdown <ArrowRight size={14} />
                </a>
                <button onClick={reset} className="btn-ghost text-xs py-2 px-4">
                  Analyze another resume
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
