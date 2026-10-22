import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ResuMood = 'idle' | 'listening' | 'thinking' | 'happy'

interface ResuAvatarProps {
  mood?: ResuMood
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  interactive?: boolean
  showOrbit?: boolean
  onClick?: () => void
}

export default function ResuAvatar({
  mood = 'idle',
  size = 'md',
  className = '',
  interactive = false,
  showOrbit = true,
  onClick,
}: ResuAvatarProps) {
  const [internalMood, setInternalMood] = useState<ResuMood>(mood)
  const [isWinking, setIsWinking] = useState(false)
  const [eyeGlance, setEyeGlance] = useState<'center' | 'left' | 'right'>('center')
  const [isHovered, setIsHovered] = useState(false)

  // Sync external mood changes
  useEffect(() => {
    setInternalMood(mood)
  }, [mood])

  // Natural random blinking & glance behavior when idle
  useEffect(() => {
    if (internalMood !== 'idle') return

    // Blinking timer
    const blinkInterval = setInterval(() => {
      setIsWinking(true)
      setTimeout(() => {
        setIsWinking(false)
      }, 160)
    }, 3400 + Math.random() * 2200)

    // Playful eye glancing timer
    const glanceInterval = setInterval(() => {
      const glances: ('center' | 'left' | 'right')[] = ['center', 'left', 'right', 'center']
      const chosen = glances[Math.floor(Math.random() * glances.length)]
      setEyeGlance(chosen)
      setTimeout(() => setEyeGlance('center'), 1400)
    }, 5500 + Math.random() * 3000)

    return () => {
      clearInterval(blinkInterval)
      clearInterval(glanceInterval)
    }
  }, [internalMood])

  // Size mapping with pixel-perfect proportions
  const sizeConfig = {
    xs: {
      box: 26,
      radius: 'rounded-xl',
      visorRadius: 'rounded-lg',
      antennaH: 4,
      eyeW: 3,
      eyeH: 6,
      orbitR: 18,
    },
    sm: {
      box: 38,
      radius: 'rounded-2xl',
      visorRadius: 'rounded-xl',
      antennaH: 5,
      eyeW: 4.5,
      eyeH: 8.5,
      orbitR: 24,
    },
    md: {
      box: 48,
      radius: 'rounded-2xl',
      visorRadius: 'rounded-xl',
      antennaH: 6,
      eyeW: 5.5,
      eyeH: 10.5,
      orbitR: 30,
    },
    lg: {
      box: 64,
      radius: 'rounded-3xl',
      visorRadius: 'rounded-2xl',
      antennaH: 8,
      eyeW: 7.5,
      eyeH: 14,
      orbitR: 40,
    },
    xl: {
      box: 84,
      radius: 'rounded-[28px]',
      visorRadius: 'rounded-2xl',
      antennaH: 10,
      eyeW: 10,
      eyeH: 18,
      orbitR: 52,
    },
  }[size]

  const currentMood = isHovered && interactive ? 'happy' : internalMood

  // Click reaction for fun interactivity
  const handleClick = () => {
    if (interactive) {
      setInternalMood('happy')
      setTimeout(() => setInternalMood(mood), 2000)
    }
    if (onClick) onClick()
  }

  // Calculate eye glance offset
  const eyeOffset = eyeGlance === 'left' ? -2 : eyeGlance === 'right' ? 2 : 0

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        interactive ? 'cursor-pointer active:scale-95' : ''
      } ${className}`}
      style={{ width: sizeConfig.box, height: sizeConfig.box }}
      animate={
        currentMood === 'thinking'
          ? {
              y: [0, -3.5, 0],
              rotate: [-2, 2.5, -2],
              transition: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
            }
          : currentMood === 'happy'
          ? {
              y: [0, -6, 0],
              scale: [1, 1.1, 1],
              rotate: [0, -4, 4, 0],
              transition: { duration: 0.6, ease: 'easeOut' },
            }
          : currentMood === 'listening'
          ? {
              scale: 1.06,
              y: -1.5,
              transition: { duration: 0.25 },
            }
          : {
              y: [0, -2.5, 0],
              transition: { repeat: Infinity, duration: 3.4, ease: 'easeInOut' },
            }
      }
    >
      {/* 1. Dynamic Holographic Orbital Energy Ring (for sm and above) */}
      {showOrbit && size !== 'xs' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
          className="absolute inset-[-6px] rounded-full pointer-events-none opacity-70"
          style={{
            background:
              currentMood === 'happy'
                ? 'conic-gradient(from 0deg, transparent 0deg, rgba(52, 211, 153, 0.6) 180deg, transparent 360deg)'
                : currentMood === 'thinking'
                ? 'conic-gradient(from 0deg, transparent 0deg, rgba(251, 191, 36, 0.6) 180deg, transparent 360deg)'
                : 'conic-gradient(from 0deg, transparent 0deg, rgba(56, 189, 248, 0.5) 180deg, transparent 360deg)',
            filter: 'blur(1.5px)',
          }}
        />
      )}

      {/* 2. Soft Ambient Aura Glow behind Resu */}
      <div
        className={`absolute inset-[-2px] ${sizeConfig.radius} transition-all duration-500 pointer-events-none ${
          currentMood === 'thinking'
            ? 'bg-amber-400/30 blur-md scale-115 animate-pulse'
            : currentMood === 'happy'
            ? 'bg-emerald-400/40 blur-lg scale-120'
            : currentMood === 'listening'
            ? 'bg-cyan-400/30 blur-md scale-110'
            : 'bg-gradient-to-tr from-blue-600/25 via-cyan-500/20 to-purple-600/25 blur-sm'
        }`}
      />

      {/* 3. Main Aerodynamic Cyber-Chassis (Obsidian Titanium & Deep Sapphire) */}
      <div
        className={`relative w-full h-full ${sizeConfig.radius} bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#090D16] border border-cyan-400/40 shadow-[0_4px_16px_rgba(14,165,233,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center overflow-hidden`}
      >
        {/* Specular Curved Rim Highlight (Apple Vision style gloss) */}
        <div className="absolute top-0 inset-x-0 h-[40%] bg-gradient-to-b from-white/35 via-white/5 to-transparent rounded-t-2xl pointer-events-none" />

        {/* Cyber Acoustic Fins / Ear Modules (Left & Right) */}
        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
          <motion.div
            className="w-1 rounded-r-sm bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_6px_#38BDF8]"
            style={{ height: size === 'xs' ? 6 : size === 'sm' ? 9 : 12 }}
            animate={
              currentMood === 'listening'
                ? { scaleY: [0.8, 1.4, 0.7, 1.2, 0.8] }
                : currentMood === 'thinking'
                ? { scaleY: [1, 1.3, 1] }
                : { scaleY: 1 }
            }
            transition={{ repeat: Infinity, duration: currentMood === 'listening' ? 0.6 : 1.2 }}
          />
        </div>

        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
          <motion.div
            className="w-1 rounded-l-sm bg-gradient-to-l from-cyan-400 to-sky-300 shadow-[0_0_6px_#38BDF8]"
            style={{ height: size === 'xs' ? 6 : size === 'sm' ? 9 : 12 }}
            animate={
              currentMood === 'listening'
                ? { scaleY: [1.2, 0.7, 1.4, 0.8, 1.2] }
                : currentMood === 'thinking'
                ? { scaleY: [1, 1.3, 1] }
                : { scaleY: 1 }
            }
            transition={{ repeat: Infinity, duration: currentMood === 'listening' ? 0.6 : 1.2 }}
          />
        </div>

        {/* Top Photon Antenna Core with Crystalline Beacon */}
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <motion.div
            className={`rounded-full shadow-lg transition-colors ${
              currentMood === 'thinking'
                ? 'bg-amber-300 shadow-[0_0_10px_#FBBF24]'
                : currentMood === 'happy'
                ? 'bg-emerald-300 shadow-[0_0_10px_#34D399]'
                : currentMood === 'listening'
                ? 'bg-sky-300 shadow-[0_0_8px_#38BDF8]'
                : 'bg-gradient-to-tr from-cyan-400 to-sky-200 shadow-[0_0_6px_#38BDF8]'
            }`}
            style={{
              width: size === 'xs' ? 3 : size === 'sm' ? 4.5 : size === 'md' ? 6 : 8,
              height: size === 'xs' ? 3 : size === 'sm' ? 4.5 : size === 'md' ? 6 : 8,
            }}
            animate={
              currentMood === 'thinking'
                ? { scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }
                : currentMood === 'happy'
                ? { scale: [1, 1.35, 1] }
                : { opacity: [0.8, 1, 0.8], scale: [1, 1.08, 1] }
            }
            transition={{ repeat: Infinity, duration: currentMood === 'thinking' ? 0.45 : 2 }}
          />
          <div
            className="bg-slate-400/80 rounded-b-xs"
            style={{
              width: size === 'xs' ? 1 : 1.5,
              height: size === 'xs' ? 2 : size === 'sm' ? 3 : 4,
            }}
          />
        </div>

        {/* 4. Deep Curved OLED Visor Screen (Tinted Astronaut Glass Faceplate) */}
        <div
          className={`w-[80%] h-[64%] ${sizeConfig.visorRadius} bg-gradient-to-b from-[#050B14] via-[#02050A] to-[#010307] border border-cyan-500/35 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9),0_0_12px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center relative mt-1 overflow-hidden`}
        >
          {/* Visor Specular Reflection Line */}
          <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-cyan-300/20 via-transparent to-transparent pointer-events-none" />

          {/* EYES CONTAINER */}
          <div className="flex items-center justify-center gap-2 w-full relative z-10 px-1">
            {/* Mode A: Thinking Scan Beam */}
            {currentMood === 'thinking' ? (
              <div className="flex items-center gap-1.5 py-0.5">
                <motion.div
                  className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 shadow-[0_0_8px_#FBBF24]"
                  style={{
                    width: size === 'xs' ? 5 : size === 'sm' ? 8 : 11,
                    height: size === 'xs' ? 3 : size === 'sm' ? 4 : 5.5,
                  }}
                  animate={{ scaleX: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                />
                <motion.div
                  className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 shadow-[0_0_8px_#FBBF24]"
                  style={{
                    width: size === 'xs' ? 5 : size === 'sm' ? 8 : 11,
                    height: size === 'xs' ? 3 : size === 'sm' ? 4 : 5.5,
                  }}
                  animate={{ scaleX: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                />
              </div>
            ) : currentMood === 'happy' ? (
              /* Mode B: Adorable Curved Smiling Eyes (^ ^) */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg
                  width={size === 'xs' ? 8 : size === 'sm' ? 12 : 15}
                  height={size === 'xs' ? 5 : size === 'sm' ? 8 : 10}
                  viewBox="0 0 14 9"
                  fill="none"
                  className="text-cyan-300 drop-shadow-[0_0_6px_#22D3EE]"
                >
                  <path
                    d="M1.5 7.5C3.5 2 10.5 2 12.5 7.5"
                    stroke="currentColor"
                    strokeWidth={size === 'xs' ? 2 : 2.5}
                    strokeLinecap="round"
                  />
                </svg>
                <svg
                  width={size === 'xs' ? 8 : size === 'sm' ? 12 : 15}
                  height={size === 'xs' ? 5 : size === 'sm' ? 8 : 10}
                  viewBox="0 0 14 9"
                  fill="none"
                  className="text-cyan-300 drop-shadow-[0_0_6px_#22D3EE]"
                >
                  <path
                    d="M1.5 7.5C3.5 2 10.5 2 12.5 7.5"
                    stroke="currentColor"
                    strokeWidth={size === 'xs' ? 2 : 2.5}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ) : (
              /* Mode C: Luminous Expressive Digital Eyes with Pupil Gleam & Blinking */
              <motion.div
                className="flex items-center gap-1.5 sm:gap-2"
                animate={{ x: eyeOffset }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Left Eye */}
                <motion.div
                  className="relative rounded-full bg-gradient-to-b from-cyan-200 via-cyan-400 to-sky-500 shadow-[0_0_8px_#22D3EE,0_0_16px_rgba(34,211,238,0.5)] flex items-center justify-center overflow-hidden"
                  style={{ width: sizeConfig.eyeW, height: sizeConfig.eyeH }}
                  animate={
                    isWinking
                      ? { scaleY: 0.1 }
                      : currentMood === 'listening'
                      ? { scale: 1.2 }
                      : { scaleY: 1 }
                  }
                  transition={{ duration: 0.1 }}
                >
                  {/* Internal Pupil Gleam for Organic 3D Depth */}
                  <span className="absolute top-0.5 right-0.5 w-[35%] h-[35%] rounded-full bg-white opacity-95 shadow-xs" />
                </motion.div>

                {/* Right Eye */}
                <motion.div
                  className="relative rounded-full bg-gradient-to-b from-cyan-200 via-cyan-400 to-sky-500 shadow-[0_0_8px_#22D3EE,0_0_16px_rgba(34,211,238,0.5)] flex items-center justify-center overflow-hidden"
                  style={{ width: sizeConfig.eyeW, height: sizeConfig.eyeH }}
                  animate={
                    isWinking
                      ? { scaleY: 0.1 }
                      : currentMood === 'listening'
                      ? { scale: 1.2 }
                      : { scaleY: 1 }
                  }
                  transition={{ duration: 0.1 }}
                >
                  {/* Internal Pupil Gleam */}
                  <span className="absolute top-0.5 right-0.5 w-[35%] h-[35%] rounded-full bg-white opacity-95 shadow-xs" />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Neon Pink Cyber Cheek Blush */}
          <AnimatePresence>
            {(currentMood === 'happy' || currentMood === 'idle') && size !== 'xs' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: currentMood === 'happy' ? 0.95 : 0.65 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between w-full px-2 mt-0.5 relative z-10"
              >
                <span className="w-1.5 h-0.5 rounded-full bg-pink-400 shadow-[0_0_5px_#F472B6]" />
                <span className="w-1.5 h-0.5 rounded-full bg-pink-400 shadow-[0_0_5px_#F472B6]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Sparkles when Happy or Clicked */}
      <AnimatePresence>
        {currentMood === 'happy' && (
          <motion.span
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -12 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-2 -right-2 text-xs pointer-events-none select-none drop-shadow-[0_0_6px_#FDE047]"
          >
            ✨
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
