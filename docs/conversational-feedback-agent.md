# Conversational feedback agent

A product and implementation primer for collecting rich, actionable event feedback through natural chat—starting on Telegram—and feeding structured signals back into Buzo (taste profiles, credibility, discovery).

---

## 1. Why this exists

**Forms feel like homework.** Short chats feel like talking to someone who cares. People volunteer more detail, nuance, and emotion when the channel invites follow-up (“What bothered you most?”) instead of a fixed grid of Likert rows.

An **AI agent** can hold that conversation, adapt to answers, and still produce **structured outputs** for promoters and for the product graph—without forcing attendees into a rigid UX.

---

## 2. What an AI agent can do differently (product pillars)

| Pillar | What it means | Outcome |
|--------|----------------|---------|
| **Conversational feedback** | Replace (or augment) forms with chat: opener, probes, clarifications, optional depth. Tone: friendly, brief, respectful of time. | Higher completion quality and volume of *usable* text. |
| **Sentiment synthesis** | After collection (and continuously during large batches), aggregate themes, percentages, and quotes—**actionable**, not a dump of transcripts. | Promoters get “73% loved the sound; top friction was bar queue; 3 named the opener” in minutes. |
| **Unprompted signal detection** | Monitor **public** posts (Instagram, TikTok, X, etc.) tied to event hashtags, geo, official accounts, or disclosed handles—with **clear consent and policy**. | Captures buzz and complaints people never submit in-app. |
| **Taste profile enrichment** | Map feedback and engagement to **Buzo taste vectors** (e.g. genres, venue vibe, crowd energy). | “You liked this → here’s what’s next for you” without a separate survey. |
| **Credibility / Buzz score** | Combine **verified attendance** + **feedback participation** (and optionally public signal quality) to update event-level scores **retroactively**. | Every event strengthens Buzo’s data asset and trust surface. |

---

## 3. Users and goals

### 3.1 Attendee

- Receive a timely nudge (e.g. morning after the event) on a channel they already use (Telegram first).
- Answer in free text; be asked **one follow-up at a time** where it helps.
- Know how long it will take (“~2 minutes”) and that they can stop anytime.
- Optionally get value back: personalized picks, early access, or a cleaner profile.

### 3.2 Promoter / organizer

- Dashboard or digest: synthesis + drill-down to representative quotes (with PII minimized).
- Compare events, venues, or nights; spot recurring operational issues (sound, queue, security, vibe).

### 3.3 Platform (Buzo)

- Richer profiles, better recommendations, and **measurement of real post-event sentiment** linked to identity and attendance where verified.

---

## 4. High-level system architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram (v1)  │────▶│  Orchestration   │────▶│  Feedback store │
│  (other channels│     │  + LLM + tools   │     │  + embeddings   │
│   later)        │     └────────┬─────────┘     └────────┬────────┘
└─────────────────┘              │                        │
                                 ▼                        ▼
                        ┌────────────────┐        ┌─────────────────┐
                        │  Synthesis     │        │  Buzo APIs      │
                        │  jobs / reports│        │  taste + scores │
                        └────────────────┘        └─────────────────┘
                                 ▲
                                 │
                        ┌────────────────┐
                        │  Public signal │
                        │  ingestors *   │
                        └────────────────┘
