import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, LayoutDashboard, LogOut, Menu, X, LogIn } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'

const links = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#process' },
  { label: 'Sample Report', href: '#dashboard' },
]

interface NavbarProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void
  onGoToDashboard: () => void
  currentView: 'home' | 'dashboard'
}

export default function Navbar({ onOpenAuth, onGoToDashboard, currentView }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl ${
        scrolled
          ? 'glass bg-white/85 dark:bg-night-panel/80 border-b border-line dark:border-night-line shadow-card'
          : 'bg-canvas/50 dark:bg-night/50 border-b border-line/40 dark:border-night-line/40'
      }`}
    >
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-5">
        <a
          href="#top"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 font-body font-bold text-xl tracking-tight text-ink dark:text-moon group"
        >
          <img
            src="/logo-icon.png?v=9"
            alt="ResumeIQ Logo"
            className="w-8 h-8 rounded-full object-contain shadow-sm border border-line/60 dark:border-night-line group-hover:scale-105 transition-transform duration-300"
          />
          <span>Resume<span className="text-gradient">IQ</span></span>
        </a>

        {currentView === 'home' && (
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="nav-link">
                {l.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={onGoToDashboard}
                className="btn-glow text-xs py-2 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 font-medium shrink-0 shadow-sm"
                title="Open your ResumeIQ Workspace & Dashboard"
              >
                <LayoutDashboard size={14} className="shrink-0 text-white" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={logout}
                className="btn-outline-glass text-xs py-2 px-2.5 sm:px-3 flex items-center gap-1.5"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="hidden sm:inline-flex btn-outline-glass text-xs py-2.5 px-4 lg:px-5"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="btn-glow text-xs py-2 px-3.5 sm:py-2.5 sm:px-5 flex items-center gap-1.5"
              >
                Begin <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Mobile menu hamburger toggle */}
          {currentView === 'home' && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl glass border border-line dark:border-night-line text-ink dark:text-moon transition-colors hover:text-g-blue"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && currentView === 'home' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden glass-strong border-b border-line dark:border-night-line px-5 py-5 space-y-4 shadow-xl"
          >
            <div className="flex flex-col space-y-3 pb-3 border-b border-line dark:border-night-line">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-ui text-sm font-medium text-ink dark:text-moon py-1.5 px-2 rounded-lg hover:bg-canvas-deep/50 dark:hover:bg-night-panel/50 transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>

            {user ? (
              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onGoToDashboard()
                  }}
                  className="w-full btn-glow text-xs py-2.5 justify-center flex items-center gap-2 font-medium"
                >
                  <LayoutDashboard size={14} /> Open Dashboard
                </button>
              </div>
            ) : (
              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenAuth('signin')
                  }}
                  className="w-full btn-outline-glass text-xs py-2.5 justify-center flex items-center gap-2"
                >
                  <LogIn size={14} /> Sign In to Existing Account
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenAuth('signup')
                  }}
                  className="w-full btn-glow text-xs py-2.5 justify-center flex items-center gap-2"
                >
                  Create Free Account <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
