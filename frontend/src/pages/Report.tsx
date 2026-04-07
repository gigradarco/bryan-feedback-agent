import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchEvents, fetchReport, refreshInsights, type EventRecord, type EventReport } from "../api";

function skewLabel(s: string) {
  if (s === "positive") return "Mostly positive";
  if (s === "negative") return "Friction";
  return "Mixed";
}

function skewColor(skew: string): string {
  if (skew === "positive") return "var(--positive)";
  if (skew === "negative") return "var(--negative)";
  return "var(--warning)";
}

function sentimentBarColor(label: string): string {
  if (label.includes("strongly positive") || label === "positive") return "var(--positive)";
  if (label === "negative") return "var(--negative)";
  return "var(--warning)";
}

/** Map score roughly in [-1, 1] to 0–100 for the meter thumb */
function scoreToPosition(score: number): number {
  const clamped = Math.max(-1, Math.min(1, score));
  return ((clamped + 1) / 2) * 100;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </h2>
  );
}

function HighlightColumn({
  title,
  accent,
  items,
  empty,
}: {
  title: string;
  accent: string;
  items: string[];
  empty: string;
}) {
  return (
    <div
      style={{
        padding: "18px 18px 20px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        borderTop: `3px solid ${accent}`,
        minHeight: 140,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: 12, color: "var(--text)" }}>{title}</div>
      {items.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>{empty}</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((line, i) => (
            <li key={i} style={{ fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.5 }}>
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Report() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [report, setReport] = useState<EventReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insightRefreshing, setInsightRefreshing] = useState(false);
  const [insightRefreshError, setInsightRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancel = false;
    (async () => {
      try {
        const [events, r] = await Promise.all([fetchEvents(), fetchReport(eventId)]);
        if (cancel) return;
        setEvent(events.find((e) => e.id === eventId) || null);
        setReport(r);
      } catch (e) {
        if (!cancel) setError((e as Error).message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [eventId]);

  async function handleRefreshInsights() {
    if (!eventId) return;
    setInsightRefreshing(true);
    setInsightRefreshError(null);
    try {
      const r = await refreshInsights(eventId);
      setReport(r);
    } catch (e) {
      setInsightRefreshError((e as Error).message);
    } finally {
      setInsightRefreshing(false);
    }
  }

  if (!eventId) return null;

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <p style={{ color: "var(--danger)" }}>{error}</p>
        <Link to="/organizer" style={{ fontSize: "0.9375rem" }}>
          ← Organizer
        </Link>
      </div>
    );
  }

  if (!report || !event) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
        Loading report…
      </div>
    );
  }

  const { snapshot } = report;
  const completionRate =
    snapshot.responseCount > 0
      ? Math.round((snapshot.completedCount / snapshot.responseCount) * 100)
      : 0;
  const meterPos = scoreToPosition(snapshot.netSentimentScore);

  return (
    <div
      style={{
        padding: "24px 18px 48px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <Link
        to="/organizer"
        style={{
          fontSize: "0.8125rem",
          color: "var(--muted)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Organizer
      </Link>

      <header
        style={{
          marginTop: 20,
          marginBottom: 28,
          padding: "24px 22px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-strong)",
          background: `linear-gradient(145deg, var(--surface-2) 0%, var(--bg-elevated) 100%)`,
          boxShadow: `0 0 0 1px var(--accent-glow) inset, 0 24px 48px rgba(0,0,0,0.35)`,
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontFamily: "var(--mono)",
            color: "var(--accent)",
            marginBottom: 10,
          }}
        >
          Event intelligence
        </div>
        <h1 style={{ fontSize: "clamp(1.35rem, 4vw, 1.85rem)", fontWeight: 700, margin: "0 0 8px", lineHeight: 1.2 }}>
          {event.name}
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9375rem" }}>
          {event.dateLabel} · {event.venue}
        </p>
        <p style={{ margin: "12px 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
          Updated {new Date(report.generatedAt).toLocaleString()}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            padding: "18px 18px 20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 6 }}>Net sentiment</div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.125rem",
              color: sentimentBarColor(snapshot.netSentimentLabel),
              textTransform: "capitalize",
            }}
          >
            {snapshot.netSentimentLabel.replace(/-/g, " ")}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.8125rem", color: "var(--muted)", marginTop: 6 }}>
            Score {snapshot.netSentimentScore > 0 ? "+" : ""}
            {snapshot.netSentimentScore}
          </div>
        </div>
        <div
          style={{
            padding: "18px 18px 20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 6 }}>Responses</div>
          <div style={{ fontWeight: 700, fontSize: "1.5rem", fontFamily: "var(--mono)" }}>
            {snapshot.responseCount}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: 6 }}>With written feedback</div>
        </div>
        <div
          style={{
            padding: "18px 18px 20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 6 }}>Completed chats</div>
          <div style={{ fontWeight: 700, fontSize: "1.5rem", fontFamily: "var(--mono)" }}>
            {snapshot.completedCount}
          </div>
          <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${completionRate}%`,
                borderRadius: 3,
                background: "linear-gradient(90deg, var(--accent), #34d399)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>{completionRate}% completion</div>
        </div>
      </div>

      <div
        style={{
          padding: "18px 20px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 10 }}>Sentiment index</div>
        <div
          style={{
            position: "relative",
            height: 10,
            borderRadius: 5,
            background: "linear-gradient(90deg, #fb7185 0%, #fbbf24 50%, #6ee7b7 100%)",
            opacity: 0.85,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `calc(${meterPos}% - 6px)`,
              top: -3,
              width: 12,
              height: 16,
              borderRadius: 4,
              background: "var(--text)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              border: "2px solid var(--bg)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.6875rem",
            color: "var(--muted)",
            marginTop: 8,
            fontFamily: "var(--mono)",
          }}
        >
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.55 }}>
          {snapshot.confidenceNote}
        </p>
      </div>

      <section style={{ marginBottom: 32 }}>
        <SectionTitle>At a glance</SectionTitle>
        <p style={{ margin: "-8px 0 16px", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>
          Grounded in your themes, ops tags, and attendee wording. With OpenAI configured, this block is rewritten for
          clarity while staying evidence-led.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          <HighlightColumn
            title="What went well"
            accent="var(--positive)"
            items={report.highlights.wentWell}
            empty="Nothing standout yet—collect richer text or more responses."
          />
          <HighlightColumn
            title="What can be improved"
            accent="var(--warning)"
            items={report.highlights.toImprove}
            empty="No mixed or operational nuggets tagged—try feedback that names flow, comms, or crowd control."
          />
          <HighlightColumn
            title="What’s not working"
            accent="var(--negative)"
            items={report.highlights.concerns}
            empty="No strong pain signals detected—if vibes felt off, probe for bar, door, or sound next time."
          />
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <SectionTitle>AI recommendations</SectionTitle>
            <p style={{ margin: "-8px 0 0", fontSize: "0.8125rem", color: "var(--muted)", maxWidth: 420, lineHeight: 1.45 }}>
              Priorities for the team. Refresh spins an alternate take (higher creativity when OpenAI is on).
            </p>
          </div>
          <button
            type="button"
            disabled={insightRefreshing}
            onClick={() => void handleRefreshInsights()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid rgba(110, 231, 183, 0.35)",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: insightRefreshing ? "wait" : "pointer",
              opacity: insightRefreshing ? 0.75 : 1,
            }}
          >
            {insightRefreshing ? "Refreshing…" : "✨ Refresh recommendations"}
          </button>
        </div>
        {insightRefreshError && (
          <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: 12 }}>{insightRefreshError}</p>
        )}
        <div
          style={{
            padding: "22px 22px 24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-strong)",
            background: `linear-gradient(165deg, rgba(110, 231, 183, 0.06), var(--bg-elevated))`,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <span
              style={{
                fontSize: "0.6875rem",
                fontFamily: "var(--mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 10px",
                borderRadius: 999,
                background: "var(--surface-2)",
                color: report.aiRecommendations.source === "openai" ? "var(--accent)" : "var(--muted)",
              }}
            >
              {report.aiRecommendations.source === "openai" ? "Model-assisted" : "Heuristic (no LLM)"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              Variant {report.aiRecommendations.variant} ·{" "}
              {new Date(report.aiRecommendations.refreshedAt).toLocaleString()}
            </span>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: "0.98rem", lineHeight: 1.6, color: "var(--text)" }}>
            {report.aiRecommendations.summary}
          </p>
          <ol
            style={{
              margin: 0,
              paddingLeft: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              color: "var(--text)",
              fontSize: "0.9375rem",
              lineHeight: 1.5,
            }}
          >
            {report.aiRecommendations.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <SectionTitle>What people talked about</SectionTitle>
        {report.themes.length === 0 ? (
          <p
            style={{
              color: "var(--muted)",
              padding: 20,
              borderRadius: "var(--radius)",
              border: "1px dashed var(--border)",
              margin: 0,
            }}
          >
            No themes yet. Run a few chats that mention sound, the bar, crowd, or lineup.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {report.themes.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "18px 20px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>{t.label}</span>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: skewColor(t.sentimentSkew),
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {skewLabel(t.sentimentSkew)} · ~{t.sharePercent}%
                  </span>
                </div>
                <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, t.sharePercent)}%`,
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${skewColor(t.sentimentSkew)}, var(--accent))`,
                      opacity: 0.9,
                    }}
                  />
                </div>
                {t.exampleParaphrases.length > 0 && (
                  <ul
                    style={{
                      margin: "14px 0 0",
                      padding: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {t.exampleParaphrases.map((ex, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--muted)",
                          paddingLeft: 14,
                          borderLeft: "3px solid var(--border-strong)",
                          lineHeight: 1.45,
                        }}
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 32 }}>
        <SectionTitle>Operations</SectionTitle>
        {report.operations.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>No bar, queue, or venue signals in the data yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {report.operations.map((o) => (
              <div
                key={o.tag}
                style={{
                  padding: "16px 18px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ textTransform: "capitalize" }}>{o.tag}</strong>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.75rem",
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "var(--bg)",
                      color: "var(--warning)",
                    }}
                  >
                    ×{o.count}
                  </span>
                </div>
                {o.examples[0] && (
                  <p style={{ margin: "12px 0 0", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5, fontStyle: "italic" }}>
                    “{o.examples[0]}”
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {(report.talentNotes.length > 0 || report.outlierSummaries.length > 0) && (
        <section style={{ marginBottom: 28 }}>
          <SectionTitle>Talent & outliers</SectionTitle>
          <div
            style={{
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {report.talentNotes.map((n, i) => (
              <div
                key={`t-${i}`}
                style={{
                  padding: "16px 18px",
                  fontSize: "0.9375rem",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                }}
              >
                {n}
              </div>
            ))}
            {report.outlierSummaries.map((n, i) => (
              <div
                key={`o-${i}`}
                style={{
                  padding: "16px 18px",
                  fontSize: "0.875rem",
                  color: "var(--danger)",
                  background: "rgba(248, 113, 113, 0.06)",
                  borderBottom: i < report.outlierSummaries.length - 1 ? "1px solid var(--border)" : undefined,
                }}
              >
                {n}
              </div>
            ))}
          </div>
        </section>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Link
          to={`/chat/${event.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 20px",
            borderRadius: 10,
            background: "var(--accent)",
            color: "#0c0d10",
            fontWeight: 600,
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}
        >
          Add another response
        </Link>
        <Link
          to="/organizer"
          style={{
            fontSize: "0.9375rem",
            color: "var(--muted)",
          }}
        >
          All events
        </Link>
      </div>
    </div>
  );
}
