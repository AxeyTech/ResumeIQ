import PDFDocument from 'pdfkit';
import { geminiClient } from './geminiClient.service.js';
import { logger } from '../config/logger.js';

const RECOMMENDATION_PROMPT = (ctx) => `
You are a career coach helping a job applicant improve their resume so it performs better
against Applicant Tracking Systems and human recruiters.

Given the analysis findings below, write:
1. A short 2-3 sentence plain-English summary of how this resume is doing overall.
2. A ranked list of specific, actionable recommendations (most impactful first). Each
   recommendation must name the concrete change to make — never generic advice like
   "improve your skills section". Reference specific missing keywords or issues where relevant.

Respond with ONLY a JSON object of this exact shape, no prose:
{
  "summary": "<string>",
  "recommendations": [
    { "title": "<short imperative title>", "detail": "<1-2 sentence specific instruction>", "priority": "high"|"medium"|"low" }
  ]
}

KEYWORD MATCH SCORE: ${ctx.keywordMatchScore}/100
ATS COMPATIBILITY SCORE: ${ctx.atsCompatibilityScore}/100
MISSING KEYWORDS: ${ctx.missingKeywords.slice(0, 15).join(', ') || 'none'}
FORMATTING ISSUES:
${ctx.issues.map((i) => `- [${i.severity}] ${i.title}: ${i.message}`).join('\n') || 'none'}
`;

function ruleBasedRecommendations(ctx) {
  const recs = [];

  for (const issue of ctx.issues) {
    recs.push({
      title: issue.title,
      detail: issue.message,
      priority: issue.severity,
    });
  }

  if (ctx.missingKeywords.length > 0) {
    recs.push({
      title: 'Add missing keywords where genuinely applicable',
      detail: `Consider incorporating: ${ctx.missingKeywords.slice(0, 8).join(', ')} — but only where they truthfully reflect your experience.`,
      priority: 'high',
    });
  }

  const summary =
    ctx.keywordMatchScore >= 80 && ctx.atsCompatibilityScore >= 80
      ? 'This resume is in strong shape — keyword coverage and ATS formatting are both solid.'
      : ctx.keywordMatchScore < 50 || ctx.atsCompatibilityScore < 50
        ? 'This resume needs meaningful work in either keyword alignment or ATS-friendly formatting before it is likely to perform well.'
        : 'This resume is a reasonable starting point, with a handful of specific gaps worth closing.';

  return { summary, recommendations: recs };
}

export const reportGeneratorService = {
  /** FR-4.1/4.2/4.3: combine scores + issues into a structured, actionable report. */
  async generate({ keywordMatchScore, atsCompatibilityScore, missingKeywords, issues }) {
    const ctx = { keywordMatchScore, atsCompatibilityScore, missingKeywords, issues };

    const gemini = await geminiClient.generateJson(RECOMMENDATION_PROMPT(ctx));
    if (gemini?.summary && Array.isArray(gemini.recommendations)) {
      return { summary: gemini.summary, recommendations: gemini.recommendations, generatedBy: 'gemini' };
    }

    logger.debug('Falling back to rule-based report recommendations.');
    const fallback = ruleBasedRecommendations(ctx);
    return { ...fallback, generatedBy: 'rule_based' };
  },

  /**
   * FR-4.4: renders a report to a downloadable PDF buffer.
   * @param {{ resumeName: string, keywordMatchScore: number, atsCompatibilityScore: number, summary: string, recommendations: any[], missingKeywords: string[] }} data
   * @returns {Promise<Buffer>}
   */
  async exportPdf(data) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 56, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const ink = '#15130E';
      const soft = '#4A453C';
      const gold = '#8B7B4E';

      doc.fillColor(ink).fontSize(22).text('ResumeIQ — Improvement Report', { align: 'left' });
      doc.moveDown(0.3);
      doc.fillColor(soft).fontSize(11).text(`Resume: ${data.resumeName}`);
      doc.moveDown(1);

      doc.fillColor(gold).fontSize(13).text('Scores');
      doc.fillColor(ink).fontSize(11);
      doc.text(`Keyword Match Score:      ${data.keywordMatchScore} / 100`);
      doc.text(`ATS Compatibility Score:   ${data.atsCompatibilityScore} / 100`);
      doc.moveDown(1);

      doc.fillColor(gold).fontSize(13).text('Summary');
      doc.fillColor(ink).fontSize(11).text(data.summary || '(no summary available)', { align: 'justify' });
      doc.moveDown(1);

      if (data.missingKeywords?.length) {
        doc.fillColor(gold).fontSize(13).text('Missing Keywords');
        doc.fillColor(ink).fontSize(11).text(data.missingKeywords.join(', '), { align: 'justify' });
        doc.moveDown(1);
      }

      doc.fillColor(gold).fontSize(13).text('Recommendations');
      doc.moveDown(0.3);
      (data.recommendations || []).forEach((rec, i) => {
        doc.fillColor(ink).fontSize(11.5).text(`${i + 1}. ${rec.title}`, { continued: false });
        doc.fillColor(soft).fontSize(10).text(rec.detail || '', { indent: 14, align: 'justify' });
        doc.moveDown(0.5);
      });

      doc.moveDown(1);
      doc
        .fillColor(soft)
        .fontSize(8)
        .text('Generated by ResumeIQ — this report is a guide, not a guarantee of interview outcomes.', {
          align: 'center',
        });

      doc.end();
    });
  },
};
