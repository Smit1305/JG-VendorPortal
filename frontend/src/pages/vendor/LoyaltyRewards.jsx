import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";

/* ── Design system colors ── */
const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

/* ── Tier color helpers ── */
const TIER_COLORS = { Bronze: "#b45309", Silver: "#64748b", Gold: "#d97706", Platinum: "#2563eb" };
const TIER_BGS    = { Bronze: "#fffbeb", Silver: "#f8fafc", Gold: "#fefce8", Platinum: "#eff6ff" };
const tierColor = (name) => TIER_COLORS[name] || "#2563eb";
const tierBg    = (name) => TIER_BGS[name]    || "#eff6ff";

const TIERS = [
  { name: "Bronze",   min: 0,     max: 999,      benefits: ["Basic support", "Standard payment terms", "Access to all categories"] },
  { name: "Silver",   min: 1000,  max: 4999,     benefits: ["Priority support", "Net 45 payment terms", "Featured listing", "5% commission discount"] },
  { name: "Gold",     min: 5000,  max: 19999,    benefits: ["Dedicated account manager", "Net 60 payment terms", "Top featured listing", "10% commission discount", "Early access to RFQs"] },
  { name: "Platinum", min: 20000, max: Infinity, benefits: ["VIP support 24/7", "Net 90 payment terms", "Premium placement", "15% commission discount", "Exclusive RFQ access", "Annual awards recognition"] },
];

/* ── Inline SVGs ── */
const SvgBadge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const SvgStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const SvgCheck = () => (
  <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);
const SvgGift = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
  </svg>
);
const SvgPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SvgMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SvgX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function LoyaltyRewards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeemModal, setRedeemModal] = useState({ open: false, reward: null });
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await vendorApi.getRewards();
        setData(res.data || res);
      } catch (err) {
        toast.error(err.message || "Failed to load rewards");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRedeem = async () => {
    if (!redeemModal.reward) return;
    setRedeeming(true);
    try {
      const res = await vendorApi.redeemReward(redeemModal.reward.id);
      toast.success(res.message || "Reward redeemed successfully!");
      setRedeemModal({ open: false, reward: null });
      // Deduct points locally until next refresh
      setData((prev) => prev ? { ...prev, points: prev.points - redeemModal.reward.points } : prev);
    } catch (err) {
      toast.error(err.message || "Failed to redeem reward");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-6 h-6 rounded-full border-2 border-gray-200 border-t-blue-500 mx-auto" />
        </div>
      </Layout>
    );
  }

  const points = data?.points ?? 0;
  const history = data?.history ?? [];
  const rewards = data?.available_rewards ?? [];
  const currentTier = TIERS.find((t) => points >= t.min && points <= t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Loyalty Rewards</h1>
            <p className="text-xs text-gray-400 mt-0.5">Earn points, climb tiers, and redeem exclusive rewards</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: C.emerald.bg, color: C.emerald.text }}>
            ● Live
          </span>
        </div>

        {/* Tier Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Colored accent top bar */}
          <div className="h-1.5" style={{ background: tierColor(currentTier.name) }} />
          <div className="px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: tierBg(currentTier.name), color: tierColor(currentTier.name) }}
                >
                  <SvgBadge />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Current Tier</p>
                  <p className="text-2xl font-bold text-gray-900">{currentTier.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Member since {data?.member_since || "2026"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Points</p>
                <p className="text-3xl font-bold" style={{ color: C.blue.text }}>{points.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Jigi Points</p>
              </div>
            </div>
            {nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{currentTier.name}</span>
                  <span>{nextTier.name} — {(nextTier.min - points).toLocaleString()} pts away</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(progressToNext, 100)}%`, background: tierColor(currentTier.name) }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Tier Benefits</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="rounded-xl border p-4"
                style={{
                  borderColor: tier.name === currentTier.name ? tierColor(tier.name) : "#f3f4f6",
                  background: tier.name === currentTier.name ? tierBg(tier.name) : "#fafafa",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: tierBg(tier.name), color: tierColor(tier.name) }}
                  >
                    <SvgStar />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight" style={{ color: tierColor(tier.name) }}>{tier.name}</p>
                    <p className="text-xs text-gray-400">{tier.min === 0 ? "0" : tier.min.toLocaleString()}+ pts</p>
                  </div>
                  {tier.name === currentTier.name && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: C.blue.bg, color: C.blue.text }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {tier.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span style={{ color: C.emerald.text }}>
                        <SvgCheck />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem Rewards */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Redeem Rewards</p>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: C.emerald.bg, color: C.emerald.text }}
            >
              {points.toLocaleString()} pts available
            </span>
          </div>
          <div className="p-5">
            {rewards.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No rewards available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward, i) => {
                  const colors = [C.amber, C.violet, C.blue, C.emerald];
                  const c = colors[i % colors.length];
                  const canRedeem = points >= reward.points;
                  return (
                    <div
                      key={reward.id}
                      className="rounded-xl border border-gray-100 p-4 flex items-start gap-3"
                      style={{ background: c.bg }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm"
                        style={{ color: c.text }}
                      >
                        <SvgGift />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{reward.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 mb-2">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold" style={{ color: c.text }}>{reward.points} pts</span>
                          <button
                            onClick={() => setRedeemModal({ open: true, reward })}
                            disabled={!canRedeem}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
                            style={
                              canRedeem
                                ? { background: c.text, color: "#fff" }
                                : { background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }
                            }
                          >
                            {canRedeem ? "Redeem" : "Need More Pts"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Points History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Points History</p>
          </div>
          <div className="px-5 py-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No history yet</p>
            ) : (
              history.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: item.type === "earned" ? C.emerald.bg : "#fff1f2",
                        color: item.type === "earned" ? C.emerald.text : "#e11d48",
                      }}
                    >
                      {item.type === "earned" ? <SvgPlus /> : <SvgMinus />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.event}</p>
                      <p className="text-xs text-gray-400">{item.date}</p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: item.type === "earned" ? C.emerald.text : "#e11d48" }}
                  >
                    {item.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Redeem Modal */}
      {redeemModal.open && redeemModal.reward && (() => {
        const colors = [C.amber, C.violet, C.blue, C.emerald];
        const rewardIdx = rewards.findIndex(r => r.id === redeemModal.reward.id);
        const mc = colors[rewardIdx >= 0 ? rewardIdx % colors.length : 0];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="h-1" style={{ background: mc.text }} />
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Confirm Redemption</h3>
                <button
                  onClick={() => setRedeemModal({ open: false, reward: null })}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <SvgX />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600">
                  Redeem <strong>{redeemModal.reward.name}</strong> for{" "}
                  <strong style={{ color: mc.text }}>{redeemModal.reward.points} points</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Remaining balance:{" "}
                  <strong>{(points - (redeemModal.reward.points || 0)).toLocaleString()} pts</strong>
                </p>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setRedeemModal({ open: false, reward: null })}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
                  style={{ background: C.blue.text }}
                >
                  {redeeming ? "Redeeming..." : "Confirm Redeem"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}
