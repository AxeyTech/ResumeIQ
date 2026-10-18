import { motion } from 'framer-motion'
import { Search, LayoutGrid, PenLine, History, ShieldCheck, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Keyword Gap Analysis',
    desc: 'See exactly which terms from the job description are missing from your resume, ranked by importance.',
    color: '#4285F4',
    text: 'text-g-blue',
    glow: 'hover:shadow-glow-blue',
  },
  {
    icon: LayoutGrid,
    title: 'ATS Formatting Check',
    desc: 'Catch the layout issues \u2014 tables, text boxes, missing sections \u2014 that silently drop your content.',
    color: '#EA4335',
    text: 'text-g-red',
    glow: 'hover:shadow-glow-red',
  },
  {
    icon: PenLine,
    title: 'Actionable Rewrites',
    desc: 'Vague bullet points rewritten into outcome-driven, quantified statements recruiters actually read.',
    color: '#FBBC05',
    text: 'text-g-yellow',
    glow: 'hover:shadow-glow-yellow',
  },
  {
    icon: History,
    title: 'Version Tracking',
    desc: 'Re-submit as you revise, and watch your keyword match and ATS scores climb across every version.',
    color: '#34A853',
    text: 'text-g-green',
    glow: 'hover:shadow-glow-green',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by Design',
    desc: 'Your resume is encrypted in transit and at rest. Delete your data permanently, any time.',
    color: '#4285F4',
    text: 'text-g-blue',
    glow: 'hover:shadow-glow-blue',
  },
  {
    icon: Sparkles,
    title: 'Plain-English Guidance',
    desc: 'No HR jargon. Every finding comes with a specific, concrete fix you can make in minutes.',
    color: '#EA4335',
    text: 'text-g-red',
    glow: 'hover:shadow-glow-red',
  },
]

export default function Features() {
  return (
    <section id="product" className="max-w-[1200px] mx-auto px-6 md:px-8 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <div className="eyebrow justify-center mb-4">What You Get</div>
        <h2 className="font-display font-semibold text-3xl md:text-[2.6rem] tracking-tight max-w-2xl mx-auto text-ink dark:text-moon">
          Built around one job: get you shortlisted.
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: (i % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4 }}
            className={`group glass rounded-2xl p-8 transition-all duration-300 ${f.glow} hover:border-white/60 dark:hover:border-white/20`}
          >
            <div
              className="w-11 h-11 rounded-xl grid place-items-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{ backgroundColor: `${f.color}1A` }}
            >
              <f.icon size={20} strokeWidth={1.75} className={f.text} />
            </div>
            <h3 className="font-ui font-semibold text-[15px] mb-2.5 text-ink dark:text-moon">{f.title}</h3>
            <p className="text-[13.5px] leading-relaxed text-ink-soft dark:text-moon-soft">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
