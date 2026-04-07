import type { EventRecord, FeedbackSession, AgentStep } from "./types.js";

function openerMessage(event: EventRecord): string {
  return `Hey — quick chat about ${event.name} (${event.dateLabel} @ ${event.venue}). ~2 min, skip anytime. ${event.lineupSummary}. Overall, how was it for you?`;
}

function mirrorHint(text: string): string {
  const t = text.trim();
  if (t.length < 8) return "";
  const words = t.split(/\s+/).slice(0, 4).join(" ");
  return words ? `Thanks — “${words}…” helps.` : "";
}

function isVague(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length < 12) return true;
  if (/^(good|ok|fine|alright|cool|nice|great|bad|meh)\.?$/i.test(t)) return true;
  return false;
}

export interface AgentReply {
  messages: string[];
  nextStep: AgentStep;
  completed: boolean;
}

export function initialAgentMessage(session: FeedbackSession, event: EventRecord): AgentReply {
  return {
    messages: [openerMessage(event)],
    nextStep: "overall",
    completed: false,
  };
}

export function handleUserMessage(
  session: FeedbackSession,
  event: EventRecord,
  userText: string
): AgentReply {
  const step = session.step;
  const raw = userText.trim();

  if (!raw) {
    return { messages: ["No worries — say anything when you’re ready."], nextStep: step, completed: false };
  }

  if (/^(skip|pass|stop|done|bye)\.?$/i.test(raw)) {
    return {
      messages: ["All good — thanks for your time. Hope to see you at the next one."],
      nextStep: "close",
      completed: true,
    };
  }

  if (step === "opener" || step === "overall") {
    const hint = mirrorHint(raw);
    if (isVague(raw)) {
      return {
        messages: [
          hint ? `${hint} If you could change one thing, what would it be?` : "If you could change one thing about the night, what would it be?",
        ],
        nextStep: "probe",
        completed: false,
      };
    }
    return {
      messages: [
        hint || "Appreciate the detail.",
        "How was the sound on the floor — too loud, too quiet, or about right?",
      ],
      nextStep: "sound",
      completed: false,
    };
  }

  if (step === "probe") {
    return {
      messages: ["Noted. How was the sound — too loud, too quiet, or about right?"],
      nextStep: "sound",
      completed: false,
    };
  }

  if (step === "sound") {
    return {
      messages: [
        "Got it. Last one on logistics: bar queue, door, toilets — anything rough there, or pretty smooth?",
      ],
      nextStep: "venue_ops",
      completed: false,
    };
  }

  if (step === "venue_ops") {
    return {
      messages: [
        "Thanks — that’s super helpful. I’ll feed this to the crew.",
        "If we line something up that matches what you liked, want a heads-up next week?",
      ],
      nextStep: "close",
      completed: true,
    };
  }

  if (step === "close") {
    return {
      messages: ["Already wrapped this one — appreciate you either way."],
      nextStep: "close",
      completed: session.completed,
    };
  }

  return { messages: ["Tell me more?"], nextStep: step, completed: false };
}
