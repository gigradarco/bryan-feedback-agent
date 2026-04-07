import type { AIRecommendations, EventRecord, EventReport, FeedbackSession, InsightHighlights } from "./types.js";
import { generateOrganizerInsightsLLM } from "./organizerLLM.js";
import { getOpenAi } from "./openai.js";

export function buildHeuristicRecommendations(report: EventReport, variant: number): AIRecommendations {
  const packs: { summary: string; actions: string[] }[] = [
    {
      summary:
        "Double down on social proof from what went well, then isolate one operational fix for the next show—small teams move faster with one priority.",
      actions: [
        "Turn the strongest positive quotes (anonymized) into a highlight reel for social and your press kit.",
        "If queues or bar came up, run a post-mortem with your bar lead—consider express lanes or a second service point next time.",
        "Send a 1-question pulse to full check-ins 24h after doors to widen the sample before you lock messaging for the follow-up date.",
      ],
    },
    {
      summary:
        "Protect reputation on friction themes while you test a low-cost change—attendees forgive a lot when they see you respond.",
      actions: [
        "Publish a short ‘you spoke, we heard’ note naming 1–2 concrete changes (even if they’re experiments).",
        "Brief security / door staff with target wait-time goals if entry was a theme in feedback.",
        "A/B ticket tiers next time: earlier entry or lounge add-on can absorb peak crush without raising base price.",
      ],
    },
    {
      summary:
        "Rebalance lineup and flow narrative: mixed sentiment often means expectations weren’t aligned with reality.",
      actions: [
        "Tighten set times and comms (email + signage) so openers and peaks are obvious—reduces ‘dead’ energy complaints.",
        "If sound was polarizing, book a quick listening walk with your engineer at half-capacity vs peak.",
        "Offer a loyalty perk (points / drink token) tied to feedback completion to grow structured data ahead of the next drop.",
      ],
    },
  ];

  const n = report.snapshot.responseCount;
  const pack = packs[variant % packs.length]!;
  const actions =
    n === 0
      ? ["Collect a handful of completed chats first—recommendations sharpen quickly after ~5 written responses."]
      : pack.actions;

  return {
    summary:
      n === 0
        ? "Not enough feedback text yet—run the chat flow with a few attendees, then refresh for tailored actions."
        : pack.summary,
    actions,
    variant,
    source: "heuristic",
    refreshedAt: new Date().toISOString(),
  };
}

export async function enrichOrganizerReport(
  base: EventReport,
  event: EventRecord,
  sessions: FeedbackSession[],
  variant: number
): Promise<EventReport> {
  if (!getOpenAi()) {
    return {
      ...base,
      aiRecommendations: buildHeuristicRecommendations(base, variant),
    };
  }

  try {
    const { highlights, aiRecommendations } = await generateOrganizerInsightsLLM(event, base, sessions, variant);
    return {
      ...base,
      highlights,
      aiRecommendations,
    };
  } catch (e) {
    console.warn("[organizer] LLM enrich failed:", e);
    return {
      ...base,
      aiRecommendations: buildHeuristicRecommendations(base, variant),
    };
  }
}
