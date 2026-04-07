import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  listEvents,
  getEvent,
  createSession,
  getSession,
  appendTurn,
  updateSession,
  getReportAsync,
  bumpRecommendationVariant,
} from "./store.js";
import { handleUserMessage, initialAgentMessage } from "./agent.js";
import { polishAgentMessages, testOpenAi } from "./openai.js";
import { attachSuggestions } from "./suggestions.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PORT = Number(process.env.PORT) || 3001;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/** Verify OpenAI key + model (no secrets returned). */
app.get("/api/health/openai", async (_req, res) => {
  const result = await testOpenAi();
  if (result.ok) {
    res.json({ ok: true, model: result.model, reply: result.reply });
  } else {
    res.status(result.error?.includes("not set") ? 503 : 502).json({
      ok: false,
      error: result.error,
    });
  }
});

app.get("/api/events", (_req, res) => {
  res.json(listEvents());
});

app.get("/api/events/:id", (req, res) => {
  const e = getEvent(req.params.id);
  if (!e) return res.status(404).json({ error: "Event not found" });
  res.json(e);
});

app.get("/api/events/:id/report", async (req, res) => {
  try {
    const skipAi = req.query.skipAi === "1" || req.query.skipAi === "true";
    const report = await getReportAsync(req.params.id, { skipAi });
    if (!report) return res.status(404).json({ error: "Event not found" });
    res.json(report);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

/** Bump recommendation variant and return a fresh report (new AI angle when OpenAI is configured). */
app.post("/api/events/:id/insights/refresh", async (req, res) => {
  try {
    if (!getEvent(req.params.id)) return res.status(404).json({ error: "Event not found" });
    bumpRecommendationVariant(req.params.id);
    const report = await getReportAsync(req.params.id);
    if (!report) return res.status(404).json({ error: "Event not found" });
    res.json(report);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/sessions", (req, res) => {
  const { eventId, attendeeLabel } = req.body as { eventId?: string; attendeeLabel?: string };
  if (!eventId) return res.status(400).json({ error: "eventId required" });
  try {
    const session = createSession(eventId, attendeeLabel || "Guest");
    const event = getEvent(eventId)!;
    const first = initialAgentMessage(session, event);

    let s = session;
    for (const text of first.messages) {
      s = appendTurn(s.id, { role: "agent", text, at: new Date().toISOString() });
    }
    s = updateSession(s.id, { step: first.nextStep, completed: first.completed });

    const full = getSession(s.id)!;
    res.status(201).json(attachSuggestions(full));
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

app.post("/api/sessions/:id/message", async (req, res) => {
  try {
    const { text } = req.body as { text?: string };
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.completed) return res.status(400).json({ error: "Session already completed" });

    const event = getEvent(session.eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const userText = typeof text === "string" ? text : "";
    let s = appendTurn(session.id, { role: "user", text: userText, at: new Date().toISOString() });

    const reply = handleUserMessage({ ...s, step: session.step }, event, userText);
    const messages = await polishAgentMessages(event, userText, reply.messages, reply.nextStep);

    for (const m of messages) {
      s = appendTurn(s.id, { role: "agent", text: m, at: new Date().toISOString() });
    }
    s = updateSession(s.id, { step: reply.nextStep, completed: reply.completed });

    const full = getSession(s.id)!;
    res.json(attachSuggestions(full));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Feedback sim API http://localhost:${PORT}`);
});
