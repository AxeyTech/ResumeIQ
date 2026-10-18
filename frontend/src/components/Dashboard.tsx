import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  UploadCloud,
  FileCheck2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  ArrowRight,
  Loader2,
  Briefcase,
  History,
  Layers,
  Sparkles,
  Copy,
  Check,
  LogOut,
  Home,
  UserCheck,
  Settings,
  X,
  AlertCircle,
  BarChart3,
  ShieldAlert,
  FileEdit,
  Send,
  Mic,
  GitCompare,
  Wand2,
  Play,
  LucideIcon
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import BulletOptimizer from './BulletOptimizer'
import InterviewReadinessCard from './InterviewReadinessCard'
import VersionCompare from './VersionCompare'
import ApplicationKit from './ApplicationKit'
import CompanySimulator from './CompanySimulator'
import KnockoutRadar from './KnockoutRadar'
import ResumeBuilder from './ResumeBuilder'
import MockInterviewSimulator from './MockInterviewSimulator'
import CareerChatbot from './CareerChatbot'
import ResuAvatar from './ResuAvatar'
import { useAuth } from '../context/AuthContext'
import { api, ResumeItem, AnalysisResult, AuditReport } from '../services/api'

export type ActiveSuiteTab = 'audit' | 'radar' | 'builder' | 'appkit' | 'interview' | 'tools'

interface DashboardProps {
  onBackToHome: () => void
}

