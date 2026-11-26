import type { ExecutiveSummaryPayload } from '../billing/types';
import { formatMoney } from '../format';
import type { CostInsight } from '../insights';

export interface ExecutiveSummaryInput {
  title: string;
  projectId: string;
  currency: string;
  listPrice: number;
  cudCredits: number;
  totalSavings: number;
  finalPrice: number;
  percentChange: number | null;
  insights: CostInsight[];
}

export interface AiConfig {
  enabled: boolean;
  apiKey: string;
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Generates a deterministic, zero-network executive summary for SREs, FinOps, and leaders.
 */
export function buildStandardExecutiveSummary(
  input: ExecutiveSummaryInput,
): ExecutiveSummaryPayload {
  const parts: string[] = [
    `${input.title} in ${input.projectId}: final spend this month is ${formatMoney(input.finalPrice, input.currency)} (list ${formatMoney(input.listPrice, input.currency)}).`,
  ];

  const cudAbs = Math.abs(input.cudCredits);
  if (cudAbs > 0.005 || input.totalSavings > 0.005) {
    parts.push(
      `Savings total ${formatMoney(input.totalSavings, input.currency)} (including ${formatMoney(cudAbs, input.currency)} from CUDs).`,
    );
  }

  if (input.percentChange !== null && Number.isFinite(input.percentChange)) {
    const rounded = Math.round(input.percentChange);
    const dir = rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
    parts.push(`Spend is ${dir} vs. the same days last month.`);
  }

  const topAction = input.insights.find((item) => item.action)?.action;
  if (topAction) {
    parts.push(`Recommended action: ${topAction}`);
  } else {
    parts.push('No immediate cost anomalies detected.');
  }

  return {
    source: 'standard',
    text: parts.join(' '),
  };
}

/**
 * Generates an executive summary using Gemini when opted-in with an API key,
 * or falls back cleanly to the deterministic Standard Summary.
 */
export async function generateExecutiveSummary(
  input: ExecutiveSummaryInput,
  aiConfig: AiConfig,
  fetchFn: typeof fetch = fetch,
): Promise<ExecutiveSummaryPayload> {
  const standard = buildStandardExecutiveSummary(input);
  const apiKey = aiConfig.apiKey.trim();

  if (!aiConfig.enabled || !apiKey) {
    return standard;
  }

  const prompt = [
    'You are a concise FinOps & SRE advisor. Give a 2-sentence executive summary and 1 concrete action item from this visible cost summary only:',
    `Target: ${input.title} (project ${input.projectId})`,
    `Final price MTD: ${formatMoney(input.finalPrice, input.currency)}`,
    `List price MTD: ${formatMoney(input.listPrice, input.currency)}`,
    `CUD credits MTD: ${formatMoney(Math.abs(input.cudCredits), input.currency)}`,
    `Total savings MTD: ${formatMoney(input.totalSavings, input.currency)}`,
    `Insights: ${input.insights.map((i) => `${i.title}: ${i.action ?? i.detail}`).join(' | ') || 'None'}`,
  ].join('\n');

  try {
    const response = await fetchFn(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const reason =
        response.status === 400
          ? 'invalid API key'
          : response.status === 403
            ? 'API key restricted or Generative Language API disabled'
            : response.status === 429
              ? 'quota exceeded'
              : `HTTP ${response.status}`;
      return {
        ...standard,
        note: `Gemini request failed (${reason}) — showing standard summary.`,
      };
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return {
        ...standard,
        note: 'Empty Gemini response — showing standard summary.',
      };
    }

    return { source: 'gemini', text };
  } catch {
    return {
      ...standard,
      note: 'Could not reach Gemini — showing standard summary.',
    };
  }
}
