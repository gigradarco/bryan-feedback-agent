import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvents, fetchReport, type EventRecord, type EventReport } from "../api";

function sentimentAccent(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("strongly positive") || l === "positive") return "var(--positive)";
  if (l === "negative") return "var(--negative)";
  return "var(--warning)";
}

export default function Organizer() {
  const [events, setEvents] = useState<EventRecord[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, EventReport | null>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!events?.length) return;
    (async () => {
      const next: Record<string, EventReport | null> = {};
      for (const e of events) {
        try {
          next[e.id] = await fetchReport(e.id, { skipAi: true });
        } catch {
          next[e.id] = null;
        }
      }
      setPreviews(next);
    })();
  }, [events]);

  if (err) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <p style={{ color: "var(--danger)" }}>{err}</p>
      </div>
    );
  }

  if (!events) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
        Loading…
      </div>
    );
  }

  const totalResponses = events.reduce((acc, e) => acc + (previews[e.id]?.snapshot.responseCount ?? 0), 0);
  const eventsWithData = events.filter((e) => (previews[e.id]?.snapshot.responseCount ?? 0) > 0).length;

  return (
    <div style={{ padding: "28px 18px 48px", maxWidth: 960, margin: "0 auto" }}>
      <header style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "var(--accent)",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Organizer
        </div>
        <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, margin: "0 0 10px", lineHeight: 1.15 }}>
          Feedback insights
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: 520, lineHeight: 1.55 }}>
          Snapshot of conversational feedback from the demo. Open an event for themes, sentiment, and ops signals.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-strong)",
            background: "linear-gradient(160deg, var(--surface-2), var(--bg-elevated))",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 8 }}>Events live</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--mono)" }}>{events.length}</div>
        </div>
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 8 }}>Total responses</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--accent)" }}>
            {totalResponses}
          </div>
        </div>
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-strong)",
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 8 }}>With data</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "var(--mono)" }}>{eventsWithData}</div>
        </div>
      </div>

      <h2
        style={{
          fontSize: "0.6875rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--muted)",
          margin: "0 0 16px",
          fontWeight: 600,
        }}
      >
        Your events
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {events.map((e) => {
          const r = previews[e.id];
          const n = r?.snapshot.responseCount ?? 0;
          const label = r?.snapshot.netSentimentLabel ?? "";
          const accent = r ? sentimentAccent(label) : "var(--muted)";

          return (
            <li key={e.id}>
              <Link
                to={`/organizer/${e.id}`}
                style={{
                  display: "block",
                  padding: 0,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text)",
                  textDecoration: "none",
                  overflow: "hidden",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                <div style={{ display: "flex", minHeight: 100 }}>
                  <div
                    style={{
                      width: 5,
                      flexShrink: 0,
                      background: n > 0 ? accent : "var(--surface-2)",
                    }}
                  />
                  <div style={{ flex: 1, padding: "18px 20px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "1.0625rem", lineHeight: 1.3 }}>{e.name}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: 4 }}>{e.dateLabel}</div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontFamily: "var(--mono)",
                          fontSize: "0.8125rem",
                          color: "var(--muted)",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: "var(--surface-2)",
                            color: n > 0 ? "var(--text)" : "var(--muted)",
                          }}
                        >
                          {n} responses
                        </span>
                        <span style={{ color: "var(--accent)" }}>→</span>
                      </div>
                    </div>
                    {r && n > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                            color: accent,
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: `1px solid ${accent}33`,
                            background: `${accent}14`,
                          }}
                        >
                          {label.replace(/-/g, " ")}
                        </span>
                        <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                          {r.snapshot.completedCount} full chats
                        </span>
                      </div>
                    )}
                    {r && n === 0 && (
                      <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>No feedback yet — start a chat from home</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p style={{ marginTop: 28, fontSize: "0.875rem" }}>
        <Link to="/events" style={{ color: "var(--muted)" }}>
          ← Attendee · simulate feedback
        </Link>
      </p>
    </div>
  );
}