* optional / phased; policy-heavy
```

**Core components**

1. **Channel adapter** — Telegram Bot API (webhooks): receive messages, send replies, handle inline actions (thumbs, quick replies) if useful.
2. **Orchestration** — Conversation state machine + LLM: turns, tool calls, guardrails, language detection.
3. **Tools / integrations** — Fetch event context (lineup, venue), user verification status, write structured feedback records, trigger synthesis.
4. **Storage** — Sessions, turns, extracted entities/sentiment, aggregates per event; optional vector index for similarity and clustering.
5. **Synthesis layer** — Batch or streaming summarization with **citations** to underlying messages (for promoter trust).
6. **Buzo graph** — APIs to update taste profiles and event credibility/Buzz using agreed formulas.

---

## 5. Conversation design (MVP)

### 5.1 Principles

- **Short by default**; escalate depth only if the user is engaged.
- **One primary question per message** when probing.
- **Acknowledge** without sounding robotic; mirror their words lightly.
- **No guilt** if they tap “skip” or ghost—still record partial data if policy allows.

### 5.2 Example flow (illustrative)

1. **Opener** — Context + time bound: event name, date, “quick chat, ~2 min.”
2. **Overall** — “Overall, how was last night for you?” (free text or emoji scale + optional text).
3. **Probe** — If vague: “What would you change if you could change one thing?”
4. **High-signal areas** — Sound, crowd, bar/service, venue, opener/headliner (only if not already covered).
5. **Close** — Thank you + optional: “Want 2 picks for next week based on what you said?”

### 5.3 Safety and quality

- **PII minimization** — Avoid collecting unnecessary contact data in chat; link to verified account server-side.
- **Moderation** — Classify abuse, hate, harassment; safe refusal and escalation paths.
- **Grounding** — When giving “facts” about the event, use stored lineup/schedule, not model memory.

---

## 6. Sentiment synthesis (promoter-facing)

**Inputs:** Verified session transcripts, structured chips (ratings), optional public-ingest summaries.

**Outputs (example sections):**

- **Snapshot** — Net sentiment, confidence, sample size, time window.
- **Themes** — Ranked with **estimated share** (e.g. “~3 in 4 positive on sound”) and **example paraphrases** (not always raw quotes if redaction needed).
- **Operations** — Queue, bar, door, security, temperature, accessibility—tagged for ops teams.
- **Talent** — Opener vs headliner split only when clearly separable in data.
- **Outliers** — Strong negatives worth a human read (with links to source messages internal-only).

**Trust:** Every theme should trace to underlying evidence counts; avoid invented precision.

---

## 7. Unprompted public signal (phased)

This pillar is **high leverage and high responsibility**.

- **Scope:** Only public content; respect platform ToS; rate limits; prefer official APIs or licensed data where required.
- **Linkage:** Match to events via hashtags, official geo tags, time windows, and optional **opt-in** “connect my handle” for better attribution.
- **Use:** Augment synthesis (“social buzz themes”) and anomaly detection (spike in complaints)—not silent profiling without disclosure.

**Recommendation:** Ship **after** core conversational loop + promoter synthesis, with legal review.

---

## 8. Taste profile enrichment

**Idea:** Turn qualitative feedback into **labeled signals** (e.g. prefers intimate venues, dislikes long queues, loves heavy bass in live settings).

**Mechanics (conceptual):**

- **Extraction** — Map phrases to a controlled tag set + confidence.
- **Update rule** — Weighted blend with existing profile; decay old signals; cap influence from a single night.
- **Downstream** — Feed discovery, notifications, and “what’s next” carousels.

Document explicit **user-facing copy** for how taste is updated and how to view/reset.

---

## 9. Credibility / Buzz score updates

**Inputs to define with product/legal:**

- Verified check-in or ticket attestation.
- Feedback completion (full vs partial).
- Consistency / quality signals (non-gaming heuristics).
- Optional: public signal volume (trusted only when linkage is solid).

**Properties:**

- **Transparent** — Promoters understand *which behaviors* move the needle.
- **Retroactive** — Scores can backfill when verification or feedback arrives late.
- **Abuse-resistant** — Sybil resistance tied to real-world attendance signals, not chat volume alone.

---

## 10. Data model (starter sketch)

| Entity | Description |
|--------|-------------|
| `User` | Buzo user id, Telegram id, verification flags |
| `Event` | Event id, time, venue, lineup refs |
| `FeedbackSession` | user, event, channel, state, started_at, completed_at |
| `Turn` | session, role, text, timestamps, moderation flags |
| `FeedbackSignal` | structured fields extracted from session (tags, scores) |
| `EventSynthesis` | versioned report for promoter consumption |
| `ProfileDelta` | proposed taste updates with provenance |

---

## 11. MVP scope (suggested)

1. Telegram webhook bot + session persistence.
2. LLM-led conversation with fixed **macro-flow** and **dynamic probes**.
3. Structured extraction to `FeedbackSignal` + raw transcript storage.
4. Batch **synthesis** job → stored report + simple promoter view or emailed digest.
5. One **Buzo integration**: write `FeedbackSignal` + optional `ProfileDelta` behind a feature flag.

**Defer:** Broad public scraping; multi-channel parity; real-time dashboards.

---

## 12. Non-functional requirements

- **Latency:** Reply within ~2s typical (streaming typing indicator helps perception).
- **Reliability:** Idempotent webhook handling; retries; dead-letter for failed LLM/tool calls.
- **Observability:** Per-session traces; cost per completion; drop-off funnel by step.
- **Compliance:** GDPR-friendly retention defaults; easy export/delete where applicable.

---

## 13. Open decisions

- Verification source of truth (ticket partner API vs manual check-in vs NFT gate, etc.).
- Whether synthesis is **per event** only or also **cross-event** for promoters with many shows.
- Language strategy: single locale MVP vs automatic multilingual prompts.
- Incentives: none vs soft perks vs explicit rewards—and impact on bias.

---

## 14. Glossary

- **Verified attendance** — Strong evidence the user was physically present or legitimately entitled entry (definition is product-specific).
- **Buzz / credibility score** — Composite trust or quality metric for an event on Buzo (exact formula TBD).
- **Taste profile** — User preference representation used for recommendations.

---

*This document is a living spec. Update it as integrations (Telegram → WhatsApp → in-app) and legal constraints firm up.*