export default function Dashboard({ onBackToHome }: DashboardProps) {
  const { user, logout, updateProfile, uploadAvatar } = useAuth()

  // State
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResume, setSelectedResume] = useState<ResumeItem | null>(null)
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Active Workspace Suite Tab
  const [activeSuiteTab, setActiveSuiteTab] = useState<ActiveSuiteTab>('audit')

  // AI Copilot Chatbot State (Step 5)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Profile Settings Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileUsername, setProfileUsername] = useState(user?.username || '')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // JD and Analysis State
  const [jobDescription, setJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null)
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Workspace Suite Tabs Definition
  const suiteTabs: {
    id: ActiveSuiteTab
    label: string
    subtitle: string
    badge?: string
    icon: LucideIcon
  }[] = [
    {
      id: 'audit',
      label: 'ATS Audit & Scan',
      subtitle: 'Scorecard & Diagnostics',
      badge: analysisResult ? `${analysisResult.atsCompatibilityScore}% ATS` : 'Scorecard',
      icon: BarChart3,
    },
    {
      id: 'radar',
      label: 'Knockout Radar',
      subtitle: 'Disqualifier Screen',
      badge: 'Workday/ATS',
      icon: ShieldAlert,
    },
    {
      id: 'builder',
      label: 'Resume Studio',
      subtitle: '1-Click ATS Builder',
      badge: 'Live Editor',
      icon: FileEdit,
    },
    {
      id: 'appkit',
      label: 'Application Kit',
      subtitle: 'Cover Letter & InMail',
      badge: '1-Click AI',
      icon: Send,
    },
    {
      id: 'interview',
      label: 'Mock Interview',
      subtitle: 'Voice & STAR Coach',
      badge: 'Interactive',
      icon: Mic,
    },
    {
      id: 'tools',
      label: 'Versions & Bullets',
      subtitle: 'Lineage Diff & STAR AI',
      badge: 'Version Hub',
      icon: GitCompare,
    },
  ]

  // Load resumes on mount
  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setLoadingResumes(true)
    try {
      const res = await api.listResumes()
      setResumes(res.resumes)
      if (res.resumes.length > 0) {
        setSelectedResume(res.resumes[0])
      }
    } catch (err) {
      console.error('Failed to load resumes:', err)
    } finally {
      setLoadingResumes(false)
    }
  }

  // Auto-fetch latest completed analysis whenever selected resume changes
  useEffect(() => {
    if (!selectedResume?.id) return
    let isMounted = true
    api.getLatestAnalysis(selectedResume.id).then((res) => {
      if (!isMounted) return
      if (res.analysis) {
        setAnalysisResult(res.analysis)
        if (res.report) setAuditReport(res.report)
      } else {
        setAnalysisResult(null)
        setAuditReport(null)
      }
    }).catch(() => {
      if (!isMounted) return
      setAnalysisResult(null)
      setAuditReport(null)
    })
    return () => {
      isMounted = false
    }
  }, [selectedResume?.id])

  // Synchronize modal state when user changes or modal opens
  const openProfileModal = () => {
    setProfileName(user?.name || '')
    setProfileUsername(user?.username || '')
    setUsernameStatus('idle')
    setProfileError(null)
    setProfileSuccess(false)
    setIsProfileOpen(true)
  }

  // Live username availability check
  useEffect(() => {
    const trimmed = profileUsername.trim().toLowerCase()
    if (!trimmed || trimmed === user?.username) {
      setUsernameStatus('idle')
      return
    }
    if (trimmed.length < 3 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(trimmed)
        setUsernameStatus(res.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [profileUsername, user?.username])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)

    try {
      await updateProfile({
        name: profileName.trim(),
        username: profileUsername.trim().toLowerCase(),
      })
      setProfileSuccess(true)
      setTimeout(() => {
        setIsProfileOpen(false)
        setProfileSuccess(false)
      }, 900)
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File, parentResumeId?: string) => {
    setUploading(true)
    setUploadError(null)
    setAnalysisResult(null)
    setAuditReport(null)

    try {
      const res = await api.uploadResume(file, parentResumeId)
      await fetchResumes()
      setSelectedResume(res.resume)
    } catch (err: any) {
      setUploadError(err?.message || 'File upload failed. Ensure it is a valid PDF or DOCX.')
    } finally {
      setUploading(false)
    }
  }

  // Handle Drag & Drop
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  // Run Analysis
  const handleRunAnalysis = async () => {
    if (!selectedResume) return
    setAnalyzing(true)
    setAnalysisError(null)

    try {
      // 1. If JD is present, attach it first
      if (jobDescription.trim().length >= 30) {
        await api.attachJobDescription(selectedResume.id, jobDescription.trim())
      }

      // 2. Trigger analysis
      const anaRes = await api.runAnalysis(selectedResume.id)
      setAnalysisResult(anaRes.analysis)

      // 3. Fetch audit report
      const repRes = await api.getReport(anaRes.analysis.id)
      setAuditReport(repRes.report)
      setActiveSuiteTab('audit')
    } catch (err: any) {
      setAnalysisError(err?.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Download PDF Report
  const handleDownloadPdf = async () => {
    if (!analysisResult) return
    try {
      await api.downloadReportPdf(analysisResult.id, `ResumeIQ-${selectedResume?.displayName || 'Audit'}.pdf`)
    } catch (err: any) {
      setAnalysisError(err?.message || 'Could not download PDF. Please try again.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyword(text)
    setTimeout(() => setCopiedKeyword(null), 2000)
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-night text-ink dark:text-moon pt-6 pb-24 px-4 sm:px-6 md:px-8 max-w-[1300px] mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-line dark:border-night-line gap-4">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'Avatar'}
              className="w-12 h-12 rounded-2xl object-cover shadow-glow-blue border-2 border-g-blue/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-g-gradient flex items-center justify-center font-bold text-white shadow-glow-blue text-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-semibold text-xl sm:text-2xl tracking-tight">
                {user?.name || 'Applicant'}
              </h1>
              {user?.username && (
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-g-blue/10 text-g-blue border border-g-blue/20">
                  @{user.username}
                </span>
              )}
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft flex items-center gap-2 mt-0.5">
              <span>{user?.email}</span>
              <span>&bull;</span>
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <Check size={12} /> Verified Account
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="btn-glow flex items-center gap-2 text-xs py-1.5 px-3 sm:px-3.5"
            title="Chat with Resu — Your AI Career Companion"
          >
            <ResuAvatar size="xs" mood="idle" /> <span>Ask Resu ✨</span>
          </button>
          <button
            onClick={openProfileModal}
            className="btn-outline-glass flex items-center gap-1.5 text-xs py-2 px-3 sm:px-3.5"
            title="Edit profile & username"
          >
            <Settings size={14} /> <span className="hidden xs:inline">Profile </span>Settings
          </button>
          <button
            onClick={onBackToHome}
            className="btn-outline-glass flex items-center gap-1.5 text-xs py-2 px-3 sm:px-3.5"
          >
            <Home size={14} /> <span className="hidden xs:inline">Website</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs py-2 px-3 sm:px-3.5 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Resumes & Version Tracker (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <div className="glass rounded-3xl p-6 border border-line dark:border-night-line">
            <h2 className="font-display font-semibold text-base mb-2 flex items-center gap-2">
              <UploadCloud size={18} className="text-g-blue" /> Upload Resume
            </h2>
            <p className="text-xs text-ink-soft dark:text-moon-soft mb-4">
              Upload your latest resume (PDF or DOCX, max 5MB).
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-line dark:border-night-line hover:border-g-blue rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/80 dark:bg-night-panel/30 hover:bg-white dark:hover:bg-night-panel/50 shadow-sm"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              {uploading ? (
                <div className="py-4">
                  <Loader2 size={32} className="animate-spin text-g-blue mx-auto mb-2" />
                  <div className="text-xs font-semibold text-ink dark:text-moon">Parsing Layout & Sections...</div>
                </div>
              ) : (
                <div className="py-2">
                  <FileText size={34} className="text-g-blue mx-auto mb-2" />
                  <div className="text-xs font-semibold text-ink dark:text-moon mb-1">Click to browse or drop file</div>
                  <div className="text-[11px] font-medium text-ink-soft dark:text-moon-soft">Supports PDF &amp; DOCX</div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Resumes List & Version Lineage */}
          <div className="glass rounded-3xl p-6 border border-line dark:border-night-line">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base flex items-center gap-2">
                <History size={18} className="text-g-green" /> Resume Versions ({resumes.length})
              </h2>
              <button
                onClick={fetchResumes}
                className="text-xs text-ink-soft hover:text-ink dark:hover:text-moon flex items-center gap-1"
                title="Refresh"
              >
                <RefreshCw size={12} className={loadingResumes ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingResumes ? (
              <div className="py-8 text-center text-xs text-ink-soft">
                <Loader2 size={20} className="animate-spin mx-auto mb-2 text-g-blue" />
                Loading your files...
              </div>
            ) : resumes.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-soft">
                No resumes uploaded yet. Upload your first resume above to begin!
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {resumes.map((r) => {
                  const isSelected = selectedResume?.id === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResume(r)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-g-blue bg-g-blue/5 shadow-glow-soft ring-1 ring-g-blue/30'
                          : 'border-line dark:border-night-line hover:border-g-blue/60 bg-white dark:bg-night-panel/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck2 size={16} className={isSelected ? 'text-g-blue' : 'text-g-blue/70'} />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate text-ink dark:text-moon">
                              {r.displayName || r.fileName}
                            </div>
                            <div className="text-[10px] text-ink-soft dark:text-moon-soft flex items-center gap-2">
                              <span className="font-mono bg-canvas-deep text-ink dark:bg-night-line dark:text-moon px-1.5 py-0.5 rounded font-semibold">
                                v{r.versionNumber}.0
                              </span>
                              <span>{(r.fileSizeBytes / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'parsed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Resume Workspace & Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedResume ? (
            <>
              {/* Document Header & Suite Navigation Hub */}
              <div id="workspace-suite" className="glass rounded-3xl p-5 sm:p-6 border border-line dark:border-night-line shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-line dark:border-night-line">
                  <div>
                    <div className="eyebrow mb-1">Target Document Workspace</div>
                    <h3 className="font-display font-semibold text-xl text-ink dark:text-moon flex items-center gap-2">
                      {selectedResume.displayName || selectedResume.fileName}
                      <span className="text-xs font-mono font-normal bg-g-blue/10 text-g-blue px-2.5 py-0.5 rounded-full border border-g-blue/20">
                        v{selectedResume.versionNumber}.0
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = '.pdf,.docx'
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, selectedResume.id)
                        }
                        input.click()
                      }}
                      className="btn-outline-glass text-xs py-2 px-3.5 flex items-center gap-1.5"
                      title="Upload a new revision inheriting this resume's lineage"
                    >
                      <Layers size={13} /> Upload Revision (v{selectedResume.versionNumber + 1})
                    </button>
                  </div>
                </div>

                {/* Executive Suite Navigation Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
                  {suiteTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeSuiteTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSuiteTab(tab.id)}
                        className={`relative text-left p-3 rounded-2xl transition-all duration-200 flex flex-col justify-between border ${
                          isActive
                            ? 'bg-white dark:bg-night-surface shadow-md border-g-blue/40 ring-1 ring-g-blue/30 text-ink dark:text-moon'
                            : 'bg-canvas-deep/40 dark:bg-night-panel/30 border-line/60 dark:border-night-line/60 text-ink-soft dark:text-moon-soft hover:bg-white/80 dark:hover:bg-night-panel/80 hover:text-ink dark:hover:text-moon hover:border-line dark:hover:border-night-line'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                              isActive
                                ? 'bg-g-blue text-white shadow-sm'
                                : 'bg-black/5 dark:bg-white/5 text-ink-soft dark:text-moon-soft'
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          {tab.badge && (
                            <span
                              className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-g-blue/10 text-g-blue border border-g-blue/20'
                                  : 'bg-black/5 dark:bg-white/5 text-ink-faint dark:text-moon-soft/70'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-display font-semibold text-xs leading-tight">
                            {tab.label}
                          </div>
                          <div className="text-[10px] text-ink-faint dark:text-moon-soft/70 truncate mt-0.5">
                            {tab.subtitle}
                          </div>
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="activeSuiteTabIndicator"
                            className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-g-blue rounded-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Suite 1: ATS Audit & Scan */}
              {activeSuiteTab === 'audit' && (
                <div className="space-y-6">
                  {/* Target Job Description & Audit Trigger Card */}
                  <div className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line shadow-card">
                    <div className="mb-6">
                      <label className="block font-display font-medium text-sm mb-2 flex items-center gap-2 text-ink dark:text-moon">
                        <Briefcase size={16} className="text-g-yellow" />
                        Target Job Description (Optional for Keyword Gap Analysis)
                      </label>
                      <p className="text-xs text-ink-soft dark:text-moon-soft mb-3">
                        Paste the job description of the role you are targeting. ResumeIQ will compute semantic match score and highlight missing required skills.
                      </p>
                      <textarea
                        rows={4}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="e.g. We are seeking a Full Stack Software Engineer proficient in React, Node.js, PostgreSQL, Docker, and REST APIs with 2+ years of experience in agile software delivery..."
                        className="w-full rounded-2xl border border-line dark:border-night-line bg-white dark:bg-night-panel/60 p-4 text-xs font-ui text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue focus:shadow-glow-soft transition-all shadow-sm"
                      />
                    </div>

                    {/* Action Trigger */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-ink-soft dark:text-moon-soft">
                        {jobDescription.trim().length >= 30 ? (
                          <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                            <Check size={14} /> JD Attached ({jobDescription.trim().length} chars)
                          </span>
                        ) : (
                          <span>JD optional &bull; Defaults to standard industry benchmark</span>
                        )}
                      </div>

                      <button
                        onClick={handleRunAnalysis}
                        disabled={analyzing}
                        className="btn-glow w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-75"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Running ATS &amp; AI Analysis...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} /> Run Comprehensive Analysis <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>

                    {analysisError && (
                      <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{analysisError}</span>
                      </div>
                    )}
                  </div>

                  {/* Analysis Results View */}
                  {analysisResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Cross-Suite Quick Action Bar */}
                      <div className="glass rounded-2xl p-4 sm:p-5 border border-line dark:border-night-line bg-gradient-to-r from-g-blue/5 via-canvas-deep/30 dark:via-night-panel/30 to-purple-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-card">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-g-blue/10 text-g-blue flex items-center justify-center shrink-0">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-ink dark:text-moon">
                              Next Steps: Optimize &amp; Apply
                            </div>
                            <div className="text-[11px] text-ink-soft dark:text-moon-soft">
                              Inject {analysisResult.missingKeywords.length} missing keywords in Resume Studio or generate tailored cover letter in Application Kit.
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto shrink-0">
                          <button
                            onClick={() => setActiveSuiteTab('builder')}
                            className="btn-glow text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
                          >
                            <FileEdit size={13} /> Open Studio
                          </button>
                          <button
                            onClick={() => setActiveSuiteTab('appkit')}
                            className="btn-outline-glass text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
                          >
                            <Send size={13} /> Application Kit
                          </button>
                          <button
                            onClick={() => setActiveSuiteTab('radar')}
                            className="btn-outline-glass text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
                          >
                            <ShieldAlert size={13} className="text-red-500" /> Knockout Radar
                          </button>
                          <button
                            onClick={() => setActiveSuiteTab('interview')}
                            className="btn-outline-glass text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
                          >
                            <Mic size={13} /> Mock Interview
                          </button>
                        </div>
                      </div>

                      {/* Interview Readiness & Recruiter Probability Card */}
                      <InterviewReadinessCard
                        analysis={analysisResult}
                        report={auditReport}
                      />

                      {/* Knockout Criteria & Hard Red-Flag Radar */}
                      <KnockoutRadar
                        analysisId={analysisResult.id}
                        onSwitchToBuilder={() => setActiveSuiteTab('builder')}
                      />

                      {/* Company-Specific ATS Simulator & Recruiter Persona Scan */}
                      <CompanySimulator analysisId={analysisResult.id} />

                      {/* Score Highlights Grid */}
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="glass rounded-3xl p-6 border border-line dark:border-night-line flex items-center gap-6 shadow-card">
                          <div className="shrink-0">
                            <ScoreRing
                              to={analysisResult.atsCompatibilityScore}
                              size={110}
                              strokeWidth={7}
                              ringColor={
                                analysisResult.atsCompatibilityScore >= 75
                                  ? '#34A853'
                                  : analysisResult.atsCompatibilityScore >= 50
                                  ? '#FBBC05'
                                  : '#EA4335'
                              }
                            />
                          </div>
                          <div>
                            <div className="eyebrow mb-1">ATS Format Score</div>
                            <h4 className="font-display font-semibold text-lg">
                              {analysisResult.atsCompatibilityScore >= 75
                                ? 'ATS Compatible'
                                : analysisResult.atsCompatibilityScore >= 50
                                ? 'Fair Formatting'
                                : 'Formatting Gaps'}
                            </h4>
                            <p className="text-xs text-ink-soft dark:text-moon-soft mt-1">
                              Evaluates heading detection, single-column parsing, margins, and contact info visibility.
                            </p>
                          </div>
                        </div>

                        <div className="glass rounded-3xl p-6 border border-line dark:border-night-line flex items-center gap-6 shadow-card">
                          <div className="shrink-0">
                            <ScoreRing
                              to={analysisResult.keywordMatchScore}
                              size={110}
                              strokeWidth={7}
                              ringColor="#4285F4"
                            />
                          </div>
                          <div>
                            <div className="eyebrow mb-1">Keyword Match</div>
                            <h4 className="font-display font-semibold text-lg">
                              {analysisResult.keywordMatchScore}% Alignment
                            </h4>
                            <p className="text-xs text-ink-soft dark:text-moon-soft mt-1">
                              Semantic relevance score against the target job requirements or industry skills benchmark.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PDF Download Banner */}
                      <div className="glass rounded-2xl p-5 border border-g-blue/30 bg-g-blue/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-g-blue flex items-center justify-center text-white">
                            <Download size={20} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">Download Official Audit Report</div>
                            <div className="text-xs text-ink-soft dark:text-moon-soft">
                              Comprehensive PDF artifact with scores, missing keywords, and recruiter action items.
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleDownloadPdf}
                          className="btn-glow text-xs py-2.5 px-5 flex items-center gap-2 shrink-0"
                        >
                          <Download size={14} /> Download PDF
                        </button>
                      </div>

                      {/* Keywords Breakdown */}
                      <div className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line shadow-card">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                            <Layers size={18} className="text-g-blue" /> Keyword Coverage Diagnostics
                          </h3>
                          {analysisResult.missingKeywords.length > 0 && (
                            <button
                              onClick={() => setActiveSuiteTab('builder')}
                              className="text-xs font-semibold text-g-blue hover:underline flex items-center gap-1"
                            >
                              <Wand2 size={13} /> Fix in Resume Studio &rarr;
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Matched Keywords */}
                          <div>
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                              <CheckCircle size={14} /> Matched Keywords ({analysisResult.matchedKeywords.length})
                            </h5>
                            {analysisResult.matchedKeywords.length === 0 ? (
                              <div className="text-xs text-ink-faint p-4 border border-dashed rounded-xl">
                                No direct matches found. Add relevant skills from the JD.
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.matchedKeywords.map((k) => (
                                  <span
                                    key={k}
                                    className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  >
                                    {k}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Missing Keywords */}
                          <div>
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                              <AlertTriangle size={14} /> Missing Keywords ({analysisResult.missingKeywords.length})
                            </h5>
                            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                              {analysisResult.missingKeywords.map((k) => (
                                <button
                                  key={k}
                                  onClick={() => copyToClipboard(k)}
                                  className="text-xs font-medium px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors group"
                                  title="Click to copy"
                                >
                                  <span>{k}</span>
                                  {copiedKeyword === k ? (
                                    <Check size={11} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={11} className="opacity-40 group-hover:opacity-100" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Issues & Recommendations */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* ATS Issues */}
                        <div className="glass rounded-3xl p-6 border border-line dark:border-night-line shadow-card">
                          <h4 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            ATS Formatting Warnings ({analysisResult.issues.length})
                          </h4>
                          {analysisResult.issues.length === 0 ? (
                            <div className="text-xs text-emerald-500 p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/5 flex items-center gap-2">
                              <CheckCircle size={16} /> Clean formatting! Zero critical ATS parsing issues detected.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {analysisResult.issues.map((issue, idx) => (
                                <div
                                  key={idx}
                                  className="p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-semibold">{issue.title}</span>
                                    <span
                                      className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                        issue.severity === 'high'
                                          ? 'bg-red-500/10 text-red-500'
                                          : 'bg-amber-500/10 text-amber-500'
                                      }`}
                                    >
                                      {issue.severity}
                                    </span>
                                  </div>
                                  <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed">
                                    {issue.message}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* AI Coach Recommendations */}
                        <div className="glass rounded-3xl p-6 border border-line dark:border-night-line shadow-card">
                          <h4 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
                            <Sparkles size={16} className="text-g-blue" />
                            AI Executive Recommendations
                          </h4>
                          {auditReport ? (
                            <div className="space-y-3">
                              <div className="p-3.5 rounded-2xl bg-g-blue/5 border border-g-blue/20 text-xs italic text-ink-soft dark:text-moon-soft leading-relaxed">
                                &ldquo;{auditReport.summary}&rdquo;
                              </div>
                              {auditReport.recommendations.map((rec, idx) => (
                                <div
                                  key={idx}
                                  className="p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-semibold">{rec.title}</span>
                                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-g-blue">
                                      {rec.priority}
                                    </span>
                                  </div>
                                  <p className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed">
                                    {rec.detail}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-ink-soft p-4 text-center">
                              Generating recommendations...
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass rounded-3xl p-8 text-center border border-line dark:border-night-line shadow-card">
                      <BarChart3 size={40} className="text-g-blue mx-auto mb-3 opacity-60" />
                      <h4 className="font-display font-semibold text-base mb-1">
                        Run Audit to See ATS Diagnostics
                      </h4>
                      <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto">
                        Click &ldquo;Run Comprehensive Analysis&rdquo; above to get your ATS formatting score, semantic keyword match, recruiter persona simulation, and actionable fixes.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Suite: Knockout Criteria & Hard Red-Flag Radar */}
              {activeSuiteTab === 'radar' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {analysisResult ? (
                    <KnockoutRadar
                      analysisId={analysisResult.id}
                      onSwitchToBuilder={() => setActiveSuiteTab('builder')}
                    />
                  ) : (
                    <div className="glass rounded-3xl p-8 text-center border border-line dark:border-night-line shadow-card">
                      <ShieldAlert size={40} className="text-red-500 mx-auto mb-3 opacity-60" />
                      <h4 className="font-display font-semibold text-base mb-1">
                        Run Audit to Activate Knockout Radar
                      </h4>
                      <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto mb-5">
                        Knockout Radar scans your resume against commercial ATS screening filters (Workday, Taleo, Greenhouse) to detect automated disqualifiers. Run a comprehensive analysis first.
                      </p>
                      <button
                        onClick={handleRunAnalysis}
                        disabled={analyzing}
                        className="btn-glow text-xs py-2.5 px-5 inline-flex items-center gap-2"
                      >
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        {analyzing ? 'Analyzing & Scanning Filters...' : 'Run Analysis & Activate Radar Now'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Suite 2: 1-Click ATS-Cleared Resume Builder & Studio */}
              {activeSuiteTab === 'builder' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ResumeBuilder
                    resume={selectedResume}
                    analysis={analysisResult}
                    missingKeywords={analysisResult?.missingKeywords || []}
                    onVersionCreated={(newResume, newAnalysis) => {
                      fetchResumes()
                      setSelectedResume(newResume)
                      if (newAnalysis) {
                        setAnalysisResult(newAnalysis)
                      }
                    }}
                  />
                </motion.div>
              )}

              {/* Suite 3: 1-Click AI Job Application Kit (Cover Letter + Recruiter InMail) */}
              {activeSuiteTab === 'appkit' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ApplicationKit
                    resumeId={selectedResume.id}
                    jobDescriptionText={jobDescription}
                    initialJobTitle={selectedResume.displayName?.replace(/\.[^/.]+$/, '') || 'Software Engineer'}
                  />
                </motion.div>
              )}

              {/* Suite 4: 🎙️ AI Mock Interview Simulator (Interactive Voice & Text STAR Coaching) */}
              {activeSuiteTab === 'interview' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MockInterviewSimulator
                    resume={selectedResume}
                    jobDescriptionText={jobDescription}
                    initialJobTitle={selectedResume.displayName?.replace(/\.[^/.]+$/, '') || 'Senior Software Engineer'}
                  />
                </motion.div>
              )}

              {/* Suite 5: Resume Version Diff & STAR Bullet Optimizer */}
              {activeSuiteTab === 'tools' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <VersionCompare
                    resumeId={selectedResume.id}
                    currentVersionNumber={selectedResume.versionNumber}
                    onUploadRevision={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.pdf,.docx'
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, selectedResume.id)
                      }
                      input.click()
                    }}
                  />

                  <BulletOptimizer suggestedKeywords={analysisResult?.missingKeywords || []} />
                </motion.div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="glass rounded-3xl p-12 text-center border border-line dark:border-night-line">
                <UploadCloud size={48} className="text-g-blue mx-auto mb-4 opacity-60" />
                <h3 className="font-display font-semibold text-xl mb-2">Select or Upload a Resume</h3>
                <p className="text-xs text-ink-soft dark:text-moon-soft max-w-sm mx-auto mb-6">
                  Choose an existing resume from your version lineage on the left, or upload a new one to run ATS checks.
                </p>
              </div>

              {/* AI Bullet Optimizer is available anytime */}
              <BulletOptimizer />
            </div>
          )}
        </div>
      </div>

      {/* Profile & Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl glass-strong border border-line dark:border-night-line p-5 sm:p-8 bg-canvas dark:bg-night shadow-2xl relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink dark:hover:text-moon transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-g-blue/10 text-g-blue flex items-center justify-center">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Account &amp; Profile Settings</h3>
                <p className="text-xs text-ink-soft dark:text-moon-soft">
                  Customize your identity and unique public handle
                </p>
              </div>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                <Check size={15} className="shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-line dark:border-night-line">
                <div className="relative group">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-g-blue/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-g-gradient flex items-center justify-center font-bold text-white text-2xl">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <label
                    className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Upload profile picture"
                  >
                    <Settings size={20} className="text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) {
                          setProfileError('Image must be under 2MB.')
                          return
                        }
                        try {
                          setProfileError(null)
                          await uploadAvatar(file)
                          setProfileSuccess(true)
                          setTimeout(() => setProfileSuccess(false), 1500)
                        } catch (err: any) {
                          setProfileError(err?.message || 'Failed to upload avatar.')
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-ink-faint dark:text-moon-soft">
                  Hover &amp; click to upload a profile picture (JPG, PNG, WebP &bull; Max 2MB)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Akshay Sharma"
                  className="w-full rounded-xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 px-3.5 py-2.5 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-g-blue"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft">
                    Unique Username Handle
                  </label>
                  {usernameStatus === 'checking' && (
                    <span className="text-[11px] text-ink-faint dark:text-moon-soft flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Checking...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                      <Check size={11} /> Available!
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <X size={11} /> Already taken
                    </span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="text-[11px] text-amber-500 font-medium">
                      3-30 chars, a-z, 0-9, _
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint dark:text-moon-soft text-xs font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_handle"
                    maxLength={30}
                    className={`w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-xs font-mono text-ink dark:text-moon focus:outline-none transition-all ${
                      usernameStatus === 'taken'
                        ? 'border-red-500 bg-red-500/5'
                        : usernameStatus === 'available'
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 focus:border-g-blue'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-ink-faint dark:text-moon-soft mt-1">
                  Your public handle: @{profileUsername || 'username'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-line/40 dark:border-night-line/40 bg-line/20 dark:bg-night-line/20 px-3.5 py-2.5 text-xs font-ui text-ink-soft dark:text-moon-soft/70 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="btn-outline-glass text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                  className="btn-glow text-xs py-2 px-5 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 🤖 ResumeIQ AI Career & Interview Copilot (Step 5) */}
      <CareerChatbot
        currentResume={selectedResume}
        currentAnalysis={analysisResult}
        jobDescription={jobDescription}
        onNavigateToTab={(tab) => {
          setActiveSuiteTab(tab)
          setIsChatbotOpen(false)
          setTimeout(() => {
            const suiteEl = document.getElementById('workspace-suite')
            suiteEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 150)
        }}
        isOpen={isChatbotOpen}
        onToggleOpen={() => setIsChatbotOpen(!isChatbotOpen)}
      />
    </div>
  )
}
