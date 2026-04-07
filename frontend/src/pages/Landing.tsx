import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: "rgba(12, 13, 16, 0.88)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
          Buzo · Feedback lab
        </span>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="#what-it-does"
            style={{ fontSize: "0.875rem", color: "var(--muted)" }}
          >
            What it does
          </a>
          <a
            href="#who-its-for"
            style={{ fontSize: "0.875rem", color: "var(--muted)" }}
          >
            Who it’s for
          </a>
          <Link
            to="/events"
            style={{
              padding: "9px 16px",
              borderRadius: 9,
              background: "var(--accent)",
              color: "#0c0d10",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Enter the app
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <section
          style={{
            padding: "clamp(48px, 10vw, 96px) 22px 64px",
            maxWidth: 920,
            margin: "0 auto",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--accent)",
              fontWeight: 600,
              margin: "0 0 16px",
            }}
          >
            Conversational post-event feedback
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.12,
              margin: "0 0 20px",
              letterSpacing: "-0.03em",
              maxWidth: 18 * 32,
            }}
          >
            Turn quick chats into clear insight—and reward people for showing up with their honest take.
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--muted)",
              lineHeight: 1.65,
              margin: "0 0 32px",
              maxWidth: 36 * 16,
            }}
          >
            This demo simulates a Telegram-style feedback agent: attendees answer in plain language, you get structured
            themes and AI-assisted recommendations for promoters, plus a lightweight points-to-vouchers loop on the side.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Link
              to="/events"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 24px",
                borderRadius: 11,
                background: "var(--accent)",
                color: "#0c0d10",
                fontWeight: 600,
                fontSize: "0.97rem",
                textDecoration: "none",
              }}
            >
              Open the demo
            </Link>
            <Link
              to="/organizer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 22px",
                borderRadius: 11,
                border: "1px solid var(--border-strong)",
                color: "var(--text)",
                fontWeight: 600,
                fontSize: "0.97rem",
                textDecoration: "none",
                background: "var(--bg-elevated)",
              }}
            >
              Jump to organizer view
            </Link>
          </div>
        </section>

        <section
          id="what-it-does"
          style={{
            padding: "56px 22px 64px",
            borderTop: "1px solid var(--border)",
            background: "linear-gradient(180deg, var(--surface-2) 0%, var(--bg) 45%)",
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                margin: "0 0 10px",
              }}
            >
              What this app does
            </h2>
            <p style={{ color: "var(--muted)", margin: "0 0 32px", maxWidth: 38 * 16, lineHeight: 1.55 }}>
              Built around the idea that people say more in a short chat than in a form—and organizers still need signal
              they can act on.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  title: "Natural feedback",
                  body: "A guided conversation after the night: overall vibe, sound, bar and door friction—without form fatigue.",
                },
                {
                  title: "Promoter-ready reports",
                  body: "Themes, sentiment, ops tags, and at-a-glance buckets: what went well, what to improve, and what’s off.",
                },
                {
                  title: "AI recommendations",
                  body: "Model-assisted priorities and tactics when your API key is set—refresh for alternate angles on the same data.",
                },
                {
                  title: "Points & vouchers (demo)",
                  body: "Attendees collect points for completing feedback in this browser demo, then redeem toward sample voucher tiers.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    padding: "22px 20px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 10px" }}>{card.title}</h3>
                  <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--muted)", lineHeight: 1.55 }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="who-its-for" style={{ padding: "56px 22px 72px", maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 24px" }}>
            Two sides of the same night
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div
              style={{
                padding: "24px 22px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-strong)",
                background: `linear-gradient(145deg, var(--bg-elevated), var(--surface-2))`,
              }}
            >
              <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.8125rem", marginBottom: 10 }}>
                Attendees
              </div>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                Pick an event, chat through a short flow, earn points in the demo wallet, and redeem toward vouchers on
                the Rewards page.
              </p>
            </div>
            <div
              style={{
                padding: "24px 22px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-strong)",
                background: `linear-gradient(145deg, var(--bg-elevated), var(--surface-2))`,
              }}
            >
              <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.8125rem", marginBottom: 10 }}>
                Organizers
              </div>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                Open the dashboard for per-event intelligence: completion, sentiment, themes, and refreshable AI
                recommendations grounded in what people actually typed.
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: "40px 22px 56px",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
            background: "var(--bg-elevated)",
          }}
        >
          <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: "0.9375rem" }}>
            Ready to try the flow? Data in this demo stays in memory on the server; points and vouchers use your browser
            only.
          </p>
          <Link
            to="/events"
            style={{
              display: "inline-flex",
              padding: "14px 28px",
              borderRadius: 11,
              background: "var(--accent)",
              color: "#0c0d10",
              fontWeight: 600,
              fontSize: "0.97rem",
              textDecoration: "none",
            }}
          >
            Enter the app
          </Link>
        </section>
      </main>

      <footer
        style={{
          padding: "18px 22px",
          borderTop: "1px solid var(--border)",
          fontSize: "0.8125rem",
          color: "var(--muted)",
          textAlign: "center",
        }}
      >
        Feedback lab demo · Not production data
      </footer>
    </div>
  );
}
