import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: extract the outermost JSON object or array
    const firstCurly = cleaned.indexOf('{');
    const lastCurly = cleaned.lastIndexOf('}');
    const firstSquare = cleaned.indexOf('[');
    const lastSquare = cleaned.lastIndexOf(']');

    if (firstCurly !== -1 && lastCurly > firstCurly && (firstSquare === -1 || firstCurly < firstSquare)) {
      const candidate = cleaned.slice(firstCurly, lastCurly + 1);
      try {
        return JSON.parse(candidate);
      } catch (e1) {
        try {
          const sanitized = candidate.replace(/[\x00-\x1F\x7F-\x9F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
          return JSON.parse(sanitized);
        } catch (e2) {
          logger.debug('JSON object extraction failed', { error: e2.message, snippet: candidate.slice(0, 200) });
        }
      }
    } else if (firstSquare !== -1 && lastSquare > firstSquare) {
      const candidate = cleaned.slice(firstSquare, lastSquare + 1);
      try {
        return JSON.parse(candidate);
      } catch (e) {
        logger.debug('JSON array extraction failed', { error: e.message });
      }
    }
    return null;
  }
}

/**
 * Thin wrapper around the Gemini REST API. Called directly via fetch rather
 * than an SDK so the request/response shape stays fully transparent.
 *
 * Every method degrades gracefully (returns null) if GEMINI_API_KEY is not
 * configured, or if the API call fails — callers fall back to rule-based
 * logic rather than hard-failing the whole analysis pipeline.
 */
export const geminiClient = {
  isConfigured() {
    return Boolean(env.GEMINI_API_KEY);
  },

  /**
   * Sends a single prompt and asks Gemini to return strict JSON matching the
   * caller's expected shape. Returns the parsed object, or null on any
   * failure (missing key, network error, malformed response).
   * @param {string} prompt
   * @param {{ temperature?: number, maxOutputTokens?: number }} [options]
   */
  async generateJson(prompt, options = {}) {
    if (!this.isConfigured()) {
      logger.debug('Gemini API key not configured; skipping call and using fallback logic.');
      return null;
    }

    const url = `${BASE_URL}/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        responseMimeType: 'application/json',
      },
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        logger.warn('Gemini API request failed', { status: res.status, body: errBody.slice(0, 500) });
        return null;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        logger.warn('Gemini API returned no usable text', { data });
        return null;
      }

      const parsed = cleanAndParseJson(text);
      if (!parsed) {
        logger.warn('Failed to parse JSON response from Gemini', { textSnippet: text.slice(0, 300) });
      }
      return parsed;
    } catch (err) {
      logger.warn('Gemini API call errored; falling back to rule-based logic', { error: err.message });
      return null;
    }
  },

  /**
   * Generates free-form conversational text from Gemini.
   * @param {string} prompt
   * @param {{ temperature?: number, maxOutputTokens?: number }} [options]
   */
  async generateText(prompt, options = {}) {
    if (!this.isConfigured()) {
      logger.debug('Gemini API key not configured; skipping call and using fallback logic.');
      return null;
    }

    const url = `${BASE_URL}/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
      },
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        logger.warn('Gemini API text request failed', { status: res.status, body: errBody.slice(0, 500) });
        return null;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (err) {
      logger.warn('Gemini API call errored; falling back to rule-based logic', { error: err.message });
      return null;
    }
  },
};
