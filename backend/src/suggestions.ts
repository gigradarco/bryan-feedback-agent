import type { AgentStep } from "./types.js";

/** Quick-reply ideas for the attendee based on what we’re asking next. */
export function replySuggestionsForStep(step: AgentStep, completed: boolean): string[] {
  if (completed || step === "close") return [];

  switch (step) {
    case "opener":
    case "overall":
      return [
        "Loved it — amazing energy",
        "Solid night, would come again",
        "It was okay, nothing special",
        "Mixed — great music, rough logistics",
      ];
    case "probe":
      return [
        "Shorter bar queues",
        "Clearer / louder sound",
        "More space on the floor",
        "Earlier kickoff",
        "Nothing — it was great",
      ];
    case "sound":
      return ["Too loud", "Too quiet", "About right", "Bass was muddy", "Sound was crisp"];
    case "venue_ops":
      return [
        "Pretty smooth overall",
        "Bar line was slow",
        "Door / security was rough",
        "Toilets were a mess",
        "No issues for me",
      ];
    default:
      return [];
  }
}

export function attachSuggestions<T extends { step: AgentStep; completed: boolean }>(
  session: T
): T & { suggestions: string[] } {
  return {
    ...session,
    suggestions: replySuggestionsForStep(session.step, session.completed),
  };
}
