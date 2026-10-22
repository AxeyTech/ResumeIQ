import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : undefined
    const y = rect ? rect.top + rect.height / 2 : undefined
    toggleTheme(x, y)
  }

  const label = theme === 'dark' ? 'Dark' : 'Light'

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="relative inline-flex items-center justify-center sm:gap-2 rounded-full glass w-8 h-8 sm:w-auto p-0 sm:px-3 sm:py-2
                 text-ink dark:text-moon overflow-hidden shrink-0
                 transition-all duration-300 hover:shadow-glow-blue hover:border-g-blue/40"
    >
      <span className="relative grid place-items-center w-4 h-4 shrink-0">
        <AnimatePresence initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            {theme === 'dark' ? (
              <Moon size={15} className="text-g-blue" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
            ) : (
              <Sun size={15} className="text-g-yellow" strokeWidth={2} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="hidden sm:inline-block relative h-4 overflow-hidden font-ui text-[12.5px] font-semibold w-9">
        <AnimatePresence initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-0 whitespace-nowrap bg-gradient-to-r from-g-blue via-g-red to-g-yellow bg-clip-text text-transparent"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}
