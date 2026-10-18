import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -220])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 260])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -160])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45])

  return (
    <div ref={ref} className="fixed inset-0 -z-10 overflow-hidden bg-canvas dark:bg-night transition-colors duration-500">
      <motion.div
        style={{ y: y1 }}
        className="aurora-blob w-[42vw] h-[42vw] bg-g-blue top-[-8%] left-[-6%]"
      />
      <motion.div
        style={{ y: y2 }}
        className="aurora-blob w-[36vw] h-[36vw] bg-g-red top-[8%] right-[-8%]"
      />
      <motion.div
        style={{ y: y3, rotate }}
        className="aurora-blob w-[38vw] h-[38vw] bg-g-yellow bottom-[10%] left-[8%]"
      />
      <motion.div
        style={{ y: y4 }}
        className="aurora-blob w-[34vw] h-[34vw] bg-g-green bottom-[-10%] right-[10%]"
      />

      {/* soft veil so content stays legible over the aurora */}
      <div className="absolute inset-0 bg-canvas/70 dark:bg-night/75 backdrop-blur-[100px]" />
    </div>
  )
}
