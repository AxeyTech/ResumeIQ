import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 768 && window.matchMedia('(hover: hover)').matches)
    }
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop, { passive: true })
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  const { scrollYProgress } = useScroll()

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -220])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 260])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -160])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45])

  return (
    <div ref={ref} className="fixed inset-0 -z-10 overflow-hidden bg-canvas dark:bg-night pointer-events-none select-none">
      {isDesktop ? (
        /* Desktop: Parallax transforms enabled with full GPU bandwidth */
        <>
          <motion.div
            style={{ y: y1 }}
            className="aurora-blob w-[42vw] h-[42vw] bg-g-blue top-[-8%] left-[-6%] transform-gpu will-change-transform"
          />
          <motion.div
            style={{ y: y2 }}
            className="aurora-blob w-[36vw] h-[36vw] bg-g-red top-[8%] right-[-8%] transform-gpu will-change-transform"
          />
          <motion.div
            style={{ y: y3, rotate }}
            className="aurora-blob w-[38vw] h-[38vw] bg-g-yellow bottom-[10%] left-[8%] transform-gpu will-change-transform"
          />
          <motion.div
            style={{ y: y4 }}
            className="aurora-blob w-[34vw] h-[34vw] bg-g-green bottom-[-10%] right-[10%] transform-gpu will-change-transform"
          />
        </>
      ) : (
        /* Mobile: Zero JavaScript on scroll! Pure compositor-accelerated CSS ambient blobs for locked 120 FPS */
        <>
          <div className="aurora-blob w-[65vw] h-[65vw] bg-g-blue top-[-10%] left-[-15%] transform-gpu opacity-25 dark:opacity-20" />
          <div className="aurora-blob w-[60vw] h-[60vw] bg-g-red top-[20%] right-[-15%] transform-gpu opacity-20 dark:opacity-15" />
          <div className="aurora-blob w-[55vw] h-[55vw] bg-g-yellow bottom-[25%] left-[5%] transform-gpu opacity-20 dark:opacity-15" />
          <div className="aurora-blob w-[55vw] h-[55vw] bg-g-green bottom-[-10%] right-[-5%] transform-gpu opacity-20 dark:opacity-15" />
        </>
      )}

      {/* Soft veil: On mobile, uses lightweight opacity to eliminate 80px Gaussian blur overdraw; on desktop, keeps rich blur */}
      <div className="absolute inset-0 bg-canvas/92 dark:bg-night/92 sm:bg-canvas/75 sm:dark:bg-night/80 sm:backdrop-blur-[80px]" />
    </div>
  )
}
