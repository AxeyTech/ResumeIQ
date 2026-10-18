import { motion } from 'framer-motion'
import { ArrowRight, FileText } from 'lucide-react'
import ScoreRing from './ScoreRing'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-16 md:pt-20 pb-16 sm:pb-24 md:pb-32 grid md:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-16 items-center">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="eyebrow mb-5 sm:mb-7">
            Intelligent Resume Review
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display font-semibold text-3xl sm:text-5xl md:text-[3.8rem] leading-[1.08] tracking-tight mb-5 sm:mb-7 text-ink dark:text-moon break-words"
          >
            Stop guessing why
            <br />
            your resume gets
            <br />
            <em className="not-italic text-gradient font-medium">rejected.</em>
          </motion.h1>

          <motion.p
            variants={item}
            className="font-body text-base sm:text-lg leading-relaxed text-ink-soft dark:text-moon-soft max-w-[480px] mb-8 sm:mb-10"
          >
            ResumeIQ scores your resume the way an Applicant Tracking System does &mdash;
            then tells you exactly what to fix, in plain English.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap items-center gap-4 sm:gap-8 mb-8 sm:mb-10">
            <a href="#upload" className="btn-glow text-xs sm:text-sm py-3 px-6 sm:py-3.5 sm:px-7">
              Analyze My Resume <ArrowRight size={16} />
            </a>
            <a href="#dashboard" className="btn-ghost text-xs sm:text-sm">
              <FileText size={15} />
              See a sample report
            </a>
          </motion.div>

          <motion.div
            variants={item}
            className="font-ui text-[11px] sm:text-[12px] tracking-wide text-ink-faint dark:text-moon-soft/60 max-w-sm"
          >
            Built against the same parsing conventions used by ATS platforms at
            Fortune 500 hiring teams.
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6, scale: 1.02 }}
          className="relative group flex justify-center items-center my-4"
        >
          {/* Layer 1: Expansive Shifting Google Rainbow Atmospheric Glow (Active Color Shift) */}
          <div className="absolute -inset-10 sm:-inset-16 rounded-full bg-g-gradient bg-[length:300%_300%] animate-gradient-x blur-[80px] opacity-45 dark:opacity-90 pointer-events-none group-hover:opacity-100 transition-opacity duration-700" />

          {/* Layer 2: Rotating Hypnotic Conic Rainbow Aura Beam */}
          <div className="absolute -inset-4 sm:-inset-6 rounded-full bg-[conic-gradient(from_0deg,#4285F4,#EA4335,#FBBC05,#34A853,#4285F4)] animate-spin-slow blur-2xl opacity-35 dark:opacity-75 pointer-events-none" />

          {/* Layer 3: Chromatic Rainbow Glowing Border Ring (Shifting 4-Color Edge) */}
          <div className="relative p-[2.5px] rounded-full bg-g-gradient bg-[length:250%_250%] animate-gradient-x shadow-xl dark:shadow-2xl">
            {/* Circular Glass Capsule Body - Adaptive Light (Porcelain Glass) & Dark (Obsidian Glass) */}
            <div className="w-[260px] h-[260px] xs:w-[310px] xs:h-[310px] sm:w-[380px] sm:h-[380px] rounded-full bg-white/95 dark:bg-[#07090F]/95 backdrop-blur-3xl relative flex flex-col justify-center items-center overflow-hidden shadow-2xl">
              {/* Top Specular Crescent Rim Reflection */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/70 via-white/10 dark:from-white/25 dark:via-white/5 to-transparent pointer-events-none" />

              {/* Concentric Tech Hairline Rings for Depth */}
              <div className="absolute inset-3.5 sm:inset-4 rounded-full border border-line-soft/80 dark:border-white/10 pointer-events-none" />
              <div className="absolute inset-9 sm:inset-10 rounded-full border border-line-soft/50 dark:border-white/5 pointer-events-none" />

              {/* Centered Score Ring */}
              <div className="relative z-10 scale-[0.78] xs:scale-[0.88] sm:scale-100 transition-transform">
                <ScoreRing from={0} to={92} size={195} delay={0.9} sublabel={'Was 47 \u2192 Now 92'} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
