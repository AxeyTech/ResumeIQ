import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: (originX?: number, originY?: number) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('resumeiq-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('resumeiq-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(
    (originX?: number, originY?: number) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark'
      const x = originX ?? window.innerWidth / 2
      const y = originY ?? 0

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      const startTransition = document.startViewTransition?.bind(document)
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Direct synchronous update if view transitions are not supported or reduced motion is active
      if (!startTransition || reducedMotion) {
        document.documentElement.classList.toggle('dark', next === 'dark')
        window.localStorage.setItem('resumeiq-theme', next)
        setTheme(next)
        return
      }

      // 1. Inject coordinates directly into CSS variables on root for native 60/120fps GPU compositor
      const root = document.documentElement
      root.style.setProperty('--theme-x', `${Math.round(x)}px`)
      root.style.setProperty('--theme-y', `${Math.round(y)}px`)
      root.style.setProperty('--theme-r', `${Math.ceil(endRadius)}px`)

      // 2. Temporarily lock individual CSS transitions so the browser captures clean instant snapshots without dropped frames
      root.classList.add('theme-transitioning')

      // 3. Synchronous DOM update inside startViewTransition using flushSync
      const transition = startTransition(() => {
        flushSync(() => {
          root.classList.toggle('dark', next === 'dark')
          window.localStorage.setItem('resumeiq-theme', next)
          setTheme(next)
        })
      })

      // 4. Release transition lock smoothly once transition completes
      transition.finished
        .catch(() => {})
        .finally(() => {
          root.classList.remove('theme-transitioning')
        })
    },
    [theme],
  )

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
