import { motion } from 'framer-motion'

const points = [
  {
    k: 'Format Rules',
    v: 'Modeled on documented ATS parsing conventions \u2014 section headers, layout, file structure.',
    color: 'from-g-blue to-g-blue-dim',
  },
  {
    k: 'Language Model',
    v: 'Semantic keyword matching, not just literal string search, so paraphrased skills still count.',
    color: 'from-g-red to-g-yellow',
  },
  {
    k: 'Plain Output',
    v: 'Every score comes with the specific line to change \u2014 never just a number and a shrug.',
    color: 'from-g-green to-g-blue',
  },
]

export default function TrustStrip() {
  return (
    <section className="relative border-y border-line dark:border-night-line glass">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-16 grid md:grid-cols-3 gap-10">
        {points.map((p, i) => (
          <motion.div
            key={p.k}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div
              className={`inline-block font-mono text-[11px] mb-3 tracking-wide font-semibold bg-gradient-to-r ${p.color} bg-clip-text text-transparent`}
            >
              {p.k}
            </div>
            <p className="font-body text-[15px] leading-relaxed text-ink-soft dark:text-moon-soft">{p.v}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
