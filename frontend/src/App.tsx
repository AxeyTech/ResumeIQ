import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import AuroraBackground from './components/AuroraBackground'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrustStrip from './components/TrustStrip'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import DashboardPreview from './components/DashboardPreview'
import UploadDemo from './components/UploadDemo'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import { AuthProvider, useAuth } from './context/AuthContext'

type AuthMode = 'signin' | 'signup'

function MainContent() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [view, setView] = useState<'home' | 'dashboard'>('home')
  const { user } = useAuth()

  // Handle Google OAuth callback fragment: #token=...
  useEffect(() => {
    if (window.location.hash.includes('token=')) {
      const params = new URLSearchParams(window.location.hash.replace('#', '?'))
      const token = params.get('token')
      if (token) {
        localStorage.setItem('resumeiq_token', token)
        window.history.replaceState(null, '', window.location.pathname)
        window.location.reload()
      }
    }
  }, [])

  const handleOpenAuth = (mode: AuthMode) => {
    if (user) {
      setView('dashboard')
    } else {
      setAuthMode(mode)
    }
  }

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <div className="grain-overlay" aria-hidden />

      <div className="relative z-[1]">
        <Navbar
          onOpenAuth={handleOpenAuth}
          onGoToDashboard={() => setView('dashboard')}
          currentView={view}
        />

        {view === 'dashboard' && user ? (
          <Dashboard onBackToHome={() => setView('home')} />
        ) : (
          <main>
            <Hero />
            <TrustStrip />
            <HowItWorks />
            <Features />
            <DashboardPreview />
            <div id="upload-section">
              <UploadDemo />
            </div>
            <FinalCTA />
            <Footer />
          </main>
        )}
      </div>

      <AnimatePresence>
        {authMode && (
          <AuthPage
            initialMode={authMode}
            onClose={() => setAuthMode(null)}
            onSuccess={() => setView('dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}
