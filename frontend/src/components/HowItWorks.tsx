import { motion } from 'framer-motion'

const steps = [
  {
    n: '01',
    title: 'Upload',
    desc: 'Drop in your existing resume and, if you have one, the target job description you’re aiming for.',
    color: 'text-g-blue',
    border: 'group-hover:border-g-blue',
  },
  {
    n: '02',
    title: 'Deep ATS Scan',
    desc: 'We simulate enterprise ATS parsers, run keyword match diagnostics, and scan recruiter persona tripwires.',
    color: 'text-g-red',
    border: 'group-hover:border-g-red',
  },
  {
    n: '03',
    title: 'Optimize & Build',
    desc: 'Get 1-click bullet point rewrites, STAR impact formulas, and export clean single-column ATS PDFs.',
    color: 'text-g-yellow',
    border: 'group-hover:border-g-yellow',
  },
  {
    n: '04',
    title: 'Interview & Land',
    desc: 'Practice tailored questions in the AI Mock Interview simulator with real-time feedback and walk in ready.',
    color: 'text-g-green',
    border: 'group-hover:border-g-green',
  },
]

export default function HowItWorks() {
  return (
    <section id="process" className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <div className="eyebrow justify-center mb-4">The Process</div>
        <h2 className="font-display font-semibold text-3xl md:text-[2.6rem] tracking-tight text-ink dark:text-moon">
          Four steps. From resume to interview.
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={`group border-t-2 border-line-strong/30 dark:border-moon/20 pt-7 transition-colors duration-300 ${s.border}`}
          >
            <span
              className={`block font-mono text-sm mb-4 transition-transform duration-300 group-hover:translate-x-1 font-semibold ${s.color}`}
            >
              {s.n}
            </span>
            <h3 className="font-body font-semibold text-lg mb-2.5 text-ink dark:text-moon">{s.title}</h3>
            <p className="text-[14px] leading-relaxed text-ink-soft dark:text-moon-soft">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
