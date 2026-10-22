import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Scan,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  Download,
  Search,
  User,
  Mail,
  Phone,
  Globe,
  Loader2,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react'
import { api, AtsXRayResponse } from '../services/api'

interface AtsXRayModalProps {
  resumeId: string
  displayName: string
  isOpen: boolean
  onClose: () => void
}

export default function AtsXRayModal({
  resumeId,
  displayName,
  isOpen,
  onClose,
}: AtsXRayModalProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'sections' | 'diagnostics'>('terminal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AtsXRayResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load X-Ray data when modal opens
  useEffect(() => {
    if (isOpen && resumeId) {
      loadXRayData()
    }
  }, [isOpen, resumeId])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const loadXRayData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getResumeXRay(resumeId)
      setData(res)
    } catch (err: any) {
      setError(err?.message || 'Failed to extract ATS raw text. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyRawText = () => {
    if (!data?.rawText) return
    navigator.clipboard.writeText(data.rawText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handleDownloadTxt = () => {
    if (!data?.rawText) return
    const blob = new Blob([data.rawText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${displayName.replace(/\.[^/.]+$/, '')}-ATS-Raw-Extracted.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Filtered raw text lines
  const rawLines = useMemo(() => {
    if (!data?.rawText) return []
    return data.rawText.split(/\r?\n/)
  }, [data?.rawText])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-5xl rounded-3xl glass-strong border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-line dark:border-night-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-canvas/90 dark:bg-night/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-g-gradient flex items-center justify-center text-white shadow-glow-blue shrink-0">
              <Scan size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-lg sm:text-xl text-ink dark:text-moon leading-tight">
                  ATS Machine "X-Ray" Vision
                </h3>
                {data && (
                  <span
                    className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      data.parsabilityScore >= 85
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : data.parsabilityScore >= 70
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}
                  >
                    {data.parsabilityScore}% Parsability Health
                  </span>
                )}
              </div>
              <p className="font-ui text-xs text-ink-soft dark:text-moon-soft mt-0.5 truncate max-w-[280px] sm:max-w-md">
                Target: <strong>{displayName}</strong> &bull; Inspect raw parsed text before Workday or Taleo strips it.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {data && (
              <>
                <button
                  onClick={handleCopyRawText}
                  className={`btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1.5 transition-all ${
                    copied ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 font-medium' : ''
                  }`}
                  title="Copy unformatted text to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span className="text-emerald-500">Copied Text!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="hidden xs:inline">Copy Raw Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="btn-outline-glass text-xs py-1.5 px-3 flex items-center gap-1.5"
                  title="Download .txt plain text file"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Export .txt</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink dark:hover:text-moon transition-colors ml-1"
              aria-label="Close ATS X-Ray modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-g-blue mx-auto" />
              <p className="font-ui text-sm text-ink-soft dark:text-moon-soft">
                Decrypting and rendering ATS machine representation...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3 my-8">
              <AlertTriangle size={32} className="text-red-500 mx-auto" />
              <h4 className="font-display font-semibold text-sm text-red-600 dark:text-red-400">
                Failed to Render ATS X-Ray
              </h4>
              <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto">{error}</p>
              <button
                onClick={loadXRayData}
                className="btn-glow text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <RefreshCw size={12} /> Retry Inspection
              </button>
            </div>
          ) : data ? (
            <>
              {/* Quick Diagnostic Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                {/* 1. Candidate Name / Contact */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint dark:text-moon-soft flex items-center gap-1 mb-1">
                    <User size={12} className="text-g-blue" />
                    Candidate Header
                  </div>
                  <div className="font-display font-semibold text-xs sm:text-sm text-ink dark:text-moon truncate">
                    {data.extractedEntities.name || 'Not Isolated'}
                  </div>
                  <div className="text-[10px] text-ink-soft dark:text-moon-soft truncate mt-0.5">
                    {data.extractedEntities.email || 'No email found'}
                  </div>
                </div>

                {/* 2. Detected Sections */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint dark:text-moon-soft flex items-center gap-1 mb-1">
                    <Layers size={12} className="text-emerald-500" />
                    Sections Parsed
                  </div>
                  <div className="font-display font-semibold text-xs sm:text-sm text-ink dark:text-moon">
                    {data.stats.detectedSectionsCount} / {data.stats.totalSectionsCount} Sections
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
                    {data.stats.detectedSectionsCount >= 5 ? 'Standard Format Match' : 'Missing Headers'}
                  </div>
                </div>

                {/* 3. Word & Line Density */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint dark:text-moon-soft flex items-center gap-1 mb-1">
                    <Terminal size={12} className="text-amber-500" />
                    Text Density
                  </div>
                  <div className="font-display font-semibold text-xs sm:text-sm text-ink dark:text-moon">
                    {data.stats.wordCount} words
                  </div>
                  <div className="text-[10px] text-ink-soft dark:text-moon-soft truncate mt-0.5">
                    {data.stats.lineCount} lines ({data.fileType.toUpperCase()})
                  </div>
                </div>

                {/* 4. Layout Risk Flags */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint dark:text-moon-soft flex items-center gap-1 mb-1">
                    <ShieldCheck size={12} className="text-purple-500" />
                    Layout Health
                  </div>
                  <div className="font-display font-semibold text-xs sm:text-sm text-ink dark:text-moon">
                    {data.formattingFlags.length === 0 ? 'Zero Risk' : `${data.formattingFlags.length} Warnings`}
                  </div>
                  <div
                    className={`text-[10px] font-medium truncate mt-0.5 ${
                      data.formattingFlags.length === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {data.formattingFlags.length === 0 ? 'Clean single-column' : 'Flattening alert'}
                  </div>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line dark:border-night-line pb-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-canvas-deep/60 dark:bg-night-panel/60 border border-line dark:border-night-line self-start">
                  <button
                    onClick={() => setActiveTab('terminal')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-ui font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'terminal'
                        ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-sm border border-line dark:border-night-line'
                        : 'text-ink-soft dark:text-moon-soft hover:text-ink'
                    }`}
                  >
                    <Terminal size={13} className="text-g-blue" />
                    <span>Robot Plain Text</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('sections')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-ui font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'sections'
                        ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-sm border border-line dark:border-night-line'
                        : 'text-ink-soft dark:text-moon-soft hover:text-ink'
                    }`}
                  >
                    <Layers size={13} className="text-emerald-500" />
                    <span>Section Matrix ({data.stats.detectedSectionsCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('diagnostics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-ui font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'diagnostics'
                        ? 'bg-white dark:bg-night-surface text-ink dark:text-moon shadow-sm border border-line dark:border-night-line'
                        : 'text-ink-soft dark:text-moon-soft hover:text-ink'
                    }`}
                  >
                    <ShieldCheck size={13} className="text-purple-500" />
                    <span>Diagnostics ({data.formattingFlags.length})</span>
                  </button>
                </div>

                {activeTab === 'terminal' && (
                  <div className="relative w-full sm:w-64">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint dark:text-moon-soft"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter raw text..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-canvas-deep/50 dark:bg-night-panel/50 border border-line dark:border-night-line text-xs font-ui text-ink dark:text-moon placeholder:text-ink-faint focus:outline-none focus:border-g-blue"
                    />
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* SUB-TAB 1: ROBOT PLAIN TEXT (TERMINAL EMULATOR) */}
              {/* ========================================================= */}
              {activeTab === 'terminal' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-ink-soft dark:text-moon-soft px-1">
                    <span>
                      ATS Parser output &bull; Showing exactly what Workday, Taleo & Greenhouse ingest into their candidate database:
                    </span>
                    <span className="font-mono text-ink-faint">
                      {rawLines.length} lines total
                    </span>
                  </div>

                  <div className="rounded-2xl border border-line dark:border-night-line bg-[#0B0F19] text-[#E2E8F0] p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner max-h-[460px] overflow-y-auto selection:bg-g-blue/30 selection:text-white">
                    {rawLines.length === 0 ? (
                      <p className="text-gray-500 italic">No text extracted.</p>
                    ) : (
                      <div className="space-y-0.5">
                        {rawLines.map((line, idx) => {
                          const isHeading = /^(experience|skills|education|projects|summary|certifications|contact)/i.test(
                            line.trim()
                          )
                          const matchesQuery =
                            searchQuery.trim() &&
                            line.toLowerCase().includes(searchQuery.trim().toLowerCase())

                          if (searchQuery.trim() && !matchesQuery) return null

                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 py-0.5 px-1.5 rounded transition-colors ${
                                matchesQuery
                                  ? 'bg-amber-500/20 text-amber-200'
                                  : isHeading
                                  ? 'bg-g-blue/15 text-g-blue font-bold border-l-2 border-g-blue pl-2'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <span className="text-[10px] text-gray-600 select-none w-8 text-right shrink-0 pt-0.5 font-mono">
                                {idx + 1}
                              </span>
                              <span className="break-words flex-1 whitespace-pre-wrap">
                                {line || <span className="opacity-15">&crarr;</span>}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SUB-TAB 2: PARSED SECTIONS MATRIX */}
              {/* ========================================================= */}
              {activeTab === 'sections' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-ink dark:text-moon flex items-center gap-2.5">
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    <span>
                      ATS parsers group extracted text into standard section buckets. If a section is marked <strong>Missing</strong>, standard resume headings (like <em>Experience</em> or <em>Education</em>) were not identified.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {data.sectionBreakdown.map((sec) => (
                      <div
                        key={sec.key}
                        className={`p-4 rounded-2xl border transition-all ${
                          sec.detected
                            ? 'bg-canvas-deep/30 dark:bg-night-panel/30 border-line dark:border-night-line'
                            : 'bg-red-500/5 dark:bg-red-500/10 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {sec.detected ? (
                              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            ) : (
                              <AlertTriangle size={14} className="text-red-500 shrink-0" />
                            )}
                            <h4 className="font-display font-semibold text-xs sm:text-sm text-ink dark:text-moon">
                              {sec.title}
                            </h4>
                          </div>

                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              sec.detected
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/15 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {sec.detected ? `${sec.charCount} chars` : 'Missing / Not Found'}
                          </span>
                        </div>

                        <p className="text-[11px] text-ink-faint dark:text-moon-soft/70 mb-2">
                          {sec.description}
                        </p>

                        {sec.detected && sec.preview && (
                          <div className="p-2.5 rounded-xl bg-canvas/70 dark:bg-night/70 border border-line/60 dark:border-night-line/60 text-[11px] font-mono text-ink-soft dark:text-moon-soft line-clamp-3">
                            "{sec.preview}"
                          </div>
                        )}

                        {!sec.detected && (
                          <p className="text-[11px] text-red-600 dark:text-red-400 italic">
                            ⚠️ Use exact standard heading (e.g. "{sec.title}") on its own line to guarantee ATS detection.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SUB-TAB 3: DIAGNOSTICS & MACHINE INTEGRITY */}
              {/* ========================================================= */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-4">
                  {data.formattingFlags.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                      <ShieldCheck size={40} className="text-emerald-500 mx-auto" />
                      <h4 className="font-display font-semibold text-base text-emerald-700 dark:text-emerald-400">
                        100% Clean ATS Formatting Detected
                      </h4>
                      <p className="text-xs text-ink-soft dark:text-moon-soft max-w-md mx-auto leading-relaxed">
                        Zero layout flattening anomalies detected. Your resume uses a linear single-column structure that standard ATS parsers can read without scramble or token corruption.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                        <span>
                          {data.formattingFlags.length} structural concern(s) detected that may cause parsing issues in strict corporate ATS software:
                        </span>
                      </div>

                      {data.formattingFlags.map((flag, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-4 rounded-2xl bg-canvas-deep/40 dark:bg-night-panel/40 border border-line dark:border-night-line space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                              {flag.code}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              {flag.severity} priority
                            </span>
                          </div>
                          <p className="text-xs text-ink dark:text-moon leading-relaxed">
                            {flag.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Extracted Contact Entities Checklist */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-canvas-deep/30 dark:bg-night-panel/30 border border-line dark:border-night-line">
                    <h4 className="font-display font-semibold text-xs sm:text-sm text-ink dark:text-moon mb-3 flex items-center gap-1.5">
                      <User size={14} className="text-g-blue" />
                      Contact Entity Extractor Verification
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line flex items-center justify-between">
                        <span className="text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                          <User size={12} className="text-ink-faint" /> Name:
                        </span>
                        <span className="font-medium text-ink dark:text-moon truncate max-w-[160px]">
                          {data.extractedEntities.name || <span className="text-red-500">Not detected</span>}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line flex items-center justify-between">
                        <span className="text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                          <Mail size={12} className="text-ink-faint" /> Email:
                        </span>
                        <span className="font-medium text-ink dark:text-moon truncate max-w-[160px]">
                          {data.extractedEntities.email || <span className="text-red-500">Not detected</span>}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line flex items-center justify-between">
                        <span className="text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                          <Phone size={12} className="text-ink-faint" /> Phone:
                        </span>
                        <span className="font-medium text-ink dark:text-moon truncate max-w-[160px]">
                          {data.extractedEntities.phone || <span className="text-amber-500">Not detected</span>}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-night-panel/70 border border-line dark:border-night-line flex items-center justify-between">
                        <span className="text-ink-soft dark:text-moon-soft flex items-center gap-1.5">
                          <Globe size={12} className="text-ink-faint" /> LinkedIn / Portfolio:
                        </span>
                        <span className="font-medium text-ink dark:text-moon truncate max-w-[160px]">
                          {data.extractedEntities.linkedin || data.extractedEntities.github || (
                            <span className="text-ink-faint">None</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-line dark:border-night-line bg-canvas/90 dark:bg-night/90 flex flex-col xs:flex-row items-center justify-between gap-2.5 text-xs text-ink-soft dark:text-moon-soft shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles size={13} className="text-g-blue" />
            <span>Simulated with Workday & Taleo parsing heuristics</span>
          </div>

          <button
            onClick={onClose}
            className="w-full xs:w-auto btn-outline-glass text-xs py-2 px-5"
          >
            Close Inspector
          </button>
        </div>
      </motion.div>
    </div>
  )
}
