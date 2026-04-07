export interface EventRecord {
  id: string;
  name: string;
  dateLabel: string;
  venue: string;
  lineupSummary: string;
}

export interface Turn {
  role: "agent" | "user";
  text: string;
  at: string;
}

export interface FeedbackSession {
  id: string;
  eventId: string;
  attendeeLabel: string;
  step: string;
  turns: Turn[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  /** Quick-reply ideas for the current question (from API). */
  suggestions?: string[];
}

export interface ThemeInsight {
  id: string;
  label: string;
  mentionCount: number;
  sharePercent: number;
  sentimentSkew: "positive" | "mixed" | "negative";
  exampleParaphrases: string[];
}

export interface OpsTag {
  tag: string;
  count: number;
  examples: string[];
}

export interface InsightHighlights {
  wentWell: string[];
  toImprove: string[];
  concerns: string[];
}

export interface AIRecommendations {
  summary: string;
  actions: string[];
  variant: number;
  source: "openai" | "heuristic";
  refreshedAt: string;
}

export interface EventReport {
  eventId: string;
  generatedAt: string;
  snapshot: {
    responseCount: number;
    completedCount: number;
    netSentimentLabel: string;
    netSentimentScore: number;
    confidenceNote: string;
  };
  themes: ThemeInsight[];
  operations: OpsTag[];
  talentNotes: string[];
  outlierSummaries: string[];
  highlights: InsightHighlights;
  aiRecommendations: AIRecommendations;
}

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || r.statusText);
  }
  return r.json() as Promise<T>;
}

export async function fetchEvents(): Promise<EventRecord[]> {
  return j(await fetch("/api/events"));
}

export async function fetchReport(eventId: string, options?: { skipAi?: boolean }): Promise<EventReport> {
  const q = options?.skipAi ? "?skipAi=1" : "";
  return j(await fetch(`/api/events/${eventId}/report${q}`));
}

export async function refreshInsights(eventId: string): Promise<EventReport> {
  return j(
    await fetch(`/api/events/${eventId}/insights/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
  );
}

export async function startSession(eventId: string, attendeeLabel: string): Promise<FeedbackSession> {
  return j(
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, attendeeLabel }),
    })
  );
}

export async function sendMessage(sessionId: string, text: string): Promise<FeedbackSession> {
  return j(
    await fetch(`/api/sessions/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
  );
}
