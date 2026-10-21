/**
 * ResumeIQ Frontend API Service Client
 * Handles communication with the Express API (http://localhost:3000 or production URL)
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:3000'
    : '');

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('resumeiq_token');
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred.';
    try {
      const errorData = await res.json();
      errorMsg = errorData?.error?.message || errorData?.message || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export interface User {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string | null;
  email: string;
  role: string;
  hasGoogleLinked?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface ResumeItem {
  id: string;
  parentResumeId: string | null;
  rootResumeId: string | null;
  versionNumber: number;
  displayName: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  status: 'pending' | 'parsed' | 'failed';
  parseError: string | null;
  sections?: Record<string, any>;
  formattingFlags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisIssue {
  code: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  id: string;
  resumeId: string;
  jobDescriptionId: string | null;
  keywordMatchScore: number;
  atsCompatibilityScore: number;
  missingKeywords: string[];
  matchedKeywords: string[];
  issues: AnalysisIssue[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage: string | null;
  analyzedAt: string;
  createdAt: string;
}

export interface ReportRecommendation {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AuditReport {
  summary: string;
  recommendations: ReportRecommendation[];
}

export interface OptimizedBulletVariant {
  type: 'metric' | 'technical' | 'leadership';
  label: string;
  bullet: string;
  actionVerb: string;
  highlightedKeywords: string[];
  improvementTip: string;
}

export interface BulletOptimizationResult {
  originalBullet: string;
  variants: OptimizedBulletVariant[];
  atsScoreBoostEstimate: string;
  generatedBy?: string;
}

export interface InjectedBulletItem {
  category: string;
  bullet: string;
  actionVerb: string;
  embeddedKeywords: string[];
  impactMetric: string;
  whyItWorks: string;
}

export interface InjectedKeywordsResult {
  keywords: string[];
  jobTitle: string;
  injectedBullets: InjectedBulletItem[];
  atsScoreBoostEstimate: string;
  generatedBy?: string;
}

export interface VersionTimelineEntry {
  resumeId: string;
  versionNumber: number;
  displayName: string;
  keywordMatchScore: number | null;
  atsCompatibilityScore: number | null;
  missingKeywords: string[];
  matchedKeywords: string[];
  issues: AnalysisIssue[];
  analyzedAt: string;
}

export interface VersionDelta {
  fromVersion: number;
  toVersion: number;
  keywordMatchDelta: number;
  atsCompatibilityDelta: number;
  newlyMatchedKeywords: string[];
  resolvedKeywords: string[];
  newMissingKeywords: string[];
  issueCountDelta: number;
}

export interface VersionCompareResponse {
  timeline: VersionTimelineEntry[];
  deltas: VersionDelta[];
}

export interface ApplicationKitResult {
  companyName: string;
  jobTitle: string;
  tone: 'confident' | 'professional' | 'executive';
  coverLetter: string;
  recruiterInMail: string;
  hiringManagerPitch?: string;
  alumniReferralNote?: string;
  followUpNote?: string;
  linkedInConnectionNote?: string;
  linkedInHeadlines?: string[];
  linkedInAbout?: string;
  linkedInSkills?: string[];
  subjectLines: string[];
  keyHighlightPoints: string[];
  generatedBy?: string;
}

export interface PersonaCriterion {
  label: string;
  score: number;
}

export interface PersonaDetail {
  id: 'faang' | 'startup' | 'enterprise';
  title: string;
  subtitle: string;
  score: number;
  badge: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'red';
  criteria: PersonaCriterion[];
  verdict: string;
  strengths: string[];
  redFlags: string[];
  tacticalRecommendations: string[];
}

export interface PersonaSimulationsResponse {
  analysisId: string;
  personas: {
    faang: PersonaDetail;
    startup: PersonaDetail;
    enterprise: PersonaDetail;
  };
}

export interface KnockoutRadarItem {
  id: string;
  category: 'experience' | 'education' | 'skill' | 'authorization' | 'location' | 'formatting';
  title: string;
  requirement: string;
  candidateStatus: string;
  status: 'PASSED' | 'FRICTION' | 'DISQUALIFIER';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface SimulatedAtsQuestion {
  question: string;
  applicantAnswer: string;
  riskLevel: 'high' | 'medium' | 'low';
  guidance: string;
}

export interface KnockoutRadarResponse {
  analysisId: string;
  overallStatus: 'CLEARED' | 'CAUTION' | 'HIGH_RISK';
  riskScore: number;
  summary: string;
  totalChecked: number;
  clearedCount: number;
  warningCount: number;
  knockoutCount: number;
  items: KnockoutRadarItem[];
  simulatedAtsQuestions: SimulatedAtsQuestion[];
  expertTake: string;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string, username?: string): Promise<AuthResponse> {
    const payload: Record<string, string> = { name, email, password };
    if (username && username.trim()) {
      payload.username = username.trim().toLowerCase();
    }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthResponse>(res);
  },

  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return handleResponse<AuthResponse>(res);
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateProfile(data: { name?: string; username?: string; avatarUrl?: string | null }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ user: User }>(res);
  },

  async uploadAvatar(file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<{ user: User }>(res);
  },

  async deleteAvatar(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  async checkUsername(username: string): Promise<{ available: boolean; reason?: string }> {
    const res = await fetch(`${API_BASE}/auth/check-username?username=${encodeURIComponent(username)}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ available: boolean; reason?: string }>(res);
  },

  // Resumes
  async uploadResume(file: File, parentResumeId?: string): Promise<{ resume: ResumeItem }> {
    const formData = new FormData();
    formData.append('resume', file);
    if (parentResumeId) {
      formData.append('parentResumeId', parentResumeId);
    }

    const res = await fetch(`${API_BASE}/api/v1/resumes`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse<{ resume: ResumeItem }>(res);
  },

  async listResumes(): Promise<{ resumes: ResumeItem[] }> {
    const res = await fetch(`${API_BASE}/api/v1/resumes`, {
      headers: getHeaders(),
    });
    return handleResponse<{ resumes: ResumeItem[] }>(res);
  },

  async getResume(id: string): Promise<{ resume: ResumeItem }> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ resume: ResumeItem }>(res);
  },

  async attachJobDescription(resumeId: string, text: string): Promise<{ jobDescription: { id: string; text: string } }> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}/job-description`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return handleResponse<{ jobDescription: { id: string; text: string } }>(res);
  },

  async runAnalysis(resumeId: string): Promise<{ analysis: AnalysisResult }> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return handleResponse<{ analysis: AnalysisResult }>(res);
  },

  async getAnalysis(id: string): Promise<{ analysis: AnalysisResult }> {
    const res = await fetch(`${API_BASE}/api/v1/analyses/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ analysis: AnalysisResult }>(res);
  },

  async getLatestAnalysis(resumeId: string): Promise<{ analysis: AnalysisResult | null; report: AuditReport | null }> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}/latest-analysis`, {
      headers: getHeaders(),
    });
    return handleResponse<{ analysis: AnalysisResult | null; report: AuditReport | null }>(res);
  },

  async getReport(analysisId: string): Promise<{ report: AuditReport }> {
    const res = await fetch(`${API_BASE}/api/v1/analyses/${analysisId}/report`, {
      headers: getHeaders(),
    });
    return handleResponse<{ report: AuditReport }>(res);
  },

  getReportPdfUrl(analysisId: string): string {
    const token = localStorage.getItem('resumeiq_token');
    return `${API_BASE}/api/v1/analyses/${analysisId}/report.pdf?token=${token || ''}`;
  },

  async downloadReportPdf(analysisId: string, filename = 'ResumeIQ-Audit-Report.pdf'): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/analyses/${analysisId}/report.pdf`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to download PDF report.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async optimizeBullet(
    bullet: string,
    targetKeywords: string[] = [],
    jobTitle = 'Software Engineer',
    tone = 'impactful'
  ): Promise<BulletOptimizationResult> {
    const res = await fetch(`${API_BASE}/api/v1/optimizer/bullet`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bullet, targetKeywords, jobTitle, tone }),
    });
    return handleResponse<BulletOptimizationResult>(res);
  },

  async injectKeywords(
    keywords: string[],
    jobTitle = 'Software Engineer',
    context = ''
  ): Promise<InjectedKeywordsResult> {
    const res = await fetch(`${API_BASE}/api/v1/optimizer/inject-keywords`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ keywords, jobTitle, context }),
    });
    return handleResponse<InjectedKeywordsResult>(res);
  },

  async compareVersions(resumeId: string): Promise<VersionCompareResponse> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}/versions/compare`, {
      headers: getHeaders(),
    });
    return handleResponse<VersionCompareResponse>(res);
  },

  async generateApplicationKit(data: {
    resumeId: string;
    jobDescriptionText?: string;
    companyName?: string;
    jobTitle?: string;
    tone?: 'confident' | 'professional' | 'executive';
  }): Promise<ApplicationKitResult> {
    const res = await fetch(`${API_BASE}/api/v1/application-kit/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApplicationKitResult>(res);
  },

  async getPersonaSimulations(analysisId: string): Promise<PersonaSimulationsResponse> {
    const res = await fetch(`${API_BASE}/api/v1/analyses/${analysisId}/persona-simulations`, {
      headers: getHeaders(),
    });
    return handleResponse<PersonaSimulationsResponse>(res);
  },

  async getKnockoutRadar(analysisId: string): Promise<KnockoutRadarResponse> {
    const res = await fetch(`${API_BASE}/api/v1/analyses/${analysisId}/knockout-radar`, {
      headers: getHeaders(),
    });
    return handleResponse<KnockoutRadarResponse>(res);
  },

  async downloadCleanResumePdf(
    resumeId: string,
    resumeData?: ResumeBuilderData,
    filename = 'ATS_Optimized_Resume.pdf'
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}/export-clean-pdf`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ resumeData }),
    });
    if (!res.ok) throw new Error('Failed to generate ATS-perfect resume PDF.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async saveResumeBuilderVersion(
    resumeId: string,
    payload: {
      displayName?: string;
      resumeData: ResumeBuilderData;
      reAnalyze?: boolean;
    }
  ): Promise<{ resume: ResumeItem; analysis?: AnalysisResult; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/resumes/${resumeId}/builder-save-version`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ resume: ResumeItem; analysis?: AnalysisResult; message: string }>(res);
  },

  async getMockInterviewQuestions(payload: {
    resumeId?: string;
    interviewType?: 'behavioral' | 'technical' | 'system_design';
    difficulty?: 'entry' | 'mid' | 'senior' | 'lead';
    jobTitle?: string;
    jobDescriptionText?: string;
  }): Promise<MockInterviewQuestionsResponse> {
    const res = await fetch(`${API_BASE}/api/v1/mock-interview/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<MockInterviewQuestionsResponse>(res);
  },

  async evaluateMockInterviewAnswer(payload: {
    question: string;
    category?: string;
    userAnswer: string;
    interviewType?: 'behavioral' | 'technical' | 'system_design';
    difficulty?: 'entry' | 'mid' | 'senior' | 'lead';
  }): Promise<MockInterviewEvaluationResult> {
    const res = await fetch(`${API_BASE}/api/v1/mock-interview/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<MockInterviewEvaluationResult>(res);
  },

  async sendCareerCopilotMessage(payload: {
    message: string;
    resumeId?: string;
    conversationHistory?: CareerCopilotChatMessage[];
    context?: Record<string, any>;
  }): Promise<CareerCopilotResponse> {
    const res = await fetch(`${API_BASE}/api/v1/career-copilot/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CareerCopilotResponse>(res);
  },
};

export interface ResumeBuilderPersonalInfo {
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ResumeBuilderExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface ResumeBuilderProjectItem {
  id: string;
  title: string;
  techStack?: string;
  link?: string;
  bullets: string[];
}

export interface ResumeBuilderEducationItem {
  id: string;
  school: string;
  degree?: string;
  field?: string;
  graduationDate?: string;
  gpa?: string;
  highlights?: string;
}

export interface ResumeBuilderData {
  personalInfo: ResumeBuilderPersonalInfo;
  summary: string;
  skills: Array<string | { category: string; items: string[] }>;
  experience: ResumeBuilderExperienceItem[];
  projects: ResumeBuilderProjectItem[];
  education: ResumeBuilderEducationItem[];
  certifications?: Array<string | { name: string; issuer?: string; year?: string }>;
}

export interface MockInterviewQuestion {
  id: string;
  category: string;
  question: string;
  contextWhyAsked: string;
  keyEvaluationCriteria: string[];
  suggestedTimeLimitSeconds: number;
}

export interface MockInterviewQuestionsResponse {
  interviewType: 'behavioral' | 'technical' | 'system_design';
  difficulty: 'entry' | 'mid' | 'senior' | 'lead';
  jobTitle: string;
  questions: MockInterviewQuestion[];
  generatedBy?: string;
}

export interface StarBreakdown {
  situationScore: number;
  actionScore: number;
  resultScore: number;
  deliveryScore: number;
}

export interface MockInterviewEvaluationResult {
  overallScore: number;
  starBreakdown: StarBreakdown;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  detectedPillars?: {
    hasContext: boolean;
    hasClearAction: boolean;
    hasMetrics: boolean;
  };
  wordCount: number;
  fillerCount: number;
  detectedFillerWords?: string[];
  detectedActionVerbs?: string[];
  metricMatches?: string[];
  generatedBy?: string;
}

export interface CareerCopilotChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CareerCopilotResponse {
  reply: string;
  suggestedFollowUps: string[];
  contextApplied?: {
    resumeName?: string;
    version?: number;
    atsScore?: number | string | null;
    missingKeywordsCount?: number;
  } | null;
  generatedBy?: string;
}



