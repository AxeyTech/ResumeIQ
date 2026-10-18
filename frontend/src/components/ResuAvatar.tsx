import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ResuMood = 'idle' | 'listening' | 'thinking' | 'happy'

interface ResuAvatarProps {
  mood?: ResuMood
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  interactive?: boolean
  onClick?: () => void
}

export default function ResuAvatar({
  mood = 'idle',
  size = 'md',
  className = '',
  interactive = false,
  onClick,
}: ResuAvatarProps) {
  const [internalMood, setInternalMood] = useState<ResuMood>(mood)
  const [isWinking, setIsWinking] = useState(false)

  // Sync external mood changes
  useEffect(() => {
    setInternalMood(mood)
  }, [mood])

  // Periodic random blinking when idle
  useEffect(() => {
    if (internalMood !== 'idle') return

    const blinkInterval = setInterval(() => {
      // 30% chance to do a double blink
      setIsWinking(true)
      setTimeout(() => {
        setIsWinking(false)
      }, 180)
    }, 3800 + Math.random() * 2000)

    return () => clearInterval(blinkInterval)
  }, [internalMood])

  // Size mapping
  const sizeConfig = {
    xs: { box: 24, radius: 'rounded-lg', antennaH: 4, eyeW: 3, eyeH: 5 },
    sm: { box: 32, radius: 'rounded-xl', antennaH: 5, eyeW: 4, eyeH: 7 },
    md: { box: 42, radius: 'rounded-2xl', antennaH: 6, eyeW: 5, eyeH: 9 },
    lg: { box: 56, radius: 'rounded-2xl', antennaH: 8, eyeW: 7, eyeH: 12 },
    xl: { box: 72, radius: 'rounded-3xl', antennaH: 10, eyeW: 9, eyeH: 16 },
  }[size]

  const currentMood = internalMood

  // Click reaction for fun interactivity
  const handleClick = () => {
    if (interactive) {
      setInternalMood('happy')
      setTimeout(() => setInternalMood(mood), 1800)
    }
    if (onClick) onClick()
  }

  return (
    <motion.div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: sizeConfig.box, height: sizeConfig.box }}
      animate={
        currentMood === 'thinking'
          ? {
              y: [0, -3, 0],
              rotate: [-2, 2, -2],
              transition: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
            }
          : currentMood === 'happy'
          ? {
              y: [0, -5, 0],
              scale: [1, 1.08, 1],
              transition: { duration: 0.6, ease: 'easeOut' },
            }
          : currentMood === 'listening'
          ? {
              scale: 1.05,
              transition: { duration: 0.2 },
            }
          : {
              y: [0, -1.5, 0],
              transition: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
            }
      }
    >
      {/* Outer Glow Halo (Deep Electric Cyan / Blue, No Rainbow!) */}
      <div
        className={`absolute inset-0 ${sizeConfig.radius} transition-all duration-500 ${
          currentMood === 'thinking'
            ? 'bg-sky-500/30 blur-md scale-110 animate-pulse'
            : currentMood === 'happy'
            ? 'bg-emerald-400/35 blur-md scale-115'
            : currentMood === 'listening'
            ? 'bg-blue-500/25 blur-sm scale-105'
            : 'bg-blue-600/15 blur-xs'
        }`}
      />

      {/* Robot Base Shell (Sleek Royal Indigo & Deep Tech Blue - Solid & Premium) */}
      <div
        className={`relative w-full h-full ${sizeConfig.radius} bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border border-blue-400/30 shadow-md flex items-center justify-center overflow-hidden`}
      >
        {/* Soft high-tech inner gloss */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

        {/* Cute Ear Modules on Left and Right */}
        <motion.div
          className="absolute -left-0.5 w-1 h-2 rounded-r-sm bg-blue-300/80"
          animate={currentMood === 'thinking' ? { scaleY: [1, 1.4, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
        <motion.div
          className="absolute -right-0.5 w-1 h-2 rounded-l-sm bg-blue-300/80"
          animate={currentMood === 'thinking' ? { scaleY: [1, 1.4, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />

        {/* Top Antenna Beacon (Little Glowing Ball) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${
              currentMood === 'thinking'
                ? 'bg-amber-300 shadow-[0_0_8px_#FBBF24]'
                : currentMood === 'happy'
                ? 'bg-emerald-300 shadow-[0_0_8px_#34D399]'
                : currentMood === 'listening'
                ? 'bg-sky-300 shadow-[0_0_6px_#38BDF8]'
                : 'bg-sky-400 shadow-[0_0_4px_#38BDF8]'
            }`}
            animate={
              currentMood === 'thinking'
                ? { scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }
                : currentMood === 'happy'
                ? { scale: [1, 1.4, 1] }
                : { opacity: [0.7, 1, 0.7] }
            }
            transition={{ repeat: Infinity, duration: currentMood === 'thinking' ? 0.45 : 2 }}
          />
          <div className="w-0.5 h-1 bg-blue-300/60" />
        </div>

        {/* Dark OLED Visor Screen */}
        <div className="w-[78%] h-[62%] rounded-xl bg-slate-950/90 border border-cyan-500/25 shadow-inner flex flex-col items-center justify-center p-1 relative mt-1.5">
          {/* Subtle Visor Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent opacity-60 rounded-xl pointer-events-none" />

          {/* EYES CONTAINER */}
          <div className="flex items-center justify-center gap-2 w-full">
            {/* Thinking / Scanning Eyes */}
            {currentMood === 'thinking' ? (
              <div className="flex items-center gap-1.5 py-0.5">
                <motion.div
                  className="w-2.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22D3EE]"
                  animate={{ scaleX: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                />
                <motion.div
                  className="w-2.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22D3EE]"
                  animate={{ scaleX: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                />
              </div>
            ) : currentMood === 'happy' ? (
              /* Happy Smiling Eyes (^ ^) */
              <div className="flex items-center gap-2">
                <svg width="10" height="7" viewBox="0 0 10 7" fill="none" className="text-cyan-300 drop-shadow-[0_0_4px_#22D3EE]">
                  <path d="M1 6C2.5 2 7.5 2 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <svg width="10" height="7" viewBox="0 0 10 7" fill="none" className="text-cyan-300 drop-shadow-[0_0_4px_#22D3EE]">
                  <path d="M1 6C2.5 2 7.5 2 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            ) : (
              /* Normal / Idle / Listening Eyes with Blinking */
              <div className="flex items-center gap-2">
                <motion.div
                  className="rounded-full bg-cyan-300 shadow-[0_0_7px_#22D3EE]"
                  style={{ width: sizeConfig.eyeW, height: sizeConfig.eyeH }}
                  animate={
                    isWinking
                      ? { scaleY: 0.1 }
                      : currentMood === 'listening'
                      ? { scale: 1.15 }
                      : { scaleY: 1 }
                  }
                  transition={{ duration: 0.1 }}
                />
                <motion.div
                  className="rounded-full bg-cyan-300 shadow-[0_0_7px_#22D3EE]"
                  style={{ width: sizeConfig.eyeW, height: sizeConfig.eyeH }}
                  animate={
                    isWinking
                      ? { scaleY: 0.1 }
                      : currentMood === 'listening'
                      ? { scale: 1.15 }
                      : { scaleY: 1 }
                  }
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </div>

          {/* Cute Soft Cheek Blush (appears when Happy or Idle) */}
          <AnimatePresence>
            {(currentMood === 'happy' || currentMood === 'idle') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full px-1.5 mt-0.5"
              >
                <span className="w-1 h-0.5 rounded-full bg-pink-400/80 shadow-[0_0_3px_#F472B6]" />
                <span className="w-1 h-0.5 rounded-full bg-pink-400/80 shadow-[0_0_3px_#F472B6]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Sparkle when Happy */}
      {currentMood === 'happy' && (
        <motion.span
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: 1, scale: 1.2, y: -10 }}
          exit={{ opacity: 0 }}
          className="absolute -top-1 -right-1 text-[11px] pointer-events-none select-none"
        >
          ✨
        </motion.span>
      )}
    </motion.div>
  )
}
