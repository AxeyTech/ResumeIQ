import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  FileText,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import ResuAvatar, { ResuMood } from './ResuAvatar'
import { api, ResumeItem, AnalysisResult, CareerCopilotChatMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ActiveSuiteTab } from './Dashboard'

interface CareerChatbotProps {
  currentResume?: ResumeItem | null
  currentAnalysis?: AnalysisResult | null
  jobDescription?: string
  onNavigateToTab?: (tab: ActiveSuiteTab) => void
  isOpen?: boolean
  onToggleOpen?: () => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  suggestedFollowUps?: string[]
  contextApplied?: {
    resumeName?: string
    version?: number
    atsScore?: number | string | null
    missingKeywordsCount?: number
  } | null
}

const DEFAULT_STARTER_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Boost ATS Score',
    prompt: 'How do I boost my ATS score and fix missing keywords without keyword stuffing?',
  },
  {
    icon: Sparkles,
    label: 'STAR Bullet Rewrites',
    prompt: 'Rewrite my most recent experience bullets using the Google X-Y-Z and STAR formula with metrics.',
  },
  {
    icon: MessageSquare,
    label: 'Expected Interview Qs',
    prompt: 'What are the top 4 behavioral and technical interview questions recruiters will ask based on my resume?',
  },
  {
    icon: FileText,
    label: 'FAANG Screening Fit',
    prompt: 'How does my resume measure against FAANG & Tier-1 tech company screening standards?',
  },
]

