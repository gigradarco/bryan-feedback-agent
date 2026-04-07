import type {
  EventRecord,
  FeedbackSession,
  EventReport,
  ThemeInsight,
  OpsTag,
  InsightHighlights,
} from "./types.js";

const POS = /\b(love|loved|great|amazing|incredible|perfect|best|vibe|fun|energy|sick|fire|highlight|brilliant|excellent|awesome|fantastic)\b/i;
const NEG = /\b(bad|awful|terrible|worst|hate|hated|boring|disappoint|sucked|rough|mess|chaos|never again|too loud|uncomfortable)\b/i;

const THEME_DEFS: {
  id: string;
  label: string;
  patterns: RegExp[];
  opsTags?: string[];
}[] = [
  {
    id: "sound",
    label: "Sound & acoustics",
    patterns: [
      /\b(sound|audio|bass|mix|acoustic|volume|loud|quiet|speakers|pa)\b/i,
    ],
  },
  {
    id: "bar_queue",
    label: "Bar & queues",
    patterns: [/\b(bar|queue|line|wait|drinks|beer|bartender|slow service)\b/i],
    opsTags: ["bar", "queue"],
  },
  {
    id: "crowd",
    label: "Crowd & atmosphere",
    patterns: [/\b(crowd|people|atmosphere|packed|space|vibe|dancefloor|moshpit)\b/i],
  },
  {
    id: "venue",
    label: "Venue & comfort",
    patterns: [/\b(venue|toilet|bathroom|cold|hot|coat|security|door|staff)\b/i],
    opsTags: ["venue", "door", "security"],
  },
  {
    id: "opener",
    label: "Opening act",
    patterns: [/\b(opener|opening|warm[- ]?up|first act|support)\b/i],
  },
  {
    id: "headliner",
    label: "Headliner / main act",
    patterns: [/\b(headliner|main act|closer|dj set|live set|encore)\b/i],
  },
];

function userTexts(session: FeedbackSession): string {
  return session.turns
    .filter((t) => t.role === "user")
    .map((t) => t.text)
    .join(" \n ");
}

function sentimentScore(text: string): number {
  const p = (text.match(POS) || []).length;
  const n = (text.match(NEG) || []).length;
  if (p + n === 0) return 0;
  return (p - n) / Math.max(1, p + n);
}

function collectMentions(text: string): Map<string, { count: number; pos: number; neg: number; snippets: string[] }> {
  const map = new Map<string, { count: number; pos: number; neg: number; snippets: string[] }>();
  for (const def of THEME_DEFS) {
    let hits = 0;
    for (const pat of def.patterns) {
      if (pat.test(text)) hits++;
    }
    if (hits > 0) {
      const score = sentimentScore(text);
      const snippet = text.split(/\n/).find((line) => def.patterns.some((p) => p.test(line))) || text.slice(0, 120);
      map.set(def.id, {
        count: 1,
        pos: score > 0 ? 1 : 0,
        neg: score < 0 ? 1 : 0,
        snippets: [snippet.trim().slice(0, 200)],
      });
    }
  }
  return map;
}

function mergeThemeMaps(
  into: Map<string, { count: number; pos: number; neg: number; snippets: string[] }>,
  next: Map<string, { count: number; pos: number; neg: number; snippets: string[] }>
) {
  for (const [k, v] of next) {
    const cur = into.get(k);
    if (!cur) into.set(k, { ...v, snippets: [...v.snippets] });
    else {
      cur.count += v.count;
      cur.pos += v.pos;
      cur.neg += v.neg;
      for (const s of v.snippets) {
        if (cur.snippets.length < 3 && !cur.snippets.includes(s)) cur.snippets.push(s);
      }
    }
  }
}

function netLabel(score: number): EventReport["snapshot"]["netSentimentLabel"] {
  if (score >= 0.45) return "strongly positive";
  if (score >= 0.15) return "positive";
  if (score <= -0.35) return "negative";
  return "mixed";
}

