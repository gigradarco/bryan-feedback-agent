import type { AIRecommendations, EventRecord, EventReport, FeedbackSession, InsightHighlights } from "./types.js";
import { getOpenAi, openAiModel } from "./openai.js";

function gatherUserQuotes(sessions: FeedbackSession[], maxChars: number): string[] {
  const lines: string[] = [];
  let size = 0;
  for (const s of sessions) {
    for (const t of s.turns) {
      if (t.role !== "user" || !t.text.trim()) continue;
      const line = t.text.trim().slice(0, 400);
      if (size + line.length > maxChars) return lines;
      lines.push(line);
      size += line.length + 1;
    }
  }
  return lines;
}

function asStringArray(x: unknown, max = 6): string[] {
  if (!Array.isArray(x)) return [];
  return x.filter((i): i is string => typeof i === "string").map((s) => s.trim()).filter(Boolean).slice(0, max);
}

export async function generateOrganizerInsightsLLM(
  event: EventRecord,
  report: EventReport,
  sessions: FeedbackSession[],
  variant: number
): Promise<{ highlights: InsightHighlights; aiRecommendations: AIRecommendations }> {
  const client = getOpenAi();
  if (!client) throw new Error("No OpenAI client");

  const model = openAiModel();
  const quotes = gatherUserQuotes(sessions, 6000);
  const rules = report.highlights;

  const payload = {
    event: {
      name: event.name,
      venue: event.venue,
      dateLabel: event.dateLabel,
      lineup: event.lineupSummary,
    },
    stats: report.snapshot,
    themes: report.themes.map((t) => ({
      label: t.label,
      sharePercent: t.sharePercent,
      skew: t.sentimentSkew,
      examples: t.exampleParaphrases.slice(0, 2),
    })),
    operations: report.operations,
    outliers: report.outlierSummaries,
    attendee_quotes: quotes,
    refresh_variant: variant,
    rule_based_draft: rules,
  };

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: variant === 0 ? 0.35 : 0.85,
    messages: [
      {
        role: "system",
        content: [
          "You are an experienced live-music and nightlife promoter coach.",
          "Output ONLY valid JSON matching the user schema.",
          "Ground every bullet in the provided stats, themes, ops tags, outliers, and/or attendee quotes.",
          "Do not invent incidents that are unsupported; if data is thin, say so briefly inside bullets.",
          "Language: clear, actionable, no hype words.",
          `refresh_variant=${variant}: if variant>0, offer a fresh angle vs a generic repeat—different tactics, still evidence-led.`,
        ].join(" "),
      },
      {
        role: "user",
        content: `${JSON.stringify(payload)}

Return JSON exactly in this shape:
{
  "wentWell": ["2-5 short bullets"],
  "toImprove": ["2-5 short bullets"],
  "concerns": ["0-5 short bullets — real problems or risks"],
  "aiSummary": "2-3 sentences tying together priorities for the organiser",
  "aiActions": ["3-5 concrete next steps"]
}
Use wentWell / toImprove / concerns to mirror: strengths, improvable gaps, serious issues.`,
      },
    ],
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty LLM response");

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  const wentWell = asStringArray(parsed.wentWell);
  const toImprove = asStringArray(parsed.toImprove);
  const concerns = asStringArray(parsed.concerns);
  const summary = typeof parsed.aiSummary === "string" ? parsed.aiSummary.trim() : "";
  const actions = asStringArray(parsed.aiActions, 8);

  const highlights: InsightHighlights = {
    wentWell: wentWell.length ? wentWell : rules.wentWell,
    toImprove: toImprove.length ? toImprove : rules.toImprove,
    concerns: concerns.length ? concerns : rules.concerns,
  };

  const aiRecommendations: AIRecommendations = {
    summary: summary || "Prioritize the strongest theme signals below and validate with your ops leads.",
    actions: actions.length
      ? actions
      : [
          "Review attendee quotes alongside bar and door leads.",
          "Choose one theme to fix before marketing the next on-sale.",
        ],
    variant,
    source: "openai",
    refreshedAt: new Date().toISOString(),
  };

  return { highlights, aiRecommendations };
}
