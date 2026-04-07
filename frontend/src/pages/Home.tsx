import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvents, type EventRecord } from "../api";
import { getPointsBalance } from "../rewards";

type OpenAiHealth =
  | { status: "loading" }
  | { status: "ok"; model: string; reply?: string }
  | { status: "fail"; error: string };

export default function Home() {
  const [events, setEvents] = useState<EventRecord[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openAi, setOpenAi] = useState<OpenAiHealth>({ status: "loading" });
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const syncPoints = () => setPoints(getPointsBalance());
    syncPoints();
    window.addEventListener("gr-wallet-updated", syncPoints);
    return () => window.removeEventListener("gr-wallet-updated", syncPoints);
  }, []);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch((e) => setErr(String(e.message)));
  }, []);

  useEffect(() => {
    fetch("/api/health/openai")
      .then(async (r) => {
        const j = (await r.json()) as { ok?: boolean; model?: string; reply?: string; error?: string };
        if (j.ok) setOpenAi({ status: "ok", model: j.model || "?", reply: j.reply });
        else setOpenAi({ status: "fail", error: j.error || r.statusText });
      })
      .catch(() => setOpenAi({ status: "fail", error: "Could not reach API" }));
  }, []);

  if (err) {
    return (
      <div style={{ padding: 24, maxWidth: 560 }}>
        <p style={{ color: "var(--danger)" }}>{err}</p>
        <p style={{ color: "var(--muted)", fontSize: "0.9375rem" }}>
          Start the API: <code style={{ fontFamily: "var(--mono)" }}>cd backend && npm i && npm run dev</code>
        </p>
      </div>
    );
  }

  if (!events) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>
        Loading events…
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 20px", maxWidth: 720, margin: "0 auto" }}>
      <p style={{ margin: "0 0 12px", fontSize: "0.8125rem" }}>
        <Link to="/" style={{ color: "var(--muted)" }}>
          ← Landing
        </Link>
      </p>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 8px" }}>
        Simulate attendee feedback
      </h1>
      <p style={{ color: "var(--muted)", margin: "0 0 16px", maxWidth: 52 * 16 }}>
        Pick an event and chat through a short flow. Complete feedback to earn points, then redeem for vouchers on{" "}
        <Link to="/rewards">Rewards</Link>. Organizers see live reports in{" "}
        <Link to="/organizer">Organizer</Link>.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          padding: "12px 16px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border-strong)",
          background: "var(--bg-elevated)",
        }}
      >
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.9375rem", color: "var(--accent)", fontWeight: 600 }}>
          {points} pts
        </span>
        <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Your demo wallet</span>
        <Link
          to="/rewards"
          style={{
            marginLeft: "auto",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Redeem vouchers →
        </Link>
      </div>
      <p
        style={{
          fontSize: "0.875rem",
          margin: "-12px 0 24px",
          padding: "12px 14px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          fontFamily: "var(--mono)",
        }}
      >
        <strong style={{ fontFamily: "var(--font)", color: "var(--text)" }}>OpenAI</strong>
        {" — "}
        {openAi.status === "loading" && <span style={{ color: "var(--muted)" }}>checking…</span>}
        {openAi.status === "ok" && (
          <span style={{ color: "var(--accent)" }}>
            OK ({openAi.model}
            {openAi.reply ? ` · “${openAi.reply}”` : ""})
          </span>
        )}
        {openAi.status === "fail" && <span style={{ color: "var(--danger)" }}>{openAi.error}</span>}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
        {events.map((e) => (
          <li key={e.id}>
            <Link
              to={`/chat/${e.id}`}
              style={{
                display: "block",
                padding: "18px 20px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text)",
                textDecoration: "none",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ fontWeight: 600 }}>{e.name}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: 6 }}>
                {e.dateLabel} · {e.venue}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: 8 }}>
                {e.lineupSummary}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
