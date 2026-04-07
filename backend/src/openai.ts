import OpenAI from "openai";
import type { EventRecord } from "./types.js";

export function getOpenAi(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export function openAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** Quick check: one short completion. Safe to expose result shape (no secrets). */
export async function testOpenAi(): Promise<{
  ok: boolean;
  model?: string;
  reply?: string;
  error?: string;
}> {
  const client = getOpenAi();
  if (!client) {
    return { ok: false, error: "OPENAI_API_KEY is not set in backend/.env" };
  }
  const model = openAiModel();
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: 'Reply with exactly one word: pong' }],
      max_tokens: 16,
    });
    const reply = r.choices[0]?.message?.content?.trim() || "";
    return { ok: true, model, reply };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? String(e) };
  }
}

/** Rewrites scripted replies; keeps intent. Falls back to drafts on any failure. */
export async function polishAgentMessages(
  event: EventRecord,
  attendeeLastMessage: string,
  drafts: string[],
  step: string
): Promise<string[]> {
  const client = getOpenAi();
  if (!client || drafts.length === 0) return drafts;

  const model = openAiModel();
  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You rewrite lines for a short post-event feedback chat (like Telegram).",
            "Rules: keep the same intent and questions as the drafts; 1–3 short messages;",
            "warm and casual; no bullet lists; match the attendee's language if clear;",
            "do not invent facts about the event beyond name/venue/date given.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            event: {
              name: event.name,
              venue: event.venue,
              dateLabel: event.dateLabel,
              lineup: event.lineupSummary,
            },
            flow_step: step,
            attendee_last_message: attendeeLastMessage,
            draft_messages: drafts,
            output_schema: { messages: ["string"] },
          }),
        },
      ],
      max_tokens: 450,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return drafts;
    const parsed = JSON.parse(raw) as { messages?: unknown };
    if (
      Array.isArray(parsed.messages) &&
      parsed.messages.length > 0 &&
      parsed.messages.every((x) => typeof x === "string")
    ) {
      return parsed.messages as string[];
    }
  } catch (e) {
    console.warn("[openai] polishAgentMessages failed, using drafts:", e);
  }
  return drafts;
}
