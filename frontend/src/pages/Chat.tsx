import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchEvents, sendMessage, startSession, type EventRecord, type FeedbackSession } from "../api";
import { creditCompletedFeedback, POINTS_PER_COMPLETED_FEEDBACK } from "../rewards";

export default function Chat() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [session, setSession] = useState<FeedbackSession | null>(null);
  const [input, setInput] = useState("");
  const [attendee, setAttendee] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [pointsCredit, setPointsCredit] = useState<{
    sessionId: string;
    alreadyCredited: boolean;
    awarded: number;
    balance: number;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchEvents()
      .then((list) => list.find((e) => e.id === eventId) || null)
      .then(setEvent)
      .catch((e) => setError(e.message));
  }, [eventId]);

  useEffect(() => {
    if (session?.completed) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.turns.length, session?.suggestions?.length, session?.completed]);

  useEffect(() => {
    if (!session?.completed || !session.id) return;
    setPointsCredit((prev) => {
      const r = creditCompletedFeedback(session.id);
      const next = { sessionId: session.id, ...r };
      if (prev?.sessionId === session.id && prev.awarded > 0 && r.alreadyCredited) return prev;
      return next;
    });
  }, [session?.completed, session?.id]);

  async function begin() {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const s = await startSession(eventId, attendee);
      setSession(s);
      setStarted(true);
      setShowTranscript(false);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!session || !trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const s = await sendMessage(session.id, trimmed);
      setSession(s);
      setInput("");
      if (s.completed) setShowTranscript(false);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }

  function send() {
    void sendText(input);
  }

  if (!eventId) return null;

  if (!event) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>
        {error || "Loading…"}
      </div>
    );
  }

  const guestName = session?.attendeeLabel?.trim() || "there";

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 16px 24px",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Link to="/events" style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
          ← Events
        </Link>
        <div style={{ fontWeight: 600, marginTop: 8 }}>{event.name}</div>
        <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
          {event.dateLabel} · {event.venue}
        </div>
      </div>

      {!started ? (
        <div
          style={{
            padding: 20,
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <label style={{ display: "block", fontSize: "0.875rem", color: "var(--muted)", marginBottom: 8 }}>
            Your name (optional)
          </label>
          <input
            value={attendee}
            onChange={(e) => setAttendee(e.target.value)}
            placeholder="Alex"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              marginBottom: 16,
            }}
          />
          <button
            type="button"
            onClick={begin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "#0c0d10",
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Starting…" : "Start chat"}
          </button>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", margin: "14px 0 0" }}>
            Earn <strong style={{ color: "var(--accent)" }}>{POINTS_PER_COMPLETED_FEEDBACK} Buzo points</strong> when you
            finish—redeemable for vouchers. Tip: mention sound, bar queues, or the opener for richer reports.
          </p>
        </div>
      ) : session?.completed ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "32px 24px 28px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-strong)",
              background: `linear-gradient(165deg, var(--surface-2) 0%, var(--bg-elevated) 100%)`,
              boxShadow: `0 0 0 1px var(--accent-glow) inset, 0 20px 40px rgba(0,0,0,0.3)`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--accent-dim)",
                border: "2px solid var(--accent)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                margin: "0 auto 20px",
                lineHeight: 1,
              }}
              aria-hidden
            >
              ✓
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 10px", lineHeight: 1.25 }}>
              Thanks, {guestName}!
            </h1>
              <p style={{ color: "var(--muted)", margin: "0 auto", maxWidth: 320, lineHeight: 1.55, fontSize: "0.9375rem" }}>
              Your feedback is in. It helps the crew and future nights—no need to do anything else.
            </p>
            {pointsCredit && (
              <div
                style={{
                  marginTop: 22,
                  padding: "16px 18px",
                  borderRadius: "var(--radius)",
                  border: "1px solid rgba(110, 231, 183, 0.35)",
                  background: "rgba(110, 231, 183, 0.08)",
                  textAlign: "left",
                  maxWidth: 340,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, marginBottom: 6 }}>
                  Buzo rewards
                </div>
                {pointsCredit.alreadyCredited ? (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
                    Points for this chat were already counted. You have{" "}
                    <strong style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>{pointsCredit.balance} pts</strong>{" "}
                    total—keep finishing feedback on new events to earn more.
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--accent)" }}>+{pointsCredit.awarded} points</strong> for completing
                    feedback. You now have{" "}
                    <strong style={{ fontFamily: "var(--mono)" }}>{pointsCredit.balance} pts</strong>.
                  </p>
                )}
                {!pointsCredit.alreadyCredited && (
                  <p style={{ margin: "10px 0 0", fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.45 }}>
                    Turn points into drink, merch, or ticket vouchers when you hit a tier.
                  </p>
                )}
                <Link
                  to="/rewards"
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                  }}
                >
                  View rewards & redeem →
                </Link>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 22,
                maxWidth: 320,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <Link
                to="/organizer"
                style={{
                  display: "block",
                  padding: "14px 20px",
                  borderRadius: 10,
                  background: "var(--accent)",
                  color: "#0c0d10",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Organizer dashboard
              </Link>
              <Link
                to={`/organizer/${event.id}`}
                style={{
                  display: "block",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--border-strong)",
                  color: "var(--text)",
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  textAlign: "center",
                  background: "var(--bg)",
                }}
              >
                Insights for this event
              </Link>
            </div>
            <p style={{ margin: "22px 0 0", fontSize: "0.8125rem" }}>
              <Link to="/events" style={{ color: "var(--muted)" }}>
                Back to all events
              </Link>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            style={{
              marginTop: 16,
              alignSelf: "center",
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: "0.8125rem",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 8,
            }}
          >
            {showTranscript ? "Hide conversation" : "Show conversation"}
          </button>
          {showTranscript && session && (
            <div
              style={{
                marginTop: 8,
                maxHeight: 280,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "12px 0",
              }}
            >
              {session.turns.map((t, i) => (
                <div
                  key={`${t.at}-${i}`}
                  style={{
                    alignSelf: t.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: t.role === "user" ? "var(--bubble-user)" : "var(--bubble-agent)",
                    border:
                      t.role === "user" ? "1px solid rgba(110,231,183,0.2)" : "1px solid var(--border)",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {t.text}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "8px 0",
            }}
          >
            {session?.turns.map((t, i) => (
              <div
                key={`${t.at}-${i}`}
                style={{
                  alignSelf: t.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: t.role === "user" ? "var(--bubble-user)" : "var(--bubble-agent)",
                  border:
                    t.role === "user" ? "1px solid rgba(110,231,183,0.2)" : "1px solid var(--border)",
                  fontSize: "0.9375rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                {t.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ marginTop: 12 }}>
            {(session?.suggestions?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    marginBottom: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  Tap an idea or type your own
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    maxHeight: 120,
                    overflowY: "auto",
                    paddingBottom: 2,
                  }}
                >
                  {session!.suggestions!.map((label) => (
                    <button
                      key={label}
                      type="button"
                      disabled={loading}
                      onClick={() => void sendText(label)}
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--bg-elevated)",
                        color: "var(--text)",
                        padding: "8px 12px",
                        borderRadius: 999,
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        opacity: loading ? 0.55 : 1,
                        maxWidth: "100%",
                        textAlign: "left",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Type a reply…"
                rows={2}
                disabled={loading}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text)",
                }}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                style={{
                  padding: "12px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#0c0d10",
                  fontWeight: 600,
                  alignSelf: "stretch",
                  opacity: loading || !input.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginTop: 10 }}>{error}</p>
      )}
    </div>
  );
}
