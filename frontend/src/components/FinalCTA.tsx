import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[2rem] glass-strong shadow-frame dark:shadow-night-card p-6 sm:p-14 md:p-20 text-center overflow-hidden"
      >
        <div className="absolute inset-3 sm:inset-4 rounded-[1.5rem] border border-g-blue/20 pointer-events-none" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-30 blur-3xl bg-g-gradient animate-gradient-x bg-[length:200%_auto]"
        />
        <div className="eyebrow justify-center mb-5 sm:mb-6">Ready When You Are</div>
        <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-[2.8rem] tracking-tight max-w-xl mx-auto mb-6 sm:mb-8 text-ink dark:text-moon break-words">
          Your next application deserves better odds.
        </h2>
        <a href="#upload" className="btn-glow mx-auto w-fit text-xs sm:text-sm py-3 px-6 sm:py-3.5 sm:px-7">
          Analyze My Resume <ArrowRight size={16} />
        </a>
      </motion.div>
    </section>
  )
}
