import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Copy,
  Check,
  Send,
  FileText,
  Mail,
  Loader2,
  Building,
  Target,
  Download,
  CheckCircle2,
  AlertCircle,
  Linkedin,
  UserCheck,
  Clock,
  Compass,
  Tag,
  Printer
} from 'lucide-react'
import { api, ApplicationKitResult } from '../services/api'

interface ApplicationKitProps {
  resumeId: string
  jobDescriptionText?: string
  initialJobTitle?: string
}

type MainTab = 'coverLetter' | 'outreach' | 'linkedIn' | 'subjectLines'
type OutreachPersona = 'hiringManager' | 'alumni' | 'recruiter' | 'followUp' | 'connection'

export default function ApplicationKit({
  resumeId,
  jobDescriptionText = '',
  initialJobTitle = 'Software Engineer'
}: ApplicationKitProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('coverLetter')
  const [activePersona, setActivePersona] = useState<OutreachPersona>('hiringManager')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [tone, setTone] = useState<'confident' | 'professional' | 'executive'>('confident')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApplicationKitResult | null>(null)

  // Editable copies
  const [editableCoverLetter, setEditableCoverLetter] = useState('')
  const [editableHiringManager, setEditableHiringManager] = useState('')
  const [editableAlumni, setEditableAlumni] = useState('')
  const [editableRecruiter, setEditableRecruiter] = useState('')
  const [editableFollowUp, setEditableFollowUp] = useState('')
  const [editableConnection, setEditableConnection] = useState('')
  const [editableLinkedInAbout, setEditableLinkedInAbout] = useState('')

  // Copy status
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setGenerating(true)
    setError(null)

    try {
      const data = await api.generateApplicationKit({
        resumeId,
        jobDescriptionText,
        companyName: companyName.trim() || 'Hiring Team',
        jobTitle: jobTitle.trim() || 'Software Engineer',
        tone
      })
      setResult(data)
      setEditableCoverLetter(data.coverLetter || '')
      setEditableRecruiter(data.recruiterInMail || '')
      setEditableHiringManager(data.hiringManagerPitch || data.recruiterInMail || '')
      setEditableAlumni(data.alumniReferralNote || '')
      setEditableFollowUp(data.followUpNote || '')
      setEditableConnection(data.linkedInConnectionNote || '')
      setEditableLinkedInAbout(data.linkedInAbout || '')
    } catch (err: any) {
      setError(err?.message || 'Failed to generate application kit. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const copyText = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionName)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const downloadCoverLetterTxt = () => {
    if (!editableCoverLetter) return
    const blob = new Blob([editableCoverLetter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CoverLetter_${(companyName || 'Company').replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const printCoverLetterPdf = () => {
    if (!editableCoverLetter) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const safeContent = editableCoverLetter
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Cover Letter — ${companyName || 'Application'}</title>
    <style>
      @page { margin: 1in; size: letter; }
      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        line-height: 1.65;
        color: #111827;
        margin: 0;
        padding: 40px;
        max-width: 720px;
        margin: 0 auto;
      }
      .date { margin-bottom: 24px; color: #4B5563; font-size: 14px; }
      .content { font-size: 15px; white-space: pre-wrap; line-height: 1.7; }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="date">${dateStr}</div>
    <div class="content">${safeContent}</div>
    <script>
      window.onload = function() {
        setTimeout(function() { window.print(); }, 250);
      };
    </script>
  </body>
</html>`

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const downloadFullKit = () => {
    if (!result) return

    const bundle = `=====================================================
RESUMEIQ — APPLICATION & TARGETED OUTREACH KIT
Target Company: ${result.companyName}
Target Role: ${result.jobTitle}
Tone: ${result.tone}
Generated By: ${result.generatedBy || 'ResumeIQ AI'}
=====================================================

-----------------------------------------------------
1. TAILORED COVER LETTER
-----------------------------------------------------
${editableCoverLetter}

-----------------------------------------------------
2. TARGETED OUTREACH MESSAGES
-----------------------------------------------------
[A. HIRING MANAGER DIRECT PITCH]
${editableHiringManager}

[B. ALUMNI / PEER REFERRAL REQUEST]
${editableAlumni}

[C. RECRUITER INMAIL]
${editableRecruiter}

[D. POST-APPLICATION FOLLOW-UP (DAY 5)]
${editableFollowUp}

[E. LINKEDIN CONNECTION NOTE (<300 CHARACTERS)]
${editableConnection}

-----------------------------------------------------
3. LINKEDIN PROFILE SYNCHRONIZATION
-----------------------------------------------------
[OPTIMIZED HEADLINES]
${(result.linkedInHeadlines || []).map((h, i) => `Option ${i + 1}: ${h}`).join('\n')}

[ABOUT STORY]
${editableLinkedInAbout}

[TOP 50 SEARCHABLE SKILLS]
${(result.linkedInSkills || []).join(', ')}

-----------------------------------------------------
4. EMAIL SUBJECT LINES
-----------------------------------------------------
${result.subjectLines.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;

    const blob = new Blob([bundle], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ApplicationKit_${result.companyName.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-8 border border-line dark:border-night-line shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line dark:border-night-line">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-g-blue via-g-red to-g-yellow flex items-center justify-center text-white shadow-glow-blue shrink-0">
            <Send size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon">
                1-Click AI Application &amp; Outreach Suite
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                5x Interview Multiplier
              </span>
            </div>
            <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5">
              Generate tailored cover letters, multi-persona cold outreach (Hiring Manager, Alumni, Recruiter), and synchronized LinkedIn profile assets.
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={downloadFullKit}
            className="btn-outline-glass text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Download size={13} /> Export Complete Kit (.txt)
          </button>
        )}
      </div>

      {/* Configuration Controls Form */}
      <form onSubmit={handleGenerate} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Target Company Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5 flex items-center gap-1.5">
              <Building size={13} className="text-g-blue" /> Target Company
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Microsoft, Stripe"
              className="w-full rounded-xl border border-line dark:border-night-line bg-white dark:bg-night-panel/40 px-3.5 py-2.5 text-xs font-ui text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors shadow-sm"
            />
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="text-[10px] text-ink-faint dark:text-moon-soft">Quick fill:</span>
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'Stripe', 'Netflix', 'Fast-Growing Startup'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompanyName(c)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line text-ink-soft dark:text-moon-soft hover:text-g-blue hover:border-g-blue/40 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Target Job Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5 flex items-center gap-1.5">
              <Target size={13} className="text-g-yellow" /> Target Role Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full rounded-xl border border-line dark:border-night-line bg-white dark:bg-night-panel/40 px-3.5 py-2.5 text-xs font-ui text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none focus:border-g-blue transition-colors shadow-sm"
            />
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-g-green" /> Outreach Tone
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'confident', label: 'Confident' },
                  { id: 'professional', label: 'Corporate' },
                  { id: 'executive', label: 'Executive' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`text-[11px] sm:text-xs py-2 px-1 rounded-xl font-medium border text-center transition-all ${
                    tone === t.id
                      ? 'bg-ink dark:bg-moon text-canvas dark:text-night border-ink dark:border-moon shadow-sm'
                      : 'bg-canvas-deep/40 dark:bg-night-panel/40 border-line dark:border-night-line text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span>
              {jobDescriptionText ? 'Personalized against target Job Description & resume metrics' : 'Adapts to target role requirements'}
            </span>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="btn-glow px-6 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Synthesizing Outreach Suite...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate Complete Suite
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Generated Results Area */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-line dark:border-night-line space-y-4"
        >
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-line dark:border-night-line">
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                activeTab === 'coverLetter'
                  ? 'border-g-blue text-g-blue bg-g-blue/5 font-semibold'
                  : 'border-transparent text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
              }`}
            >
              <FileText size={14} /> Tailored Cover Letter
            </button>

            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                activeTab === 'outreach'
                  ? 'border-g-blue text-g-blue bg-g-blue/5 font-semibold'
                  : 'border-transparent text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
              }`}
            >
              <Send size={14} /> Multi-Persona Cold Outreach
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-g-blue font-bold">4 Personas</span>
            </button>

            <button
              onClick={() => setActiveTab('linkedIn')}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                activeTab === 'linkedIn'
                  ? 'border-g-blue text-g-blue bg-g-blue/5 font-semibold'
                  : 'border-transparent text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
              }`}
            >
              <Linkedin size={14} className="text-[#0A66C2]" /> LinkedIn Synchronizer
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">50 Skills</span>
            </button>

            <button
              onClick={() => setActiveTab('subjectLines')}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                activeTab === 'subjectLines'
                  ? 'border-g-blue text-g-blue bg-g-blue/5 font-semibold'
                  : 'border-transparent text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
              }`}
            >
              <Mail size={14} /> Subject Lines &amp; Value Match
            </button>
          </div>

          {/* TAB 1: Cover Letter */}
          {activeTab === 'coverLetter' && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-ink-soft dark:text-moon-soft">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Personalized for <strong>{result.companyName}</strong>
                  </span>
                  {(() => {
                    const words = editableCoverLetter.trim().split(/\s+/).filter(Boolean).length
                    const isOptimal = words >= 200 && words <= 420
                    return (
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOptimal
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {words} words &bull; ~{Math.max(1, Math.round(words / 200))} min read &bull;{' '}
                        {isOptimal ? 'Optimal 1-Page Length' : 'Trim to fit 1 page'}
                      </span>
                    )
                  })()}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
                  <button
                    onClick={() => copyText(editableCoverLetter, 'coverLetter')}
                    className="btn-glow text-xs py-1.5 px-3 flex items-center gap-1.5"
                    title="Copy to clipboard"
                  >
                    {copiedSection === 'coverLetter' ? (
                      <>
                        <Check size={12} className="text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Letter</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={downloadCoverLetterTxt}
                    className="btn-outline-glass text-xs py-1.5 px-2.5 flex items-center gap-1"
                    title="Download plain text file"
                  >
                    <Download size={12} />
                    <span>.txt</span>
                  </button>

                  <button
                    onClick={printCoverLetterPdf}
                    className="btn-outline-glass text-xs py-1.5 px-2.5 flex items-center gap-1 text-g-blue border-g-blue/30 hover:bg-g-blue/10 transition-colors"
                    title="Print or Save as Formatted Business Letter PDF"
                  >
                    <Printer size={12} />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                value={editableCoverLetter}
                onChange={(e) => setEditableCoverLetter(e.target.value)}
                className="w-full rounded-2xl border border-line dark:border-night-line bg-white dark:bg-night-panel/60 p-4 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-g-blue leading-relaxed resize-y shadow-sm font-sans"
              />
            </div>
          )}

          {/* TAB 2: Multi-Persona Cold Outreach */}
          {activeTab === 'outreach' && (
            <div className="space-y-4 pt-2">
              {/* Persona Selector Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'hiringManager', label: 'Hiring Manager Pitch', icon: Target, badge: 'High Conversion' },
                  { id: 'alumni', label: 'Alumni Referral Ask', icon: UserCheck, badge: 'Internal Referral' },
                  { id: 'recruiter', label: 'Recruiter InMail', icon: Send, badge: 'Fast Screen' },
                  { id: 'followUp', label: 'Day 5 Follow-Up', icon: Clock, badge: 'Post-Apply' },
                  { id: 'connection', label: 'LinkedIn Note (<300 char)', icon: Compass, badge: 'Max 300' }
                ].map((p) => {
                  const Icon = p.icon
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePersona(p.id as OutreachPersona)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                        activePersona === p.id
                          ? 'bg-ink dark:bg-moon text-paper dark:text-night shadow-sm font-semibold'
                          : 'bg-canvas-deep/50 dark:bg-night-panel/50 text-ink-soft dark:text-moon-soft hover:text-ink dark:hover:text-moon'
                      }`}
                    >
                      <Icon size={13} />
                      {p.label}
                    </button>
                  )
                })}
              </div>

              {/* Persona Editor and Tip */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePersona}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-ink-soft dark:text-moon-soft">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink dark:text-moon">
                        {activePersona === 'hiringManager' && 'Direct Engineering Manager / Lead Pitch'}
                        {activePersona === 'alumni' && 'Warm Alumni & Team Member Referral Request'}
                        {activePersona === 'recruiter' && 'Corporate & Technical Recruiter InMail'}
                        {activePersona === 'followUp' && 'Post-Application Status Check (5 Days Post-Submission)'}
                        {activePersona === 'connection' && 'LinkedIn Add-Note Connection Request'}
                      </span>
                      {activePersona === 'connection' && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                            editableConnection.length <= 300
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}
                        >
                          {editableConnection.length} / 300 chars
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const text =
                          activePersona === 'hiringManager'
                            ? editableHiringManager
                            : activePersona === 'alumni'
                            ? editableAlumni
                            : activePersona === 'recruiter'
                            ? editableRecruiter
                            : activePersona === 'followUp'
                            ? editableFollowUp
                            : editableConnection
                        copyText(text, activePersona)
                      }}
                      className="btn-glow text-xs py-1.5 px-3.5 flex items-center gap-1"
                    >
                      {copiedSection === activePersona ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy Message
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={activePersona === 'connection' ? 4 : 7}
                    value={
                      activePersona === 'hiringManager'
                        ? editableHiringManager
                        : activePersona === 'alumni'
                        ? editableAlumni
                        : activePersona === 'recruiter'
                        ? editableRecruiter
                        : activePersona === 'followUp'
                        ? editableFollowUp
                        : editableConnection
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      if (activePersona === 'hiringManager') setEditableHiringManager(val)
                      else if (activePersona === 'alumni') setEditableAlumni(val)
                      else if (activePersona === 'recruiter') setEditableRecruiter(val)
                      else if (activePersona === 'followUp') setEditableFollowUp(val)
                      else setEditableConnection(val)
                    }}
                    className="w-full rounded-2xl border border-line dark:border-night-line bg-white dark:bg-night-panel/60 p-4 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-g-blue leading-relaxed resize-y shadow-sm font-sans"
                  />

                  {/* Tactical Outreach Tip */}
                  <div className="p-3.5 rounded-xl bg-g-blue/5 border border-g-blue/20 flex items-start gap-2.5">
                    <Sparkles size={16} className="text-g-blue shrink-0 mt-0.5" />
                    <p className="text-[11px] text-ink-soft dark:text-moon-soft leading-relaxed">
                      {activePersona === 'hiringManager' && (
                        <span>
                          <strong className="text-ink dark:text-moon">Strategy:</strong> Search LinkedIn for &ldquo;Engineering Manager at {result.companyName}&rdquo; or &ldquo;Lead at {result.companyName}&rdquo;. Sending this message directly bypasses the standard ATS queue and gets your resume seen by decision-makers.
                        </span>
                      )}
                      {activePersona === 'alumni' && (
                        <span>
                          <strong className="text-ink dark:text-moon">Strategy:</strong> Filter LinkedIn people by your College/University and company &ldquo;{result.companyName}&rdquo;. Employees receive lucrative referral bonuses for referring qualified candidates, so they are incentivized to help!
                        </span>
                      )}
                      {activePersona === 'recruiter' && (
                        <span>
                          <strong className="text-ink dark:text-moon">Strategy:</strong> Search for &ldquo;Technical Recruiter {result.companyName}&rdquo; and send this within 24 hours of applying online to pull your application to the top of their review pile.
                        </span>
                      )}
                      {activePersona === 'followUp' && (
                        <span>
                          <strong className="text-ink dark:text-moon">Strategy:</strong> Send this 5-7 business days after submitting your resume if you haven’t received a status update. Polite follow-ups increase interview chances by 22%.
                        </span>
                      )}
                      {activePersona === 'connection' && (
                        <span>
                          <strong className="text-ink dark:text-moon">Strategy:</strong> When connecting with employees or recruiters, always click &ldquo;Add a note&rdquo;. Connection requests with personalized notes have an 85% higher acceptance rate.
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* TAB 3: LinkedIn Profile Synchronizer */}
          {activeTab === 'linkedIn' && (
            <div className="space-y-6 pt-2">
              {/* 3 Optimized Headlines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                    <Linkedin size={14} className="text-[#0A66C2]" /> 3 High-Converting LinkedIn Headlines
                  </h4>
                  <span className="text-[10px] text-ink-soft dark:text-moon-soft">Optimized for recruiter search indexing</span>
                </div>

                <div className="space-y-2.5">
                  {(result.linkedInHeadlines || []).map((headline, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <span className="text-[10px] font-mono text-ink-soft dark:text-moon-soft block mb-0.5">
                          Option {idx + 1} {idx === 0 ? '(Role & Stack)' : idx === 1 ? '(Scale & Metric)' : '(Value Focused)'}:
                        </span>
                        <span className="font-medium text-ink dark:text-moon leading-relaxed">{headline}</span>
                      </div>
                      <button
                        onClick={() => copyText(headline, `headline-${idx}`)}
                        className="btn-outline-glass text-xs py-1.5 px-3 shrink-0 flex items-center gap-1 self-end sm:self-center"
                      >
                        {copiedSection === `headline-${idx}` ? (
                          <>
                            <Check size={12} className="text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy Headline
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LinkedIn About Story */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                    <FileText size={14} className="text-g-blue" /> Mobile-Optimized LinkedIn &ldquo;About&rdquo; Summary
                  </h4>
                  <button
                    onClick={() => copyText(editableLinkedInAbout, 'linkedInAbout')}
                    className="btn-glow text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    {copiedSection === 'linkedInAbout' ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy About
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={editableLinkedInAbout}
                  onChange={(e) => setEditableLinkedInAbout(e.target.value)}
                  className="w-full rounded-2xl border border-line dark:border-night-line bg-white dark:bg-night-panel/60 p-4 text-xs font-ui text-ink dark:text-moon focus:outline-none focus:border-g-blue leading-relaxed resize-y shadow-sm font-sans"
                />
              </div>

              {/* Top 50 Searchable LinkedIn Skills */}
              {result.linkedInSkills && result.linkedInSkills.length > 0 && (
                <div className="p-5 rounded-2xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-line dark:border-night-line space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-ink dark:text-moon flex items-center gap-1.5">
                        <Tag size={13} className="text-emerald-500" /> Top 50 Searchable LinkedIn Skills
                      </h4>
                      <p className="text-[11px] text-ink-soft dark:text-moon-soft mt-0.5">
                        Recruiter algorithms index these exact terms when conducting Boolean candidate searches.
                      </p>
                    </div>

                    <button
                      onClick={() => copyText(result.linkedInSkills!.join(', '), 'allSkills')}
                      className="btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                    >
                      {copiedSection === 'allSkills' ? (
                        <>
                          <Check size={12} className="text-emerald-500" /> All 50 Skills Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy All (Comma-Separated)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {result.linkedInSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white dark:bg-night-card border border-line dark:border-night-line text-ink dark:text-moon shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Subject Lines & Highlights */}
          {activeTab === 'subjectLines' && (
            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-2.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-g-blue" /> High-Open-Rate Subject Lines
                </h4>
                <div className="space-y-2">
                  {result.subjectLines.map((subj, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-ink dark:text-moon truncate">{subj}</span>
                      <button
                        onClick={() => copyText(subj, `subj-${idx}`)}
                        className="btn-outline-glass text-xs py-1 px-2.5 shrink-0 flex items-center gap-1"
                      >
                        {copiedSection === `subj-${idx}` ? (
                          <>
                            <Check size={11} className="text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {result.keyHighlightPoints && result.keyHighlightPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-moon-soft mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" /> Key Value Differentiators for Interviews
                  </h4>
                  <div className="space-y-1.5">
                    {result.keyHighlightPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-canvas-deep/30 dark:bg-night-panel/30 border border-line dark:border-night-line text-xs text-ink-soft dark:text-moon-soft flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
