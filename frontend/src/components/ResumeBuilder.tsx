import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Sparkles,
  Download,
  Save,
  Copy,
  Check,
  Printer,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  User,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import {
  api,
  ResumeItem,
  AnalysisResult,
  ResumeBuilderData,
  ResumeBuilderExperienceItem,
  ResumeBuilderProjectItem,
  ResumeBuilderEducationItem
} from '../services/api'

interface ResumeBuilderProps {
  resume: ResumeItem
  analysis?: AnalysisResult | null
  missingKeywords?: string[]
  onVersionCreated?: (newResume: ResumeItem, newAnalysis?: AnalysisResult) => void
}

export default function ResumeBuilder({
  resume,
  analysis,
  missingKeywords = [],
  onVersionCreated
}: ResumeBuilderProps) {
  // Mobile tab state: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // Form state
  const [builderData, setBuilderData] = useState<ResumeBuilderData>(() =>
    initializeDataFromResume(resume)
  )

  // Skill input state
  const [newSkillText, setNewSkillText] = useState('')

  // Action states
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [injectedKeyword, setInjectedKeyword] = useState<string | null>(null)

  // Sync builder data when resume changes
  useEffect(() => {
    setBuilderData(initializeDataFromResume(resume))
  }, [resume.id, resume.updatedAt])

  // Helper to inject missing keyword into skills
  const handleInjectKeyword = (keyword: string) => {
    const flatSkills = getFlatSkills(builderData.skills)
    if (!flatSkills.map((s) => s.toLowerCase()).includes(keyword.toLowerCase())) {
      const updatedSkills = [...flatSkills, keyword]
      setBuilderData((prev) => ({
        ...prev,
        skills: updatedSkills
      }))
      setInjectedKeyword(keyword)
      setTimeout(() => setInjectedKeyword(null), 2500)
    }
  }

  // Remove skill
  const handleRemoveSkill = (skillToRemove: string) => {
    const flatSkills = getFlatSkills(builderData.skills)
    setBuilderData((prev) => ({
      ...prev,
      skills: flatSkills.filter((s) => s.toLowerCase() !== skillToRemove.toLowerCase())
    }))
  }

  // Add new skill
  const handleAddSkill = () => {
    const trimmed = newSkillText.trim()
    if (!trimmed) return
    const flatSkills = getFlatSkills(builderData.skills)
    if (!flatSkills.includes(trimmed)) {
      setBuilderData((prev) => ({
        ...prev,
        skills: [...flatSkills, trimmed]
      }))
    }
    setNewSkillText('')
  }

  // Experience handlers
  const handleAddExperience = () => {
    const newJob: ResumeBuilderExperienceItem = {
      id: `exp-${Date.now()}`,
      role: 'Software Engineer',
      company: 'Company Name',
      location: 'City, State',
      startDate: 'Jan 2023',
      endDate: '',
      current: true,
      bullets: ['Spearheaded development of core features improving performance by 25%.']
    }
    setBuilderData((prev) => ({
      ...prev,
      experience: [newJob, ...prev.experience]
    }))
  }

  const handleUpdateExperience = (
    index: number,
    field: keyof ResumeBuilderExperienceItem,
    value: any
  ) => {
    setBuilderData((prev) => {
      const updated = [...prev.experience]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, experience: updated }
    })
  }

  const handleDeleteExperience = (index: number) => {
    setBuilderData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const handleAddBulletToExperience = (jobIndex: number) => {
    setBuilderData((prev) => {
      const updated = [...prev.experience]
      updated[jobIndex] = {
        ...updated[jobIndex],
        bullets: [...(updated[jobIndex].bullets || []), 'Achieved quantifiable milestone resulting in 20% team efficiency boost.']
      }
      return { ...prev, experience: updated }
    })
  }

  const handleUpdateBulletInExperience = (jobIndex: number, bulletIndex: number, text: string) => {
    setBuilderData((prev) => {
      const updated = [...prev.experience]
      const bullets = [...updated[jobIndex].bullets]
      bullets[bulletIndex] = text
      updated[jobIndex] = { ...updated[jobIndex], bullets }
      return { ...prev, experience: updated }
    })
  }

  const handleDeleteBulletFromExperience = (jobIndex: number, bulletIndex: number) => {
    setBuilderData((prev) => {
      const updated = [...prev.experience]
      updated[jobIndex] = {
        ...updated[jobIndex],
        bullets: updated[jobIndex].bullets.filter((_, i) => i !== bulletIndex)
      }
      return { ...prev, experience: updated }
    })
  }

  // Project handlers
  const handleAddProject = () => {
    const newProj: ResumeBuilderProjectItem = {
      id: `proj-${Date.now()}`,
      title: 'Distributed System Project',
      techStack: 'React, Node.js, PostgreSQL',
      link: 'github.com/example/project',
      bullets: ['Engineered high-throughput service processing 10,000+ requests/sec.']
    }
    setBuilderData((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects]
    }))
  }

  const handleUpdateProject = (index: number, field: keyof ResumeBuilderProjectItem, value: any) => {
    setBuilderData((prev) => {
      const updated = [...prev.projects]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, projects: updated }
    })
  }

  const handleDeleteProject = (index: number) => {
    setBuilderData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }))
  }

  // Education handlers
  const handleAddEducation = () => {
    const newEdu: ResumeBuilderEducationItem = {
      id: `edu-${Date.now()}`,
      school: 'University Name',
      degree: 'B.S.',
      field: 'Computer Science',
      graduationDate: 'May 2022',
      gpa: '3.8/4.0',
      highlights: 'Dean’s List, Magna Cum Laude'
    }
    setBuilderData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const handleUpdateEducation = (index: number, field: keyof ResumeBuilderEducationItem, value: any) => {
    setBuilderData((prev) => {
      const updated = [...prev.education]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, education: updated }
    })
  }

  const handleDeleteEducation = (index: number) => {
    setBuilderData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  // Actions
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true)
      setSaveError(null)
      const fileName = `${(builderData.personalInfo.fullName || 'ATS_Resume').replace(/[^a-zA-Z0-9_-]/g, '_')}_ATS_Optimized.pdf`
      await api.downloadCleanResumePdf(resume.id, builderData, fileName)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveAsVersion = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccessMessage(null)

      const res = await api.saveResumeBuilderVersion(resume.id, {
        displayName: `${builderData.personalInfo.fullName || 'Optimized Resume'} (v${resume.versionNumber + 1})`,
        resumeData: builderData,
        reAnalyze: true
      })

      setSaveSuccessMessage(res.message || 'Saved as new version and re-analyzed!')
      if (onVersionCreated) {
        onVersionCreated(res.resume, res.analysis)
      }
      setTimeout(() => setSaveSuccessMessage(null), 4000)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save version')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyPlainText = () => {
    const plain = serializeToPlainText(builderData)
    navigator.clipboard.writeText(plain)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleResetToOriginal = () => {
    setBuilderData(initializeDataFromResume(resume))
  }

  const flatSkills = getFlatSkills(builderData.skills)

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 border border-line dark:border-night-line space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line dark:border-night-line">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-g-blue/10 text-g-blue border border-g-blue/20">
              <Sparkles size={13} /> Step 3: ATS-Perfect Resume Studio
            </span>
            {analysis && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Current: {analysis.atsCompatibilityScore}% ATS / {analysis.keywordMatchScore}% Match
              </span>
            )}
            <span className="text-xs text-ink-soft dark:text-moon-soft hidden sm:inline">
              Harvard/Stanford Single-Column Benchmark
            </span>
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink dark:text-moon">
            1-Click ATS-Cleared Resume Builder
          </h2>
          <p className="text-xs text-ink-soft dark:text-moon-soft mt-1">
            Edit in browser, inject missing keywords with 1 tap, and export guaranteed ATS-parseable single-column PDFs.
          </p>
        </div>

        {/* View Toggle on Mobile & Tablets */}
        <div className="flex lg:hidden items-center p-1 rounded-xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line dark:border-night-line self-start">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'bg-g-blue text-white shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
            }`}
          >
            <Edit3 size={13} /> Edit Content
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-g-blue text-white shadow-sm'
                : 'text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
            }`}
          >
            <Eye size={13} /> ATS Live Preview
          </button>
        </div>
      </div>

      {/* 1-Click Keyword Injection Banner */}
      {missingKeywords.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                1-Tap Keyword Injection ({missingKeywords.length} missing from target JD)
              </span>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400">
              Tap any keyword to immediately insert it into your Technical Skills
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {missingKeywords.map((kw) => {
              const isAlreadyAdded = flatSkills.map((s) => s.toLowerCase()).includes(kw.toLowerCase())
              return (
                <button
                  key={kw}
                  onClick={() => handleInjectKeyword(kw)}
                  disabled={isAlreadyAdded}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    isAlreadyAdded
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 opacity-60 cursor-default'
                      : 'bg-white dark:bg-night-surface hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/30 active:scale-95'
                  }`}
                  title={isAlreadyAdded ? 'Already included in your skills' : `Click to add ${kw} to skills`}
                >
                  {isAlreadyAdded ? <Check size={11} className="text-emerald-500" /> : <Plus size={11} />}
                  <span>{kw}</span>
                </button>
              )
            })}
          </div>
          {injectedKeyword && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
            >
              <CheckCircle2 size={13} />
              Injected &ldquo;{injectedKeyword}&rdquo; into Technical Skills!
            </motion.div>
          )}
        </div>
      )}

      {/* Main Grid: Left Editor & Right Live Preview */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* ==================== LEFT COLUMN: EDIT CONTROLS ==================== */}
        <div className={`space-y-6 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {/* 1. Personal & Contact Details */}
          <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-moon">
              <User size={16} className="text-g-blue" /> Contact Information
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-ink-soft dark:text-moon-soft mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={builderData.personalInfo.fullName}
                  onChange={(e) =>
                    setBuilderData((p) => ({
                      ...p,
                      personalInfo: { ...p.personalInfo, fullName: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue font-medium transition-colors"
                  placeholder="e.g. Akshay Sharma"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-soft dark:text-moon-soft mb-1">
                  Professional Title
                </label>
                <input
                  type="text"
                  value={builderData.personalInfo.title || ''}
                  onChange={(e) =>
                    setBuilderData((p) => ({
                      ...p,
                      personalInfo: { ...p.personalInfo, title: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors"
                  placeholder="e.g. Senior Full-Stack Engineer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-soft dark:text-moon-soft mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={builderData.personalInfo.email || ''}
                  onChange={(e) =>
                    setBuilderData((p) => ({
                      ...p,
                      personalInfo: { ...p.personalInfo, email: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors"
                  placeholder="e.g. candidate@example.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-soft dark:text-moon-soft mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={builderData.personalInfo.phone || ''}
                  onChange={(e) =>
                    setBuilderData((p) => ({
                      ...p,
                      personalInfo: { ...p.personalInfo, phone: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors"
                  placeholder="e.g. +1 (555) 234-5678"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-soft dark:text-moon-soft mb-1">
                  Location (City, State / Country)
                </label>
                <input
                  type="text"
                  value={builderData.personalInfo.location || ''}
                  onChange={(e) =>
                    setBuilderData((p) => ({
                      ...p,
                      personalInfo: { ...p.personalInfo, location: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-soft dark:text-moon-soft mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={builderData.personalInfo.linkedin || ''}
                  onChange={(e) =>
                    setBuilderData((p) => ({
                      ...p,
                      personalInfo: { ...p.personalInfo, linkedin: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors"
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* 2. Professional Summary */}
          <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink dark:text-moon flex items-center gap-2">
                <FileText size={16} className="text-g-blue" /> Professional Summary
              </span>
              <span className="text-[11px] text-ink-soft dark:text-moon-soft">
                {builderData.summary.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={builderData.summary}
              onChange={(e) => setBuilderData((p) => ({ ...p, summary: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue text-xs leading-relaxed transition-colors"
              placeholder="3-4 sentences highlighting your years of experience, core technical stack, and major career milestones..."
            />
          </div>

          {/* 3. Technical Skills */}
          <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink dark:text-moon flex items-center gap-2">
                <Wrench size={16} className="text-g-blue" /> Technical Skills & Tools ({flatSkills.length})
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Type skill and press Enter (e.g. TypeScript, AWS, Docker)"
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 text-xs focus:outline-none focus:border-g-blue transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-xl bg-g-blue text-white text-xs font-medium hover:bg-g-blue/90 transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 max-h-[140px] overflow-y-auto">
              {flatSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white dark:bg-night-surface border border-line dark:border-night-line text-ink dark:text-moon shadow-sm group"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="opacity-40 hover:opacity-100 text-red-500 transition-opacity"
                    title="Remove skill"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 4. Professional Work Experience */}
          <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink dark:text-moon flex items-center gap-2">
                <Briefcase size={16} className="text-g-blue" /> Professional Experience ({builderData.experience.length})
              </span>
              <button
                type="button"
                onClick={handleAddExperience}
                className="text-xs font-medium text-g-blue hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Position
              </button>
            </div>

            <div className="space-y-4">
              {builderData.experience.map((job, jobIdx) => (
                <div
                  key={job.id || jobIdx}
                  className="p-4 rounded-xl bg-white/70 dark:bg-night-surface border border-line dark:border-night-line space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink dark:text-moon">
                      #{jobIdx + 1}: {job.role || 'New Role'} at {job.company || 'Company'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(jobIdx)}
                      className="text-xs text-red-500 hover:text-red-700 p-1 transition-colors"
                      title="Delete Position"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={job.role}
                      onChange={(e) => handleUpdateExperience(jobIdx, 'role', e.target.value)}
                      placeholder="Role (e.g. Senior Backend Engineer)"
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={job.company}
                      onChange={(e) => handleUpdateExperience(jobIdx, 'company', e.target.value)}
                      placeholder="Company (e.g. Acme Corp)"
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={job.location || ''}
                      onChange={(e) => handleUpdateExperience(jobIdx, 'location', e.target.value)}
                      placeholder="Location (e.g. New York, NY)"
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue text-xs font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={job.startDate || ''}
                        onChange={(e) => handleUpdateExperience(jobIdx, 'startDate', e.target.value)}
                        placeholder="Start (e.g. Jan 2021)"
                        className="w-1/2 px-2 py-1.5 rounded-lg bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue text-xs"
                      />
                      <input
                        type="text"
                        disabled={job.current}
                        value={job.current ? 'Present' : (job.endDate || '')}
                        onChange={(e) => handleUpdateExperience(jobIdx, 'endDate', e.target.value)}
                        placeholder="End (e.g. Present)"
                        className="w-1/2 px-2 py-1.5 rounded-lg bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue text-xs disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft dark:text-moon-soft">
                      <span>Key Accomplishments & Metrics (Bullets)</span>
                      <button
                        type="button"
                        onClick={() => handleAddBulletToExperience(jobIdx)}
                        className="text-g-blue hover:underline flex items-center gap-0.5"
                      >
                        <Plus size={11} /> Add Bullet
                      </button>
                    </div>

                    {(job.bullets || []).map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex items-start gap-2">
                        <span className="text-xs text-g-blue mt-2 font-bold">•</span>
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) =>
                            handleUpdateBulletInExperience(jobIdx, bulletIdx, e.target.value)
                          }
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 text-xs focus:outline-none focus:border-g-blue"
                          placeholder="Action verb + Context + Quantifiable Metric (e.g. Spearheaded microservice refactor reducing P99 latency by 45%)..."
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteBulletFromExperience(jobIdx, bulletIdx)}
                          className="text-red-400 hover:text-red-600 mt-2 p-1"
                          title="Remove bullet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Projects */}
          <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink dark:text-moon flex items-center gap-2">
                <FolderGit2 size={16} className="text-g-blue" /> Notable Projects ({builderData.projects.length})
              </span>
              <button
                type="button"
                onClick={handleAddProject}
                className="text-xs font-medium text-g-blue hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Project
              </button>
            </div>

            <div className="space-y-3">
              {builderData.projects.map((proj, pIdx) => (
                <div
                  key={proj.id || pIdx}
                  className="p-3.5 rounded-xl bg-white/70 dark:bg-night-surface border border-line dark:border-night-line space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleUpdateProject(pIdx, 'title', e.target.value)}
                      placeholder="Project Name"
                      className="font-bold px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(pIdx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={proj.techStack || ''}
                      onChange={(e) => handleUpdateProject(pIdx, 'techStack', e.target.value)}
                      placeholder="Tech Stack (e.g. Next.js, Redis, Docker)"
                      className="px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                    <input
                      type="text"
                      value={proj.link || ''}
                      onChange={(e) => handleUpdateProject(pIdx, 'link', e.target.value)}
                      placeholder="Link / URL (e.g. github.com/user/repo)"
                      className="px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {(proj.bullets || []).map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-g-blue">•</span>
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const updated = [...(proj.bullets || [])]
                            updated[bIdx] = e.target.value
                            handleUpdateProject(pIdx, 'bullets', updated)
                          }}
                          className="flex-1 px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                          placeholder="Project achievement metric..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Education */}
          <div className="p-5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink dark:text-moon flex items-center gap-2">
                <GraduationCap size={16} className="text-g-blue" /> Education ({builderData.education.length})
              </span>
              <button
                type="button"
                onClick={handleAddEducation}
                className="text-xs font-medium text-g-blue hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Education
              </button>
            </div>

            <div className="space-y-3">
              {builderData.education.map((edu, eIdx) => (
                <div
                  key={edu.id || eIdx}
                  className="p-3.5 rounded-xl bg-white/70 dark:bg-night-surface border border-line dark:border-night-line space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => handleUpdateEducation(eIdx, 'school', e.target.value)}
                      placeholder="School / University"
                      className="font-bold px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(eIdx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => handleUpdateEducation(eIdx, 'degree', e.target.value)}
                      placeholder="Degree (e.g. B.S., M.S.)"
                      className="px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                    <input
                      type="text"
                      value={edu.field || ''}
                      onChange={(e) => handleUpdateEducation(eIdx, 'field', e.target.value)}
                      placeholder="Field of Study (e.g. Computer Science)"
                      className="px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                    <input
                      type="text"
                      value={edu.graduationDate || ''}
                      onChange={(e) => handleUpdateEducation(eIdx, 'graduationDate', e.target.value)}
                      placeholder="Graduation Year (e.g. 2023)"
                      className="px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                    <input
                      type="text"
                      value={edu.gpa || ''}
                      onChange={(e) => handleUpdateEducation(eIdx, 'gpa', e.target.value)}
                      placeholder="GPA (e.g. 3.9 / 4.0)"
                      className="px-2 py-1 rounded bg-white dark:bg-night-panel border border-line dark:border-night-line text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: LIVE ATS PREVIEW & ACTION BAR ==================== */}
        <div className={`space-y-4 ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
          {/* Action Toolbar */}
          <div className="p-4 rounded-2xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line dark:border-night-line flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-ink dark:text-moon">
                Harvard/Stanford Standard Live Preview
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Reset to parsed */}
              <button
                onClick={handleResetToOriginal}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs font-medium text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon hover:bg-canvas-deep dark:hover:bg-night-surface-hover transition-all flex items-center gap-1 shadow-sm"
                title="Reset back to initial parsed data"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Copy Plain Text */}
              <button
                onClick={handleCopyPlainText}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs font-semibold text-ink dark:text-moon hover:bg-canvas-deep dark:hover:bg-night-surface-hover transition-all flex items-center gap-1.5 shadow-sm"
                title="Copy pure text for ATS web portals"
              >
                {copiedText ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-g-blue" />}
                <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
              </button>

              {/* Print / Native PDF */}
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-night-surface border border-line dark:border-night-line text-xs font-semibold text-ink dark:text-moon hover:bg-canvas-deep dark:hover:bg-night-surface-hover transition-all flex items-center gap-1.5 shadow-sm"
                title="Print or Save via Browser dialog"
              >
                <Printer size={13} className="text-g-blue" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Download Vector ATS PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="px-3.5 py-1.5 rounded-xl bg-g-blue text-white text-xs font-semibold hover:bg-g-blue/90 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                <span>Download ATS PDF</span>
              </button>

              {/* Save As Version & Re-Analyze */}
              <button
                onClick={handleSaveAsVersion}
                disabled={isSaving}
                className="btn-glow text-xs py-1.5 px-3.5 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save as v{resume.versionNumber + 1} & Re-Analyze</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          <AnimatePresence>
            {saveSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {saveSuccessMessage}
              </motion.div>
            )}
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2"
              >
                <AlertTriangle size={16} />
                {saveError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==================== THE ATS WHITE PAPER PREVIEW SHEET ==================== */}
          <div className="bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-300 dark:border-neutral-700 p-8 sm:p-10 font-serif min-h-[750px] space-y-5 select-text print:p-0 print:border-none print:shadow-none">
            {/* Header / Contact Line */}
            <div className="text-center space-y-1 pb-2">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-950 uppercase font-sans">
                {builderData.personalInfo.fullName || 'Candidate Full Name'}
              </h1>
              {builderData.personalInfo.title && (
                <div className="text-xs font-medium text-neutral-700 font-sans tracking-wide">
                  {builderData.personalInfo.title}
                </div>
              )}
              <div className="text-[10px] text-neutral-600 font-sans pt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                {[
                  builderData.personalInfo.email,
                  builderData.personalInfo.phone,
                  builderData.personalInfo.location,
                  builderData.personalInfo.linkedin,
                  builderData.personalInfo.github
                ]
                  .filter(Boolean)
                  .map((item, idx, arr) => (
                    <span key={idx} className="flex items-center gap-2">
                      <span>{item}</span>
                      {idx < arr.length - 1 && <span className="text-neutral-400 font-bold">•</span>}
                    </span>
                  ))}
              </div>
            </div>

            {/* Professional Summary */}
            {builderData.summary && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold font-sans tracking-wider uppercase text-neutral-950 pb-0.5 border-b border-neutral-400">
                  Professional Summary
                </div>
                <p className="text-[10.5px] leading-relaxed text-neutral-800 text-justify font-sans">
                  {builderData.summary}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            {flatSkills.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold font-sans tracking-wider uppercase text-neutral-950 pb-0.5 border-b border-neutral-400">
                  Technical Skills
                </div>
                <div className="text-[10.5px] leading-relaxed text-neutral-800 font-sans">
                  <span className="font-semibold text-neutral-950">Core Competencies: </span>
                  {flatSkills.join('  •  ')}
                </div>
              </div>
            )}

            {/* Experience */}
            {builderData.experience.length > 0 && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold font-sans tracking-wider uppercase text-neutral-950 pb-0.5 border-b border-neutral-400">
                  Professional Experience
                </div>
                {builderData.experience.map((job, jIdx) => (
                  <div key={job.id || jIdx} className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs font-sans">
                      <span className="font-bold text-neutral-950">{job.role}</span>
                      <span className="font-semibold text-neutral-700 italic">
                        {[job.company, job.location].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-sans italic">
                      {[job.startDate, job.current ? 'Present' : job.endDate].filter(Boolean).join(' – ')}
                    </div>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[10px] leading-relaxed text-neutral-800 font-sans">
                      {(job.bullets || []).map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {builderData.projects.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold font-sans tracking-wider uppercase text-neutral-950 pb-0.5 border-b border-neutral-400">
                  Projects
                </div>
                {builderData.projects.map((proj, pIdx) => (
                  <div key={proj.id || pIdx} className="space-y-0.5">
                    <div className="flex items-baseline justify-between text-xs font-sans">
                      <div>
                        <span className="font-bold text-neutral-950">{proj.title}</span>
                        {proj.techStack && (
                          <span className="text-[10px] text-neutral-600 italic"> | {proj.techStack}</span>
                        )}
                      </div>
                      {proj.link && (
                        <span className="text-[10px] text-blue-600 font-sans underline">{proj.link}</span>
                      )}
                    </div>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-[10px] leading-relaxed text-neutral-800 font-sans">
                      {(proj.bullets || []).map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {builderData.education.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold font-sans tracking-wider uppercase text-neutral-950 pb-0.5 border-b border-neutral-400">
                  Education
                </div>
                {builderData.education.map((edu, eIdx) => (
                  <div key={edu.id || eIdx} className="space-y-0.5 font-sans">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-neutral-950">
                        {[edu.degree, edu.field].filter(Boolean).join(' in ') || edu.school}
                      </span>
                      <span className="font-semibold text-neutral-700 italic">{edu.school}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 italic">
                      {[edu.graduationDate ? `Graduated: ${edu.graduationDate}` : '', edu.gpa ? `GPA: ${edu.gpa}` : '']
                        .filter(Boolean)
                        .join(' | ')}
                    </div>
                    {edu.highlights && (
                      <div className="text-[10px] text-neutral-700 italic pl-2">
                        • {edu.highlights}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== PARSING & FORMATTING HELPERS ====================

function getFlatSkills(skills: any[]): string[] {
  if (!skills || !Array.isArray(skills)) return []
  if (skills.length > 0 && typeof skills[0] === 'object' && skills[0].items) {
    return skills.flatMap((c) => (Array.isArray(c.items) ? c.items : [c.items]))
  }
  return skills.map((s) => (typeof s === 'string' ? s : s.name || '')).filter(Boolean)
}

function initializeDataFromResume(resume: ResumeItem): ResumeBuilderData {
  const sections = resume.sections || {}

  // Name & Contact
  const rawContact = sections.contact || ''
  const emailMatch = rawContact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = rawContact.match(/(\+?\d[\d\s().-]{7,}\d)/)
  const candidateName =
    rawContact.split('\n')[0]?.trim() || resume.displayName?.replace(/\.[^/.]+$/, '') || 'Candidate'

  // Summary
  const summary = (sections.summary || '').trim()

  // Skills
  const rawSkills = sections.skills || ''
  const skillsList = rawSkills
    ? rawSkills
        .split(/[,\n•|]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 1 && !s.toLowerCase().includes('skills'))
    : ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git']

  // Experience
  const rawExp = sections.experience || ''
  const experience: ResumeBuilderExperienceItem[] = []

  if (rawExp) {
    const jobBlocks = rawExp.split(/\n(?=[A-Z0-9])/).filter((b: string) => b.trim().length > 10)
    if (jobBlocks.length > 0) {
      jobBlocks.forEach((block: string, idx: number) => {
        const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean)
        const roleAndComp = lines[0] || 'Software Engineer'
        const bullets = lines
          .slice(1)
          .filter((l: string) => l.startsWith('•') || l.startsWith('-') || l.length > 20)
          .map((l: string) => l.replace(/^[•\-*]\s*/, ''))

        experience.push({
          id: `exp-${idx}`,
          role: roleAndComp.split(/at|\||-/)[0]?.trim() || roleAndComp,
          company: roleAndComp.split(/at|\||-/)[1]?.trim() || 'Tech Enterprise',
          location: 'San Francisco, CA',
          startDate: '2022',
          endDate: 'Present',
          current: true,
          bullets: bullets.length > 0 ? bullets : ['Led core feature development with measurable user impact.']
        })
      })
    }
  }

  if (experience.length === 0) {
    experience.push({
      id: 'exp-default',
      role: 'Full-Stack Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      current: true,
      bullets: [
        'Designed and scaled distributed microservices supporting 100,000+ daily active users.',
        'Refactored frontend architecture to React & TypeScript, boosting Lighthouse performance by 35%.'
      ]
    })
  }

  // Projects
  const rawProj = sections.projects || ''
  const projects: ResumeBuilderProjectItem[] = []
  if (rawProj) {
    const lines = rawProj.split('\n').filter((l: string) => l.trim())
    projects.push({
      id: 'proj-1',
      title: lines[0]?.replace(/^[•\-*]\s*/, '') || 'Cloud Infrastructure Engine',
      techStack: 'React, Node.js, Docker, AWS',
      bullets: lines.slice(1).map((l: string) => l.replace(/^[•\-*]\s*/, '')).filter(Boolean)
    })
  } else {
    projects.push({
      id: 'proj-default',
      title: 'ResumeIQ AI Analysis Platform',
      techStack: 'React, TypeScript, Express, PostgreSQL',
      link: 'github.com/project/resumeiq',
      bullets: [
        'Engineered real-time ATS scoring pipeline with sub-second analysis latency.',
        'Architected comprehensive company-specific persona simulator across FAANG and startup tiers.'
      ]
    })
  }

  // Education
  const rawEdu = sections.education || ''
  const education: ResumeBuilderEducationItem[] = [
    {
      id: 'edu-1',
      school: rawEdu.split('\n')[0] || 'State University',
      degree: 'B.S.',
      field: 'Computer Science',
      graduationDate: '2021',
      gpa: '3.8/4.0',
      highlights: 'Dean’s Honor List'
    }
  ]

  return {
    personalInfo: {
      fullName: candidateName,
      title: 'Software Engineer',
      email: emailMatch ? emailMatch[0] : 'candidate@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/profile',
      github: 'github.com/profile'
    },
    summary:
      summary ||
      'Results-driven software engineer with extensive experience developing resilient web architectures, modernizing full-stack web applications, and delivering high-impact business solutions.',
    skills: skillsList,
    experience,
    projects,
    education
  }
}

function serializeToPlainText(data: ResumeBuilderData): string {
  const lines: string[] = []
  const { personalInfo } = data

  if (personalInfo.fullName) lines.push(personalInfo.fullName.toUpperCase())
  const contact = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github
  ]
    .filter(Boolean)
    .join(' | ')
  if (contact) lines.push(contact)
  lines.push('')

  if (data.summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(data.summary)
    lines.push('')
  }

  const flatSkills = getFlatSkills(data.skills)
  if (flatSkills.length > 0) {
    lines.push('TECHNICAL SKILLS')
    lines.push(flatSkills.join(', '))
    lines.push('')
  }

  if (data.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE')
    data.experience.forEach((job) => {
      lines.push(`${job.role} | ${job.company} | ${job.location || ''}`)
      lines.push(`${job.startDate || ''} - ${job.current ? 'Present' : (job.endDate || '')}`)
      job.bullets.forEach((b) => lines.push(`• ${b}`))
      lines.push('')
    })
  }

  if (data.projects.length > 0) {
    lines.push('PROJECTS')
    data.projects.forEach((proj) => {
      lines.push(`${proj.title} | ${proj.techStack || ''}`)
      if (proj.link) lines.push(proj.link)
      proj.bullets.forEach((b) => lines.push(`• ${b}`))
      lines.push('')
    })
  }

  if (data.education.length > 0) {
    lines.push('EDUCATION')
    data.education.forEach((edu) => {
      lines.push(`${edu.degree || ''} in ${edu.field || ''} | ${edu.school}`)
      if (edu.graduationDate) lines.push(`Graduated: ${edu.graduationDate}`)
      if (edu.highlights) lines.push(`• ${edu.highlights}`)
      lines.push('')
    })
  }

  return lines.join('\n')
}
