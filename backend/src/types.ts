export type AgentStep =
  | "opener"
  | "overall"
  | "probe"
  | "sound"
  | "venue_ops"
  | "close";

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
  step: AgentStep;
  turns: Turn[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
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
  /** Strengths attendees called out */
  wentWell: string[];
  /** Fixable gaps and “almost there” areas */
  toImprove: string[];
  /** Clear problems or risks */
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
    netSentimentLabel: "strongly positive" | "positive" | "mixed" | "negative";
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
