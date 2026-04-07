/** Demo wallet: balances persist in this browser via localStorage. */

const KEY_BALANCE = "gr_curated_points_balance";
const KEY_CREDITED_SESSIONS = "gr_curated_points_credited_sessions";
const KEY_VOUCHERS = "gr_curated_vouchers_issued";

export const POINTS_PER_COMPLETED_FEEDBACK = 75;

export interface VoucherTier {
  points: number;
  title: string;
  description: string;
}

export const VOUCHER_TIERS: VoucherTier[] = [
  {
    points: 200,
    title: "$5 drink voucher",
    description: "Redeem at partner bars on your next night out.",
  },
  {
    points: 500,
    title: "$15 merch credit",
    description: "Online or at select pop-ups / event stalls.",
  },
  {
    points: 1000,
    title: "$40 ticket credit",
    description: "Applied toward your next Buzo-curated ticket purchase.",
  },
];

export interface IssuedVoucher {
  code: string;
  tierPoints: number;
  title: string;
  issuedAt: string;
}

function readCredited(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY_CREDITED_SESSIONS);
    const arr = JSON.parse(raw || "[]") as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeCredited(ids: Set<string>) {
  localStorage.setItem(KEY_CREDITED_SESSIONS, JSON.stringify([...ids]));
}

export function getPointsBalance(): number {
  const n = Number(localStorage.getItem(KEY_BALANCE) || "0");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function setBalance(n: number) {
  localStorage.setItem(KEY_BALANCE, String(Math.max(0, Math.floor(n))));
}

/**
 * Award points once per completed feedback session id (prevents refresh double-count).
 */
export function creditCompletedFeedback(sessionId: string): {
  alreadyCredited: boolean;
  awarded: number;
  balance: number;
} {
  const credited = readCredited();
  if (credited.has(sessionId)) {
    return { alreadyCredited: true, awarded: 0, balance: getPointsBalance() };
  }
  credited.add(sessionId);
  writeCredited(credited);
  const balance = getPointsBalance() + POINTS_PER_COMPLETED_FEEDBACK;
  setBalance(balance);
  notifyWalletChanged();
  return {
    alreadyCredited: false,
    awarded: POINTS_PER_COMPLETED_FEEDBACK,
    balance,
  };
}

export function notifyWalletChanged() {
  window.dispatchEvent(new Event("gr-wallet-updated"));
}

export function getIssuedVouchers(): IssuedVoucher[] {
  try {
    const raw = localStorage.getItem(KEY_VOUCHERS);
    const arr = JSON.parse(raw || "[]") as IssuedVoucher[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveVouchers(list: IssuedVoucher[]) {
  localStorage.setItem(KEY_VOUCHERS, JSON.stringify(list));
}

function makeCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BZO-${part()}-${part()}`;
}

export function redeemTier(tier: VoucherTier): { ok: true; voucher: IssuedVoucher } | { ok: false; error: string } {
  const balance = getPointsBalance();
  if (balance < tier.points) {
    return { ok: false, error: `Need ${tier.points - balance} more points.` };
  }
  setBalance(balance - tier.points);
  const voucher: IssuedVoucher = {
    code: makeCode(),
    tierPoints: tier.points,
    title: tier.title,
    issuedAt: new Date().toISOString(),
  };
  const list = getIssuedVouchers();
  list.unshift(voucher);
  saveVouchers(list);
  notifyWalletChanged();
  return { ok: true, voucher };
}