function uniqLines(lines: string[], max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const s = raw.replace(/\s+/g, " ").trim();
    if (s.length < 8) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export function buildInsightHighlights(
  themes: ThemeInsight[],
  operations: OpsTag[],
  outlierSummaries: string[],
  snapshot: EventReport["snapshot"]
): InsightHighlights {
  const wentWell: string[] = [];
  const toImprove: string[] = [];
  const concerns: string[] = [];

  for (const t of themes) {
    const ex = t.exampleParaphrases[0];
    const exq = ex ? ` “${ex.slice(0, 120)}${ex.length > 120 ? "…" : ""}”` : "";
    if (t.sentimentSkew === "positive") {
      wentWell.push(
        `${t.label} landed well (~${t.sharePercent}% of responses) — attendees sound upbeat.${exq ? ` Example:${exq}` : ""}`
      );
    } else if (t.sentimentSkew === "negative") {
      concerns.push(
        `${t.label} shows friction (~${t.sharePercent}% flagged it).${exq ? ` Example:${exq}` : " Review quotes in themes below."}`
      );
    } else {
      toImprove.push(
        `${t.label} is mixed (~${t.sharePercent}% touched it) — room to sharpen the experience.${exq ? ` Signal:${exq}` : ""}`
      );
    }
  }

  for (const o of operations) {
    const line = `Ops: ${o.tag} showed up in feedback${o.examples[0] ? ` (“${o.examples[0].slice(0, 100)}…”)` : ""} (${o.count}×).`;
    if (o.tag === "queue" || o.tag === "bar" || o.tag === "door") {
      concerns.push(line);
    } else {
      toImprove.push(line);
    }
  }

  for (const raw of outlierSummaries.slice(0, 3)) {
    concerns.push(raw);
  }

  if (snapshot.responseCount === 0) {
    return {
      wentWell: ["No attendee text yet — share the feedback link after the night wraps."],
      toImprove: [],
      concerns: [],
    };
  }

  if ((wentWell.length === 0) && (snapshot.netSentimentLabel === "strongly positive" || snapshot.netSentimentLabel === "positive")) {
    wentWell.push(
      `Overall sentiment reads ${snapshot.netSentimentLabel.replace("-", " ")} — crowd energy likely carried the night even where themes are thin.`
    );
  }
  if (concerns.length === 0 && snapshot.netSentimentLabel === "negative") {
    concerns.push(
      "Tone skews negative in aggregate — open transcripts for specifics even if theme extractors didn’t tag a smoking gun yet."
    );
  }
  if (toImprove.length === 0 && snapshot.netSentimentLabel === "mixed") {
    toImprove.push("Mixed signals overall — prioritize the loudest operational themes (queue, sound, door) on the next run.");
  }

  return {
    wentWell: uniqLines(wentWell),
    toImprove: uniqLines(toImprove),
    concerns: uniqLines(concerns),
  };
}

export function buildEventReport(event: EventRecord, allSessions: FeedbackSession[]): EventReport {
  const completed = allSessions.filter((s) => s.completed);
  const withUser = allSessions.filter((s) => s.turns.some((t) => t.role === "user"));

  const themeAgg = new Map<string, { count: number; pos: number; neg: number; snippets: string[] }>();
  let scoreSum = 0;
  let scoreN = 0;

  const outlierSummaries: string[] = [];

  for (const s of withUser) {
    const text = userTexts(s);
    if (!text.trim()) continue;
    const sc = sentimentScore(text);
    if (!Number.isNaN(sc)) {
      scoreSum += sc;
      scoreN++;
    }
    mergeThemeMaps(themeAgg, collectMentions(text));
    if (sc <= -0.5 && text.length > 10) {
      outlierSummaries.push(`Strong negative signals in one response: "${text.slice(0, 140)}${text.length > 140 ? "…" : ""}"`);
    }
  }

  const netScore = scoreN ? scoreSum / scoreN : 0;
  const label = netLabel(netScore);

  const themes: ThemeInsight[] = [];
  for (const def of THEME_DEFS) {
    const row = themeAgg.get(def.id);
    if (!row) continue;
    const share = withUser.length ? Math.round((row.count / withUser.length) * 100) : 0;
    let skew: ThemeInsight["sentimentSkew"] = "mixed";
    if (row.pos > row.neg * 1.2) skew = "positive";
    else if (row.neg > row.pos * 1.2) skew = "negative";
    themes.push({
      id: def.id,
      label: def.label,
      mentionCount: row.count,
      sharePercent: Math.min(100, share),
      sentimentSkew: skew,
      exampleParaphrases: row.snippets,
    });
  }
  themes.sort((a, b) => b.mentionCount - a.mentionCount);

  const opsMap = new Map<string, OpsTag>();
  for (const def of THEME_DEFS) {
    const row = themeAgg.get(def.id);
    if (!def.opsTags || !row) continue;
    for (const tag of def.opsTags) {
      const o = opsMap.get(tag) || { tag, count: 0, examples: [] };
      o.count += row.count;
      for (const ex of row.snippets) {
        if (o.examples.length < 2) o.examples.push(ex);
      }
      opsMap.set(tag, o);
    }
  }
  const operations = [...opsMap.values()].filter((o) => o.count > 0).sort((a, b) => b.count - a.count);

  const talentNotes: string[] = [];
  const op = themeAgg.get("opener");
  const hl = themeAgg.get("headliner");
  if (op && op.count >= 2) talentNotes.push(`Opening act came up in ${op.count} responses—review snippets for specific praise or friction.`);
  if (hl && hl.count >= 2) talentNotes.push(`Headliner / main set mentioned in ${hl.count} responses—check sentiment skew in themes.`);

  const confidenceNote =
    withUser.length < 5
      ? `Low sample size (${withUser.length}). Treat percentages as directional.`
      : `${withUser.length} respondents with text; aggregates stabilize as N grows.`;

  const snapshot = {
    responseCount: withUser.length,
    completedCount: completed.length,
    netSentimentLabel: label,
    netSentimentScore: Math.round(netScore * 100) / 100,
    confidenceNote,
  };

  const highlights = buildInsightHighlights(themes, operations, outlierSummaries, snapshot);

  return {
    eventId: event.id,
    generatedAt: new Date().toISOString(),
    snapshot,
    themes,
    operations,
    talentNotes,
    outlierSummaries: outlierSummaries.slice(0, 5),
    highlights,
    aiRecommendations: {
      summary: "Recommendations load with the full report.",
      actions: [],
      variant: 0,
      source: "heuristic",
      refreshedAt: new Date().toISOString(),
    },
  };
}
