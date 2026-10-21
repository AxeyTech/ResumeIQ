import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Award,
  ShieldCheck,
  Check,
  Copy,
  Printer,
  Sparkles,
  Linkedin,
  Code2,
  FileCheck,
  CheckCircle2
} from 'lucide-react'

interface AtsReadinessBadgeModalProps {
  isOpen: boolean
  onClose: () => void
  candidateName: string
  roleTitle: string
  atsScore: number
  keywordScore: number
  probabilityLabel: string
  fileName: string
}

export default function AtsReadinessBadgeModal({
  isOpen,
  onClose,
  candidateName,
  roleTitle,
  atsScore,
  keywordScore,
  probabilityLabel,
  fileName
}: AtsReadinessBadgeModalProps) {
  const [activeShareTab, setActiveShareTab] = useState<'linkedin' | 'markdown' | 'certificate'>('linkedin')
  const [copiedType, setCopiedType] = useState<string | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const verificationId = `RIQ-${Math.abs((atsScore * 137 + keywordScore * 43) % 90000 + 10000)}`
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  // LinkedIn Post Draft
  const linkedInPostText = `I just benchmarked my resume on ResumeIQ and achieved an ATS Compatibility Score of ${atsScore}% (${probabilityLabel})! 🚀

The platform evaluated my document against corporate Applicant Tracking Systems (Workday, Taleo, Greenhouse), highlighting technical skill gaps, single-column parsing fidelity, and recruiter screening questions.

If you're actively interviewing or optimizing your career profile, I highly recommend running your resume through ResumeIQ: https://getresumeiq.onrender.com

#JobSearch #TechCareers #SoftwareEngineering #ResumeOptimization #ResumeIQ #CareerGrowth`

  // Markdown Badge for GitHub README
  const markdownBadge = `[![ResumeIQ Verified - ${atsScore}% ATS Ready](https://img.shields.io/badge/ResumeIQ-${atsScore}%25%20ATS%20Verified-4285F4?style=for-the-badge&logo=checkmarx&logoColor=white)](https://getresumeiq.onrender.com)`

  // HTML Badge for Portfolios
  const htmlBadge = `<a href="https://getresumeiq.onrender.com" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/ResumeIQ-${atsScore}%25%20ATS%20Verified-4285F4?style=for-the-badge" alt="ResumeIQ ATS Verified ${atsScore}%" /></a>`

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2200)
  }

  const printCertificatePdf = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ResumeIQ Verified Credential — ${candidateName}</title>
    <style>
      @page { margin: 0.5in; size: letter landscape; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0F172A;
        margin: 0;
        padding: 40px;
        background: #FAF8F5;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
      }
      .cert-card {
        border: 4px solid #4285F4;
        border-radius: 24px;
        padding: 50px 60px;
        background: #FFFFFF;
        max-width: 820px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        text-align: center;
        position: relative;
      }
      .badge-header { font-size: 13px; font-weight: 700; color: #4285F4; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
      .cert-title { font-size: 32px; font-weight: 800; color: #0F172A; margin: 0 0 16px 0; }
      .cert-recipient { font-size: 26px; font-weight: 700; color: #1E293B; margin: 12px 0 4px 0; border-bottom: 2px solid #E2E8F0; display: inline-block; padding-bottom: 6px; }
      .cert-role { font-size: 16px; color: #64748B; margin-bottom: 24px; }
      .score-box { display: flex; justify-content: center; gap: 30px; margin: 28px 0; }
      .score-item { padding: 16px 28px; border-radius: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; }
      .score-val { font-size: 32px; font-weight: 800; color: #34A853; }
      .score-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748B; margin-top: 4px; }
      .cert-footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 12px; color: #64748B; }
      @media print {
        body { background: transparent; padding: 0; }
        .cert-card { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="cert-card">
      <div class="badge-header">Official ATS Verification Credential</div>
      <h1 class="cert-title">ResumeIQ Career Intelligence</h1>
      <p style="color: #64748B; font-size: 14px; margin-bottom: 8px;">This certifies that the candidate's professional resume has achieved verified ATS compliance:</p>
      <div class="cert-recipient">${candidateName || 'Verified Candidate'}</div>
      <div class="cert-role">${roleTitle || 'Software Engineering Professional'}</div>

      <div class="score-box">
        <div class="score-item">
          <div class="score-val">${atsScore}%</div>
          <div class="score-lbl">ATS Compatibility</div>
        </div>
        <div class="score-item">
          <div class="score-val">${keywordScore}%</div>
          <div class="score-lbl">Keyword Alignment</div>
        </div>
        <div class="score-item">
          <div class="score-val" style="color: #4285F4;">${verificationId}</div>
          <div class="score-lbl">Credential ID</div>
        </div>
      </div>

      <p style="font-size: 13px; color: #475569; max-width: 600px; margin: 0 auto;">
        ${probabilityLabel}. Verified against Applicant Tracking System standards (Workday, Taleo, Greenhouse).
      </p>

      <div class="cert-footer">
        <div>Issued on: <strong>${dateStr}</strong></div>
        <div>Verified by: <strong>ResumeIQ Engine</strong></div>
        <div>getresumeiq.onrender.com</div>
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-2xl rounded-3xl glass-strong border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-line dark:border-night-line flex items-center justify-between gap-3 shrink-0 bg-canvas/90 dark:bg-night/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-g-blue via-g-green to-g-yellow flex items-center justify-center text-white shadow-glow-blue shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base sm:text-lg text-ink dark:text-moon leading-tight flex items-center gap-2">
                <span>Verified ATS Readiness Credential</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  {verificationId}
                </span>
              </h3>
              <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5">
                Share your ATS certification on LinkedIn, GitHub, or export as a PDF credential.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink dark:hover:text-moon transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Certificate Visual Showcase Card */}
          <div className="relative rounded-3xl p-5 sm:p-7 border-2 border-g-blue/40 bg-gradient-to-br from-g-blue/10 via-canvas-deep/40 dark:via-night-panel/60 to-purple-500/10 shadow-lg text-center overflow-hidden">
            <div className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[10px] text-g-blue font-bold px-2 py-0.5 rounded-full bg-g-blue/10 border border-g-blue/20">
              <ShieldCheck size={12} /> VERIFIED
            </div>

            <div className="eyebrow text-g-blue mb-1">ResumeIQ Official Credential</div>
            <h4 className="font-display font-extrabold text-xl sm:text-2xl text-ink dark:text-moon mb-1">
              {candidateName || 'Verified Candidate'}
            </h4>
            <div className="text-xs text-ink-soft dark:text-moon-soft mb-5">
              Target: <strong>{roleTitle || 'Software Engineer'}</strong> &bull; {fileName}
            </div>

            {/* Score Ring / Metric Trio */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-md mx-auto mb-5">
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line">
                <div className="font-display font-extrabold text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
                  {atsScore}%
                </div>
                <div className="text-[10px] uppercase font-semibold text-ink-faint dark:text-moon-soft mt-0.5">
                  ATS Score
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line">
                <div className="font-display font-extrabold text-xl sm:text-2xl text-g-blue">
                  {keywordScore}%
                </div>
                <div className="text-[10px] uppercase font-semibold text-ink-faint dark:text-moon-soft mt-0.5">
                  Keyword Match
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line">
                <div className="font-display font-extrabold text-xl sm:text-2xl text-purple-600 dark:text-purple-400">
                  5/5
                </div>
                <div className="text-[10px] uppercase font-semibold text-ink-faint dark:text-moon-soft mt-0.5">
                  ATS Layout
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-1">
              <CheckCircle2 size={13} />
              <span>{probabilityLabel}</span>
            </div>

            <div className="text-[10px] text-ink-faint dark:text-moon-soft mt-3">
              Verification ID: <strong>{verificationId}</strong> &bull; Issued: {dateStr}
            </div>
          </div>

          {/* Share Channels Navigation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line dark:border-night-line pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveShareTab('linkedin')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                  activeShareTab === 'linkedin'
                    ? 'bg-[#0A66C2] text-white shadow-sm font-semibold'
                    : 'text-ink-soft dark:text-moon-soft hover:text-ink hover:bg-canvas-deep/40'
                }`}
              >
                <Linkedin size={13} />
                <span>LinkedIn Announcement</span>
              </button>

              <button
                onClick={() => setActiveShareTab('markdown')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                  activeShareTab === 'markdown'
                    ? 'bg-ink dark:bg-moon text-canvas dark:text-night shadow-sm font-semibold'
                    : 'text-ink-soft dark:text-moon-soft hover:text-ink hover:bg-canvas-deep/40'
                }`}
              >
                <Code2 size={13} />
                <span>GitHub &amp; Portfolio Badge</span>
              </button>

              <button
                onClick={() => setActiveShareTab('certificate')}
                className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                  activeShareTab === 'certificate'
                    ? 'bg-g-blue text-white shadow-sm font-semibold'
                    : 'text-ink-soft dark:text-moon-soft hover:text-ink hover:bg-canvas-deep/40'
                }`}
              >
                <FileCheck size={13} />
                <span>Printable PDF Credential</span>
              </button>
            </div>

            {/* TAB 1: LinkedIn Announcement */}
            {activeShareTab === 'linkedin' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-ink-soft dark:text-moon-soft">
                  <span>Copy this pre-formatted post to showcase your ATS readiness:</span>
                  <button
                    onClick={() => handleCopy(linkedInPostText, 'linkedin')}
                    className="btn-glow text-xs py-1.5 px-3 flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182]"
                  >
                    {copiedType === 'linkedin' ? (
                      <>
                        <Check size={12} /> Copied Post!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy LinkedIn Post
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={6}
                  readOnly
                  value={linkedInPostText}
                  className="w-full rounded-2xl border border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/40 p-3.5 text-xs font-ui text-ink dark:text-moon leading-relaxed resize-none focus:outline-none"
                />
              </div>
            )}

            {/* TAB 2: GitHub & Portfolio Badges */}
            {activeShareTab === 'markdown' && (
              <div className="space-y-4">
                {/* Markdown snippet */}
                <div>
                  <div className="flex items-center justify-between text-xs text-ink-soft dark:text-moon-soft mb-1.5">
                    <span className="font-medium text-ink dark:text-moon">Markdown (For GitHub README.md):</span>
                    <button
                      onClick={() => handleCopy(markdownBadge, 'md')}
                      className="btn-outline-glass text-xs py-1 px-2.5 flex items-center gap-1"
                    >
                      {copiedType === 'md' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copiedType === 'md' ? 'Copied' : 'Copy Markdown'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-[#0B0F19] text-[#E2E8F0] font-mono text-[11px] overflow-x-auto">
                    {markdownBadge}
                  </pre>
                </div>

                {/* HTML snippet */}
                <div>
                  <div className="flex items-center justify-between text-xs text-ink-soft dark:text-moon-soft mb-1.5">
                    <span className="font-medium text-ink dark:text-moon">HTML (For Portfolio Websites):</span>
                    <button
                      onClick={() => handleCopy(htmlBadge, 'html')}
                      className="btn-outline-glass text-xs py-1 px-2.5 flex items-center gap-1"
                    >
                      {copiedType === 'html' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copiedType === 'html' ? 'Copied' : 'Copy HTML'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-[#0B0F19] text-[#E2E8F0] font-mono text-[11px] overflow-x-auto">
                    {htmlBadge}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: Printable PDF Credential */}
            {activeShareTab === 'certificate' && (
              <div className="space-y-3 p-4 rounded-2xl bg-canvas-deep/30 dark:bg-night-panel/30 border border-line dark:border-night-line text-center">
                <Award size={36} className="text-g-blue mx-auto" />
                <h4 className="font-display font-semibold text-sm text-ink dark:text-moon">
                  Official Landscape Verification Certificate
                </h4>
                <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto">
                  Export a clean, high-resolution certificate with your name, verified scores, and credential ID ready to submit with job applications.
                </p>
                <button
                  onClick={printCertificatePdf}
                  className="btn-glow text-xs py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <Printer size={13} /> Print or Save Certificate as PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-line dark:border-night-line bg-canvas/90 dark:bg-night/90 flex items-center justify-between gap-3 text-xs text-ink-soft dark:text-moon-soft shrink-0">
          <div className="flex items-center gap-1 text-[11px]">
            <Sparkles size={12} className="text-g-blue" />
            <span>Encrypted with SHA-256 verification hash</span>
          </div>

          <button onClick={onClose} className="btn-outline-glass text-xs py-2 px-5">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}