export default function CareerChatbot({
  currentResume,
  currentAnalysis,
  jobDescription,
  onNavigateToTab,
  isOpen: controlledIsOpen,
  onToggleOpen: controlledOnToggleOpen,
}: CareerChatbotProps) {
  const { user } = useAuth()
  // Internal open state if uncontrolled
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isChatOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const toggleChatOpen = controlledOnToggleOpen || (() => setInternalIsOpen(!internalIsOpen))

  const [isMaximized, setIsMaximized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState<ResuMood>('idle')
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  // Floating Resu proactive teaser pill
  const [showTeaser, setShowTeaser] = useState(false)
  const [teaserIndex, setTeaserIndex] = useState(0)

  const teaserPrompts = [
    '👋 Need help boosting your resume?',
    '✨ Tap me! I am your AI career copilot',
    currentAnalysis && currentAnalysis.missingKeywords.length > 0
      ? `⚡ You have ${currentAnalysis.missingKeywords.length} missing keywords! Let's fix them.`
      : '🎯 Want to test your interview answers?',
    '💡 Ask me to review your ATS score!',
  ]

  useEffect(() => {
    if (isChatOpen) {
      setShowTeaser(false)
      return
    }

    // First teaser pops up after 2.8 seconds
    const initialTimer = setTimeout(() => {
      setShowTeaser(true)
      const hideTimer = setTimeout(() => setShowTeaser(false), 5200)
      return () => clearTimeout(hideTimer)
    }, 2800)

    // Recurring teaser every 18 seconds
    const interval = setInterval(() => {
      setTeaserIndex((prev) => (prev + 1) % teaserPrompts.length)
      setShowTeaser(true)
      setTimeout(() => setShowTeaser(false), 5200)
    }, 18000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [isChatOpen, teaserPrompts.length])

  // React when user types
  useEffect(() => {
    if (loading) return
    if (inputMessage.trim().length > 0) {
      setMood('listening')
    } else {
      setMood('idle')
    }
  }, [inputMessage, loading])

  // Helper to construct dynamic greeting message
  const getWelcomeContent = (name: string) =>
    `### 👋 Hi ${name}! I'm Resu ✨\n\nI'm your **personal AI career companion and resume advisor** for ResumeIQ! I have real-time visibility into your active document, ATS scorecard, and missing keywords.\n\nAsk me anything about:\n• **ATS Score Optimization & Layout Fixes**\n• **STAR & Google X-Y-Z Bullet Point Rewriting**\n• **Behavioral & Technical Interview Preparation**\n• **Salary & Compensation Negotiation Tactics**\n\nPick a quick prompt below or ask me any question to get started!`

  const initialGreetingName = user?.username?.trim() || user?.name?.trim() || 'there'

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: getWelcomeContent(initialGreetingName),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'Resu, how do I boost my ATS score right now?',
        'Rewrite my experience bullets with the STAR formula',
        'What will recruiters ask in my first interview screen?',
      ],
    },
  ])

  // Dynamically refresh welcome message if user profile / username loads or updates
  useEffect(() => {
    const currentGreetingName = user?.username?.trim() || user?.name?.trim() || 'there'
    setMessages((prev) => {
      if (prev.length > 0 && prev[0].id === 'welcome-1') {
        const updatedWelcome: ChatMessage = {
          ...prev[0],
          content: getWelcomeContent(currentGreetingName),
        }
        return [updatedWelcome, ...prev.slice(1)]
      }
      return prev
    })
  }, [user?.username, user?.name])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isChatOpen, loading])

  // Focus textarea when opened
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => textareaRef.current?.focus(), 250)
    }
  }, [isChatOpen])

  // Handle Send
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || loading) return

    const userMsgId = `user-${Date.now()}`
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])
    setInputMessage('')
    setLoading(true)
    setMood('thinking')

    try {
      // Prepare conversation history (last 6 messages)
      const history: CareerCopilotChatMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await api.sendCareerCopilotMessage({
        message: text,
        resumeId: currentResume?.id,
        conversationHistory: history,
        context: {
          jobDescription: jobDescription || '',
          jobTitle: currentResume?.displayName?.replace(/\.[^/.]+$/, '') || 'Software Engineer',
          atsScore: currentAnalysis?.atsCompatibilityScore ?? null,
          missingKeywords: currentAnalysis?.missingKeywords || [],
          username: user?.username?.trim() || '',
          name: user?.name?.trim() || '',
        },
      })

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: res.suggestedFollowUps,
        contextApplied: res.contextApplied,
      }

      setMessages((prev) => [...prev, botMsg])
      setMood('happy')
      setTimeout(() => {
        setMood('idle')
      }, 3500)
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to connect to AI Advisor:** ${err?.message || 'Please verify your network connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
      setMood('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history with AI Copilot?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Conversation cleared. I am ready to advise you on **${currentResume?.displayName || 'your resume'}**. What would you like to work on?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedFollowUps: [
            'Boost my ATS score',
            'Rewrite my bullets with STAR',
            'Expected interview questions',
          ],
        },
      ])
    }
  }

  // Lightweight Markdown Renderer with code blocks and copy buttons
  const renderFormattedContent = (content: string, msgId: string) => {
    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let inCodeBlock = false
    let codeBuffer: string[] = []
    let codeBlockIndex = 0

    lines.forEach((line, index) => {
      // Check code block markers
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // Closing code block
          const fullCode = codeBuffer.join('\n')
          const codeId = `${msgId}-code-${codeBlockIndex++}`
          elements.push(
            <div
              key={codeId}
              className="my-3 rounded-2xl bg-canvas-deep/80 dark:bg-night-panel/90 border border-line dark:border-night-line overflow-hidden text-xs"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-black/5 dark:bg-white/5 border-b border-line/60 dark:border-night-line/60">
                <span className="font-mono text-[10px] text-ink-faint dark:text-moon-soft">
                  ATS Bullet / Snippet
                </span>
                <button
                  onClick={() => copyToClipboard(fullCode, codeId)}
                  className="flex items-center gap-1 text-[10px] font-medium text-g-blue hover:underline"
                >
                  {copiedCodeId === codeId ? (
                    <>
                      <Check size={11} className="text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed text-ink dark:text-moon whitespace-pre-wrap">
                {fullCode}
              </pre>
            </div>
          )
          codeBuffer = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBuffer.push(line)
        return
      }

      // Headers (### or ##)
      if (line.startsWith('### ')) {
        elements.push(
          <h4
            key={index}
            className="font-display font-semibold text-sm text-ink dark:text-moon mt-3 mb-1.5 flex items-center gap-1.5"
          >
            {line.replace('### ', '')}
          </h4>
        )
        return
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h5
            key={index}
            className="font-display font-medium text-xs text-g-blue uppercase tracking-wider mt-2.5 mb-1"
          >
            {line.replace('#### ', '')}
          </h5>
        )
        return
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <div
            key={index}
            className="p-3 my-2 rounded-xl bg-g-blue/5 border-l-2 border-g-blue text-xs italic text-ink-soft dark:text-moon-soft leading-relaxed"
          >
            {line.replace('> ', '')}
          </div>
        )
        return
      }

      // Bullet points (• or - )
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().replace(/^[•-]\s*/, '')
        elements.push(
          <div
            key={index}
            className="flex items-start gap-2 my-1 text-xs text-ink-soft dark:text-moon-soft leading-relaxed pl-1"
          >
            <span className="text-g-blue shrink-0 mt-0.5">•</span>
            <span>{parseInlineFormatting(bulletText)}</span>
          </div>
        )
        return
      }

      // Empty lines
      if (!line.trim()) {
        elements.push(<div key={index} className="h-1.5" />)
        return
      }

      // Regular paragraph
      elements.push(
        <p key={index} className="text-xs text-ink-soft dark:text-moon-soft leading-relaxed my-0.5">
          {parseInlineFormatting(line)}
        </p>
      )
    })

    return elements
  }

  // Parse bold and inline code: **bold** and `code`
  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-ink dark:text-moon">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-canvas-deep/80 dark:bg-night-panel border border-line/60 dark:border-night-line text-[11px] font-mono text-g-blue"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  return (
    <>
      {/* Dynamic Proactive Speech Teaser Bubble */}
      <AnimatePresence>
        {!isChatOpen && showTeaser && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={toggleChatOpen}
            className="fixed bottom-[78px] sm:bottom-[86px] right-5 sm:right-6 z-[90] max-w-[270px] sm:max-w-[290px] p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-ink dark:text-moon shadow-[0_12px_36px_rgba(34,211,238,0.25),0_0_0_1px_rgba(56,189,248,0.4)] backdrop-blur-2xl cursor-pointer group flex items-start gap-2.5 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="text-base shrink-0 mt-0.5 animate-bounce">💬</span>
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-[11px] font-bold text-g-blue dark:text-cyan-400 flex items-center gap-1.5">
                <span>Resu AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34D399]" />
              </div>
              <p className="text-xs text-ink dark:text-moon font-medium leading-snug mt-0.5">
                {teaserPrompts[teaserIndex]}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTeaser(false)
              }}
              className="text-ink-faint hover:text-ink dark:hover:text-moon p-0.5 rounded-md -mr-1 -mt-1 transition-colors"
              title="Dismiss teaser"
            >
              <X size={13} />
            </button>

            {/* Speech Bubble Arrow Tail */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-r border-b border-cyan-400/40 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button (Bottom-Right) */}
      {!isChatOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[90] flex items-center">
          {/* Ambient Pulsing Halo Ring Behind Resu */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/25 blur-md animate-ping pointer-events-none scale-125" />

          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={toggleChatOpen}
            className="relative flex items-center gap-3 p-1.5 sm:py-2 sm:px-4 rounded-full bg-gradient-to-r from-slate-950/95 via-indigo-950/90 to-slate-950/95 text-white shadow-[0_8px_32px_rgba(34,211,238,0.35),0_0_0_1px_rgba(56,189,248,0.4)] backdrop-blur-2xl group cursor-pointer transition-all hover:shadow-[0_12px_40px_rgba(34,211,238,0.5),0_0_0_1px_rgba(56,189,248,0.7)]"
            title="Chat with Resu — Your AI Career Companion"
          >
            <div className="relative shrink-0">
              <ResuAvatar mood={mood} size="sm" interactive />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-[0_0_8px_#34D399] animate-pulse" />
            </div>

            <div className="text-left hidden sm:block pr-1.5">
              <div className="font-display font-bold text-xs leading-none flex items-center gap-1.5 text-white">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-sky-300 bg-clip-text text-transparent">Ask Resu</span>
                <Sparkles size={12} className="text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div className="text-[10px] text-cyan-200/80 font-mono mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{currentAnalysis ? `${currentAnalysis.atsCompatibilityScore}% ATS Context` : 'AI Career Companion'}</span>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Main Chatbot Floating Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`fixed z-[100] transition-all duration-300 flex flex-col glass-strong border border-line dark:border-night-line bg-canvas dark:bg-night shadow-2xl overflow-hidden ${
              isMaximized
                ? 'inset-3 sm:inset-6 rounded-3xl'
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[600px] max-h-[88vh] rounded-3xl'
            }`}
          >
            {/* Window Header */}
            <div className="p-4 sm:p-5 border-b border-line dark:border-night-line bg-canvas-deep/50 dark:bg-night-panel/60 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <ResuAvatar mood={mood} size="md" interactive />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-sm text-ink dark:text-moon truncate flex items-center gap-1">
                      <span>Resu</span>
                      <span className="text-xs">✨</span>
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {mood === 'thinking' ? 'Thinking...' : mood === 'happy' ? 'Happy!' : mood === 'listening' ? 'Listening...' : 'Online'}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-soft dark:text-moon-soft truncate flex items-center gap-1.5">
                    {currentResume ? (
                      <span>
                        Context: <span className="font-medium text-ink dark:text-moon">{currentResume.displayName || currentResume.fileName}</span>
                        {currentAnalysis && ` • ${currentAnalysis.atsCompatibilityScore}% ATS`}
                      </span>
                    ) : (
                      <span>Your ResumeIQ Career &amp; Interview Companion</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink dark:hover:text-moon transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink dark:hover:text-moon transition-colors hidden sm:block"
                  title={isMaximized ? 'Restore size' : 'Maximize window'}
                >
                  {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={toggleChatOpen}
                  className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft hover:text-ink dark:hover:text-moon transition-colors"
                  title="Minimize Copilot"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Quick Context Pill Banner */}
            {currentResume && currentAnalysis && (
              <div className="px-4 py-2.5 bg-g-blue/10 dark:bg-g-blue/15 border-b border-g-blue/20 flex items-center justify-between text-[11px] text-ink dark:text-moon shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-g-blue shrink-0 animate-pulse" />
                  <span className="truncate">
                    Attached: <strong>v{currentResume.versionNumber}.0</strong> ({currentAnalysis.missingKeywords.length} missing keywords)
                  </span>
                </div>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMaximized(false)
                      onNavigateToTab('builder')
                    }}
                    className="text-[10px] font-semibold text-white bg-g-blue hover:bg-g-blue-dim px-2.5 py-1 rounded-lg transition-all shadow-sm hover:shadow-glow-blue shrink-0 ml-2 inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Switch directly to Resume Studio to live-edit & inject missing keywords"
                  >
                    <span>Open Studio</span>
                    <span>&rarr;</span>
                  </button>
                )}
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[92%] sm:max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 mt-1">
                        <ResuAvatar mood="idle" size="xs" />
                      </div>
                    )}
                    <div
                      className={`rounded-3xl p-4 sm:p-4.5 ${
                        msg.role === 'user'
                          ? 'bg-g-blue text-white rounded-br-sm shadow-md'
                          : 'glass border border-line dark:border-night-line bg-white/95 dark:bg-night-surface/95 text-ink dark:text-moon rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-xs font-normal leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div>
                          {renderFormattedContent(msg.content, msg.id)}

                          {/* Suggested Follow-Ups */}
                          {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-line/60 dark:border-night-line/60">
                              <div className="text-[10px] font-semibold text-ink-faint dark:text-moon-soft mb-2 flex items-center gap-1">
                                <Sparkles size={11} className="text-g-blue" /> Suggested Next Questions:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.suggestedFollowUps.map((q, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(q)}
                                    disabled={loading}
                                    className="text-[11px] text-left px-2.5 py-1 rounded-xl bg-canvas-deep/70 dark:bg-night-panel/80 hover:bg-g-blue/10 hover:border-g-blue/30 text-ink-soft dark:text-moon hover:text-g-blue border border-line/80 dark:border-night-line transition-all flex items-center gap-1 group"
                                  >
                                    <span>{q}</span>
                                    <ChevronRight size={10} className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] text-ink-faint dark:text-moon-soft/60 px-2 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left pl-8'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl glass max-w-[280px] text-xs text-ink-soft dark:text-moon-soft border border-line dark:border-night-line shadow-sm">
                  <ResuAvatar mood="thinking" size="xs" />
                  <span className="font-medium animate-pulse">Resu is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starter Chips (when conversation is short) */}
            {messages.length <= 2 && !loading && (
              <div className="px-4 py-2 border-t border-line/50 dark:border-night-line/50 bg-canvas-deep/30 dark:bg-night-panel/30 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {DEFAULT_STARTER_PROMPTS.map((starter, i) => {
                    const Icon = starter.icon
                    return (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(starter.prompt)}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-night-surface hover:bg-g-blue/10 hover:border-g-blue/30 text-ink-soft dark:text-moon-soft hover:text-g-blue border border-line dark:border-night-line transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <Icon size={12} className="text-g-blue" />
                        <span>{starter.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 border-t border-line dark:border-night-line bg-canvas-deep/40 dark:bg-night-panel/50 shrink-0">
              <div className="relative flex items-end gap-2 bg-white dark:bg-night-surface rounded-2xl border border-line dark:border-night-line p-2 shadow-sm focus-within:border-g-blue focus-within:ring-1 focus-within:ring-g-blue/30 transition-all">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Resu anything (ATS fixes, STAR bullets, interview coaching)..."
                  className="w-full bg-transparent resize-none text-xs text-ink dark:text-moon placeholder:text-ink-faint dark:placeholder:text-moon-soft/50 focus:outline-none p-1 max-h-28"
                  disabled={loading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  className="p-2 rounded-xl bg-g-blue text-white disabled:opacity-40 hover:bg-g-blue/90 transition-colors shrink-0 shadow-sm"
                  title="Send message to Resu (Enter)"
                >
                  <Send size={15} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-faint dark:text-moon-soft/60 px-1 mt-1.5">
                <span>Press Enter to send &bull; Shift+Enter for new line</span>
                <span className="flex items-center gap-1">
                  <Sparkles size={10} className="text-g-blue" /> Resu AI &bull; Gemini 2.0 + Expert Engine
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
