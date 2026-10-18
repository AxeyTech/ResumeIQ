import { useEffect, useId, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

interface ScoreRingProps {
  from?: number
  to: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  delay?: number
  /** Pass a hex color for a flat stroke. Omit to use the signature Google gradient. */
  ringColor?: string
}

export default function ScoreRing({
  from = 0,
  to,
  size = 200,
  strokeWidth = 10,
  label = 'ATS Match Score',
  sublabel,
  delay = 0,
  ringColor,
}: ScoreRingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [display, setDisplay] = useState(from)
  const gradientId = useId()

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    if (!isInView) return
    const controls = animate(from, to, {
      duration: 1.6,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [isInView, from, to, delay])

  const progress = display / 100
  const offset = circumference * (1 - progress)
  const stroke = ringColor ?? `url(#${gradientId})`
  const glowColor = ringColor ?? '#4285F4'


  // Parse comparison sublabel if format matches "Was X → Now Y"
  const comparisonMatch = sublabel ? sublabel.match(/Was\s*(\d+)\s*[→\u2192]\s*Now\s*(\d+)/i) : null
  const prevScore = comparisonMatch ? parseInt(comparisonMatch[1], 10) : null
  const currScore = comparisonMatch ? parseInt(comparisonMatch[2], 10) : null
  const diffScore = prevScore !== null && currScore !== null ? currScore - prevScore : null

  return (
    <div ref={ref} className="flex flex-col items-center select-none">
      <div className="relative group/ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4285F4" />
              <stop offset="35%" stopColor="#EA4335" />
              <stop offset="68%" stopColor="#FBBC05" />
              <stop offset="100%" stopColor="#34A853" />
            </linearGradient>

            {/* Inner soft ambient radial glow behind score */}
            <radialGradient id={`halo-${gradientId}`}>
              <stop offset="0%" stopColor="#4285F4" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#34A853" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Inner Halo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius * 0.88}
            fill={`url(#halo-${gradientId})`}
            className="animate-pulse opacity-80"
          />

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-line-soft/80 dark:stroke-night-line/80"
          />

          {/* Animated Gradient Progress Stroke */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: isInView ? offset : circumference }}
            transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              filter: `drop-shadow(0 0 10px ${glowColor}bb) drop-shadow(0 0 22px ${glowColor}66)`,
            }}
          />
        </svg>

        {/* Center Score Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="font-mono font-extrabold text-ink dark:text-moon leading-none tabular-nums tracking-tight drop-shadow-md"
            style={{ fontSize: size * 0.25 }}
          >
            {display}
          </span>
        </div>
      </div>

      {label && (
        <div className="font-ui text-[11px] font-semibold uppercase tracking-widest2 text-ink dark:text-moon-soft/90 mt-3.5 flex items-center gap-1.5">
          {label}
        </div>
      )}

      {sublabel && (
        comparisonMatch && diffScore !== null ? (
          <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-canvas-deep/90 dark:bg-night-panel/80 border border-line-strong/30 dark:border-white/15 text-xs shadow-md backdrop-blur-md">
            <span className="text-ink-soft dark:text-moon-soft/70 font-mono line-through text-[11px]">
              Was {prevScore}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">&rarr;</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono text-xs">
              Now {currScore}
            </span>
            {diffScore > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                +{diffScore} pts
              </span>
            )}
          </div>
        ) : (
          <div className="font-mono text-[13px] text-ink dark:text-moon-soft mt-1.5">
            {sublabel}
          </div>
        )
      )}
    </div>
  )
}
