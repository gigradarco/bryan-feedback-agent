import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getIssuedVouchers,
  getPointsBalance,
  POINTS_PER_COMPLETED_FEEDBACK,
  redeemTier,
  VOUCHER_TIERS,
  type IssuedVoucher,
  type VoucherTier,
} from "../rewards";

export default function Rewards() {
  const [balance, setBalance] = useState(0);
  const [vouchers, setVouchers] = useState<IssuedVoucher[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setBalance(getPointsBalance());
    setVouchers(getIssuedVouchers());
  }, []);

  useEffect(() => {
    refresh();
    const onWallet = () => refresh();
    window.addEventListener("gr-wallet-updated", onWallet);
    return () => window.removeEventListener("gr-wallet-updated", onWallet);
  }, [refresh]);

  function onRedeem(tier: VoucherTier) {
    const r = redeemTier(tier);
    if (!r.ok) {
      setToast(r.error);
      return;
    }
    setToast(`Voucher issued: ${r.voucher.code}`);
    refresh();
  }

  const nextTier = VOUCHER_TIERS.find((t) => balance < t.points);
  const progressTarget = nextTier?.points ?? VOUCHER_TIERS[VOUCHER_TIERS.length - 1]!.points;
  const progressPct = Math.min(100, (balance / progressTarget) * 100);

  return (
    <div style={{ padding: "28px 18px 48px", maxWidth: 720, margin: "0 auto" }}>
      <Link to="/events" style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
        ← Events
      </Link>

      <header style={{ marginTop: 18, marginBottom: 28 }}>
        <div
          style={{
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--accent)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Buzo rewards
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 10px" }}>Points & vouchers</h1>
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.55, maxWidth: 520 }}>
          Finish post-event feedback to earn points. Stack them and convert to real vouchers when you hit a tier—demo
          wallet stored in this browser only.
        </p>
      </header>

      <div
        style={{
          padding: "22px 22px 24px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-strong)",
          background: `linear-gradient(165deg, var(--surface-2), var(--bg-elevated))`,
          boxShadow: `0 0 0 1px var(--accent-glow) inset`,
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: 6 }}>Your balance</div>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--accent)" }}>
          {balance}
          <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--muted)", marginLeft: 8 }}>pts</span>
        </div>
        {nextTier && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: 8 }}>
              <span>Next unlock</span>
              <span>
                {nextTier.points} pts · {nextTier.title}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: "linear-gradient(90deg, var(--accent), #34d399)",
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <section style={{ marginBottom: 32 }}>
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
          How you earn
        </h2>
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            fontSize: "0.9375rem",
            lineHeight: 1.55,
            color: "var(--muted)",
          }}
        >
          <strong style={{ color: "var(--text)" }}>Complete a feedback chat</strong> after an event →{" "}
          <span style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>+{POINTS_PER_COMPLETED_FEEDBACK} pts</span>{" "}
          (once per chat). More events you weigh in on, faster you unlock vouchers.
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
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
          Redeem for vouchers
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {VOUCHER_TIERS.map((tier) => {
            const canRedeem = balance >= tier.points;
            return (
              <li
                key={tier.points}
                style={{
                  padding: "18px 20px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1.0625rem" }}>{tier.title}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: 6, maxWidth: 400 }}>{tier.description}</div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: canRedeem ? "var(--accent)" : "var(--muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tier.points} pts
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!canRedeem}
                  onClick={() => onRedeem(tier)}
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    fontWeight: 600,
                    cursor: canRedeem ? "pointer" : "not-allowed",
                    background: canRedeem ? "var(--accent)" : "var(--surface-2)",
                    color: canRedeem ? "#0c0d10" : "var(--muted)",
                  }}
                >
                  {canRedeem ? "Redeem (demo)" : `Need ${tier.points - balance} more pts`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {vouchers.length > 0 && (
        <section style={{ marginBottom: 24 }}>
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
            Your issued codes
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {vouchers.map((v) => (
              <li
                key={v.code + v.issuedAt}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-strong)",
                  background: "var(--surface-2)",
                  fontFamily: "var(--mono)",
                  fontSize: "0.8125rem",
                }}
              >
                <div style={{ color: "var(--accent)", fontWeight: 600 }}>{v.code}</div>
                <div style={{ color: "var(--muted)", marginTop: 6 }}>
                  {v.title} · {new Date(v.issuedAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toast && (
        <p
          style={{
            fontSize: "0.875rem",
            color: toast.startsWith("Need") || toast.includes("more points") ? "var(--danger)" : "var(--accent)",
            marginTop: 8,
          }}
        >
          {toast}
        </p>
      )}
    </div>
  );
}
