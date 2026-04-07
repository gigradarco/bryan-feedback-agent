import { nanoid } from "nanoid";
import type { EventRecord, EventReport, FeedbackSession, Turn } from "./types.js";
import { buildEventReport } from "./synthesis.js";
import { enrichOrganizerReport, buildHeuristicRecommendations } from "./organizerEnrich.js";

const events = new Map<string, EventRecord>();
const sessions = new Map<string, FeedbackSession>();
/** Bumped by POST …/insights/refresh so the model proposes alternative angles */
const recommendationVariant = new Map<string, number>();

function seedEvents(): void {
  if (events.size > 0) return;
  const demo: EventRecord[] = [
    {
      id: "evt_neon_night",
      name: "Neon Night — Warehouse Sessions",
      dateLabel: "Sat 5 Apr 2026",
      venue: "East Dock Warehouse",
      lineupSummary: "DJ Mara · The Hollows (live) · Opener: Lumen",
    },
    {
      id: "evt_jazz_rooftop",
      name: "Rooftop Jazz & Wine",
      dateLabel: "Sun 6 Apr 2026",
      venue: "Harbour 9 Rooftop",
      lineupSummary: "Elena Park Quartet · Opener: Soft Currency",
    },
  ];
  for (const e of demo) events.set(e.id, e);
}

seedEvents();

export function listEvents(): EventRecord[] {
  return [...events.values()];
}

export function getEvent(id: string): EventRecord | undefined {
  return events.get(id);
}

export function createSession(eventId: string, attendeeLabel: string): FeedbackSession {
  const event = events.get(eventId);
  if (!event) throw new Error("Event not found");

  const now = new Date().toISOString();
  const session: FeedbackSession = {
    id: nanoid(),
    eventId,
    attendeeLabel: attendeeLabel.trim() || "Guest",
    step: "opener",
    turns: [],
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): FeedbackSession | undefined {
  return sessions.get(id);
}

export function appendTurn(sessionId: string, turn: Turn): FeedbackSession {
  const s = sessions.get(sessionId);
  if (!s) throw new Error("Session not found");
  s.turns.push(turn);
  s.updatedAt = new Date().toISOString();
  sessions.set(sessionId, s);
  return s;
}

export function updateSession(
  sessionId: string,
  patch: Partial<Pick<FeedbackSession, "step" | "completed">>
): FeedbackSession {
  const s = sessions.get(sessionId);
  if (!s) throw new Error("Session not found");
  Object.assign(s, patch);
  s.updatedAt = new Date().toISOString();
  sessions.set(sessionId, s);
  return s;
}

export function sessionsForEvent(eventId: string): FeedbackSession[] {
  return [...sessions.values()].filter((x) => x.eventId === eventId);
}

export function getRecommendationVariant(eventId: string): number {
  return recommendationVariant.get(eventId) ?? 0;
}

/** Increments refresh counter; next report load uses a new LLM / heuristic rotation. */
export function bumpRecommendationVariant(eventId: string): number {
  const next = (recommendationVariant.get(eventId) ?? 0) + 1;
  recommendationVariant.set(eventId, next);
  return next;
}

export async function getReportAsync(
  eventId: string,
  options?: { skipAi?: boolean }
): Promise<EventReport | null> {
  const event = events.get(eventId);
  if (!event) return null;
  const sess = sessionsForEvent(eventId);
  const base = buildEventReport(event, sess);
  const variant = getRecommendationVariant(eventId);
  if (options?.skipAi) {
    return {
      ...base,
      aiRecommendations: buildHeuristicRecommendations(base, variant),
    };
  }
  return enrichOrganizerReport(base, event, sess, variant);
}
