import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";

/* ─── Color palette ─────────────────────────────────────────── */
const C = {
  blue:   { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet: { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald:{ bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:  { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
  rose:   { bg: "#fff1f2", text: "#e11d48", light: "#fecdd3" },
  cyan:   { bg: "#ecfeff", text: "#0891b2", light: "#cffafe" },
};

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

/* ─── Activity config by type ────────────────────────────────── */
const ACTIVITY_CFG = {
  order:   { color: C.blue,    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h6"/></svg> },
  payment: { color: C.emerald, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  rfq:     { color: C.violet,  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  support: { color: C.amber,   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
};

/* ─── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ label, value, icon, color, loading }) {
  const c = color || C.blue;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: c.bg, color: c.text }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium leading-tight mb-0.5">{label}</p>
        {loading
          ? <div className="w-8 h-6 bg-gray-100 rounded animate-pulse" />
          : <p className="text-2xl font-bold leading-tight" style={{ color: c.text }}>{value}</p>
        }
      </div>
    </div>
  );
}

/* ─── Summary Card (with colored header accent) ──────────────── */
function SummaryCard({ title, number, color, loading, children }) {
  const c = color || C.blue;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${c.light}`, background: c.bg }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.text }}>{title}</p>
        {loading
          ? <div className="w-8 h-6 bg-white/60 rounded animate-pulse" />
          : <p className="text-2xl font-bold" style={{ color: c.text }}>{number}</p>
        }
      </div>
      <div className="px-5 pb-4 pt-2">{children}</div>
    </div>
  );
}

/* ─── Section Card (plain white) ─────────────────────────────── */
function SectionCard({ title, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          {title && <p className="text-sm font-semibold text-gray-700">{title}</p>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Stat Row ───────────────────────────────────────────────── */
function StatRow({ label, value, muted, valueColor }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold" style={{ color: valueColor || (muted ? "#9ca3af" : "#374151") }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Chart Tooltip ──────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, colorMap }) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload || {};
  return (
    <div style={{ background: "#1e293b", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorMap?.[label] || "#6366f1", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>
          ₹ {Number(dataPoint.catalog_value || 0).toLocaleString("en-IN")}
        </span>
      </div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{dataPoint.products || 0} product{dataPoint.products !== 1 ? "s" : ""} listed</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function SellerDashboard() {
  const [dashData, setDashData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [chartType, setChartType] = useState("bar");

  const userName  = localStorage.getItem("vp_user_name")           || "Vendor";
  const userPhoto = localStorage.getItem("vp_user_photo")          || null;
  const verStatus = localStorage.getItem("vp_verification_status") || "";
  const docStatus = localStorage.getItem("vp_doc_verify_status")   || "";

  useEffect(() => {
    (async () => {
      try {
        const res = await vendorApi.getDashboard();
        setDashData(res.data || res);
      } catch (err) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const d = dashData || {};

  // ── Real data from DB ──────────────────────────────────────
  const totalProducts    = d.total_products    || 0;
  const activeProducts   = d.active_products   || 0;
  const inactiveProducts = d.inactive_products || 0;
  const draftProducts    = d.draft_products    || 0;
  const bestProducts     = d.best_products     || [];

  const totalLoans     = d.total_loans     || 0;
  const loansPending   = d.loans_pending   || 0;
  const loansApproved  = d.loans_approved  || 0;
  const loansDisbursed = d.loans_disbursed || 0;
  const loansRejected  = d.loans_rejected  || 0;

  const loyaltyPoints = d.loyalty_points ?? 0;
  const loyaltyTier   = d.loyalty_tier   || "Bronze";
  const loyaltySince  = d.loyalty_since  || null;

  // ── Demo data (no order/rfq/payment tables yet) ────────────
  const totalOrders       = d.total_orders          || 0;
  const totalRFQs         = d.total_rfqs            || 0;
  const paymentsCompleted = d.payments_completed    || 0;
  const paymentsPending   = d.payments_pending      || 0;
  const ordersInProgress  = d.orders_in_progress    || 0;
  const ordersCompleted   = d.orders_completed      || 0;
  const ordersRefunded    = d.orders_refunded       || 0;
  const rfqsPending       = d.rfqs_pending_response || 0;
  const rfqsBuyerPending  = d.rfqs_buyer_pending    || 0;
  const rfqsSuccessful    = d.rfqs_successful       || 0;
  const rfqsExpired       = d.rfqs_expired          || 0;
  const chartData         = d.chart_data            || [];
  const recentActivity    = d.recent_activity       || [];
  const totalShipments      = d.total_shipments      || 0;
  const shipmentsInTransit  = d.shipments_in_transit || 0;
  const shipmentsDelivered  = d.shipments_delivered  || 0;
  const shipmentsProcessing = d.shipments_processing || 0;
  const topDestinations     = d.top_destinations     || [];

  const fmt = n => `₹ ${Number(n).toLocaleString("en-IN")}`;

  const ob = d.onboarding || {};
  const obSteps = [
    { label: "Core Details",           done: ob.core_details,       link: "/vendor/profile" },
    { label: "All Documents Uploaded", done: ob.documents_uploaded, link: "/vendor/documents" },
    { label: "Business Details",       done: ob.business_details,   link: "/vendor/documents?tab=business" },
  ];
  const obDone = obSteps.filter(s => s.done).length;
  const obPct  = Math.round((obDone / obSteps.length) * 100);

  const docIncomplete     = docStatus !== "verified";
  const profileIncomplete = !ob.core_details || !ob.business_details;
  const totalCatalogValue = chartData.reduce((s, m) => s + (m.catalog_value || 0), 0);
  const totalProductsListed = chartData.reduce((s, m) => s + (m.products || 0), 0);
  const colorMap          = Object.fromEntries(chartData.map((d, i) => [d.month, BAR_COLORS[i % BAR_COLORS.length]]));

  /* Verification badge colors */
  const verBadge = verStatus === "verified"
    ? { bg: C.emerald.bg, text: C.emerald.text, border: C.emerald.light, label: "✓ Verified" }
    : verStatus === "rejected"
    ? { bg: C.rose.bg, text: C.rose.text, border: C.rose.light, label: "✗ Rejected" }
    : { bg: C.amber.bg, text: C.amber.text, border: C.amber.light, label: "⏳ Pending Verification" };

  const docBadge = docStatus === "verified"
    ? { bg: C.emerald.bg, text: C.emerald.text, border: C.emerald.light, label: "Docs ✓ Verified" }
    : ob.documents_uploaded
    ? { bg: C.blue.bg,    text: C.blue.text,    border: C.blue.light,    label: "Docs Uploaded" }
    : { bg: C.amber.bg,   text: C.amber.text,   border: C.amber.light,   label: "Docs Incomplete" };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Page Title ── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Welcome back, <span className="font-medium text-gray-600">{userName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/vendor/profile"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition"
              style={{ color: C.blue.text, borderColor: C.blue.light, background: C.blue.bg }}>
              Complete Profile
            </Link>
            <Link to="/vendor/loans"
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition"
              style={{ background: C.violet.text }}>
              Apply for Credit
            </Link>
          </div>
        </div>

        {/* ── Alert Banners ── */}
        {(docIncomplete || profileIncomplete) && (
          <div className="space-y-2">
            {docIncomplete && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 border"
                style={{ background: C.amber.bg, borderColor: C.amber.light }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: C.amber.light, color: C.amber.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                </div>
                <p className="text-xs flex-1" style={{ color: C.amber.text }}>
                  <span className="font-semibold">Document verification incomplete.</span>{" "}
                  Upload required documents to activate your account.
                </p>
                <Link to="/vendor/documents"
                  className="text-xs font-bold whitespace-nowrap"
                  style={{ color: C.amber.text }}>Upload →</Link>
              </div>
            )}
            {profileIncomplete && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 border"
                style={{ background: C.blue.bg, borderColor: C.blue.light }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: C.blue.light, color: C.blue.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <p className="text-xs flex-1" style={{ color: C.blue.text }}>
                  <span className="font-semibold">Profile setup incomplete.</span>{" "}
                  Complete your business details to unlock all features.
                </p>
                <Link to="/vendor/profile"
                  className="text-xs font-bold whitespace-nowrap"
                  style={{ color: C.blue.text }}>Complete →</Link>
              </div>
            )}
          </div>
        )}

        {/* ── Welcome / Onboarding Card ── */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ background: C.blue.bg, border: `2px solid ${C.blue.light}` }}>
                {userPhoto
                  ? <img src={userPhoto} alt="profile" className="w-full h-full object-cover" />
                  : <span className="font-bold text-lg" style={{ color: C.blue.text }}>{userName.charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{userName}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ background: verBadge.bg, color: verBadge.text, borderColor: verBadge.border }}>
                    {verBadge.label}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ background: docBadge.bg, color: docBadge.text, borderColor: docBadge.border }}>
                    {docBadge.label}
                  </span>
                </div>
              </div>
            </div>

            {d.onboarding && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-400">Profile Completion</p>
                  <p className="text-xs font-bold ml-6" style={{ color: C.violet.text }}>{obPct}%</p>
                </div>
                <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${obPct}%`, background: `linear-gradient(90deg, ${C.violet.text}, ${C.blue.text})` }} />
                </div>
              </div>
            )}
          </div>

          {d.onboarding && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {obSteps.map((step, i) => (
                <Link key={step.label} to={step.link}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition"
                  style={step.done
                    ? { background: C.emerald.bg, borderColor: C.emerald.light, color: C.emerald.text }
                    : { background: "#fafafa", borderColor: "#e5e7eb", borderStyle: "dashed", color: "#9ca3af" }}>
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: step.done ? C.emerald.text : "#d1d5db" }}>
                    {step.done ? "✓" : i + 1}
                  </span>
                  <span className="flex-1">{step.label}</span>
                  {!step.done && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: C.amber.bg, color: C.amber.text }}>Pending</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── 3 KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Orders In Progress" value={ordersInProgress} loading={loading} color={C.blue}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h6"/></svg>}
          />
          <KpiCard
            label="Quotes Pending (Your Reply)" value={rfqsPending} loading={loading} color={C.amber}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>}
          />
          <KpiCard
            label="Buyer Acceptance Pending" value={rfqsBuyerPending} loading={loading} color={C.violet}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
          />
        </div>

        {/* ── Revenue Chart + Recent Activity ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Chart */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.violet.text }}>Catalogue Activity</p>
                  {loading
                    ? <div className="w-32 h-7 bg-gray-100 rounded animate-pulse" />
                    : <p className="text-2xl font-bold text-gray-900 leading-tight">{fmt(totalCatalogValue)}</p>
                  }
                  <p className="text-xs text-gray-400 mt-0.5">{totalProductsListed} products listed · last 6 months</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                  {[["bar", "Bar"], ["area", "Area"]].map(([t, lbl]) => (
                    <button key={t} onClick={() => setChartType(t)}
                      className="px-3 py-1 text-xs font-semibold rounded-md transition"
                      style={chartType === t
                        ? { background: C.violet.text, color: "#fff" }
                        : { color: "#9ca3af" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-2 pt-3 pb-4">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.violet.text }} />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <p className="text-xs text-gray-400">No catalogue data available yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={192}>
                  {chartType === "bar" ? (
                    <BarChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }} barSize={28}>
                      <defs>
                        {chartData.map((_, idx) => (
                          <linearGradient key={idx} id={`barG${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={BAR_COLORS[idx % BAR_COLORS.length]} stopOpacity={1} />
                            <stop offset="100%" stopColor={BAR_COLORS[idx % BAR_COLORS.length]} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={4} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={36} />
                      <Tooltip content={<ChartTooltip colorMap={colorMap} />} cursor={{ fill: "#f8fafc", radius: 4 }} />
                      <Bar dataKey="catalog_value" name="Catalog Value" radius={[5, 5, 0, 0]}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={`url(#barG${idx})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={4} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={36} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="catalog_value" name="Catalog Value" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaFill)"
                        dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            {!loading && chartData.length > 0 && (
              <div className="px-5 pb-4 border-t border-gray-50 pt-3 flex items-center justify-between">
                {chartData.map((m, idx) => (
                  <div key={m.month} className="text-center flex-1">
                    <p className="text-xs font-bold" style={{ color: BAR_COLORS[idx % BAR_COLORS.length] }}>{m.products}</p>
                    <p className="text-xs text-gray-400">{m.month}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700">Recent Activity</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ background: C.blue.bg, color: C.blue.text, borderColor: C.blue.light }}>
                {recentActivity.length} events
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2"
              style={{ maxHeight: 340, scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
              {loading ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.blue.text }} />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-12 text-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  <p className="text-xs text-gray-400">No activity yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gray-100" />
                  <div className="space-y-0">
                    {recentActivity.map((item, i) => {
                      const cfg = ACTIVITY_CFG[item.type] || ACTIVITY_CFG.order;
                      const inner = (
                        <>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 z-10 mt-0.5"
                            style={{ background: cfg.color.bg, color: cfg.color.text }}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-gray-800 leading-tight group-hover:underline">{item.title}</p>
                              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">{item.time}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.desc}</p>
                          </div>
                          {item.link && (
                            <svg className="w-3 h-3 text-gray-300 flex-shrink-0 mt-1 group-hover:text-gray-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          )}
                        </>
                      );
                      return item.link ? (
                        <Link key={i} to={item.link}
                          className="group flex gap-3 py-2.5 relative rounded-lg px-1 -mx-1 hover:bg-gray-50 transition-colors cursor-pointer">
                          {inner}
                        </Link>
                      ) : (
                        <div key={i} className="flex gap-3 py-2.5 relative">
                          {inner}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-400">Scroll to see older activity</p>
            </div>
          </div>
        </div>

        {/* ── Your Summary — 4 stat cards ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Your Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            <SummaryCard title="Total RFQs" number={totalRFQs} color={C.violet} loading={loading}>
              <StatRow label="Your response pending" value={rfqsPending}      valueColor={rfqsPending      ? C.amber.text : undefined} />
              <StatRow label="Buyer response pending" value={rfqsBuyerPending} valueColor={rfqsBuyerPending ? C.blue.text  : undefined} />
              <StatRow label="Successful"             value={rfqsSuccessful}  valueColor={rfqsSuccessful  ? C.emerald.text : undefined} />
              <StatRow label="Expired"                value={rfqsExpired}     muted />
            </SummaryCard>

            <SummaryCard title="Total Orders" number={totalOrders} color={C.blue} loading={loading}>
              <StatRow label="In progress"       value={ordersInProgress} valueColor={ordersInProgress ? C.blue.text    : undefined} />
              <StatRow label="Completed"         value={ordersCompleted}  valueColor={ordersCompleted  ? C.emerald.text : undefined} />
              <StatRow label="Refunded/Disputed" value={ordersRefunded}   muted />
            </SummaryCard>

            <SummaryCard title="Total Payments" number={fmt(paymentsCompleted)} color={C.emerald} loading={loading}>
              <StatRow label="Completed" value={fmt(paymentsCompleted)} valueColor={C.emerald.text} />
              <StatRow label="Pending"   value={fmt(paymentsPending)}   valueColor={paymentsPending ? C.amber.text : undefined} muted={!paymentsPending} />
            </SummaryCard>

            <SummaryCard title="Active SKUs" number={activeProducts} color={C.amber} loading={loading}>
              <StatRow label="Active"   value={activeProducts}   valueColor={activeProducts   ? C.amber.text   : undefined} />
              <StatRow label="Inactive" value={inactiveProducts} valueColor={inactiveProducts ? C.rose.text    : undefined} muted={!inactiveProducts} />
              <StatRow label="Draft"    value={draftProducts}    valueColor={draftProducts    ? C.violet.text  : undefined} muted={!draftProducts} />
            </SummaryCard>
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          <SectionCard title="All Shipments"
            action={<Link to="/vendor/logistics" className="text-xs font-semibold" style={{ color: C.cyan.text }}>View All →</Link>}>
            <div className="px-5 py-3">
              {loading ? (
                <div className="py-3 flex justify-center">
                  <div className="animate-spin w-5 h-5 rounded-full border-2 border-gray-100" style={{ borderTopColor: C.cyan.text }} />
                </div>
              ) : totalShipments === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No shipments yet</p>
              ) : (
                <>
                  <StatRow label="Total Shipments" value={totalShipments} valueColor={C.cyan.text} />
                  <StatRow label="In Transit"      value={shipmentsInTransit}  valueColor={shipmentsInTransit  ? C.blue.text    : undefined} muted={!shipmentsInTransit} />
                  <StatRow label="Delivered"       value={shipmentsDelivered}  valueColor={shipmentsDelivered  ? C.emerald.text : undefined} muted={!shipmentsDelivered} />
                  <StatRow label="Processing"      value={shipmentsProcessing} valueColor={shipmentsProcessing ? C.amber.text   : undefined} muted={!shipmentsProcessing} />
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Your Inventory">
            <div className="px-5 py-3">
              <StatRow label="Active SKUs"      value={activeProducts}   valueColor={activeProducts   ? C.amber.text  : undefined} />
              <StatRow label="Inactive"         value={inactiveProducts} valueColor={inactiveProducts ? C.rose.text   : undefined} muted={!inactiveProducts} />
              <StatRow label="Draft / Unpublished" value={draftProducts} valueColor={draftProducts    ? C.violet.text : undefined} muted={!draftProducts} />
              <StatRow label="Total SKUs"       value={totalProducts}    valueColor={totalProducts    ? C.blue.text   : undefined} muted={!totalProducts} />
            </div>
          </SectionCard>

          <SectionCard title="Top Active Products">
            <div className="px-5 py-3">
              {loading ? (
                <div className="py-3 flex justify-center">
                  <div className="animate-spin w-5 h-5 rounded-full border-2 border-gray-100" style={{ borderTopColor: C.amber.text }} />
                </div>
              ) : bestProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No active products yet</p>
              ) : (
                bestProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-700 font-medium truncate max-w-[140px]">{p.name}</span>
                    <span className="text-xs font-semibold" style={{ color: C.amber.text }}>{p.amount}</span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Loan Applications"
            action={<Link to="/vendor/loans" className="text-xs font-semibold" style={{ color: C.blue.text }}>Apply →</Link>}>
            <div className="px-5 py-3">
              {loading ? (
                <div className="py-3 flex justify-center">
                  <div className="animate-spin w-5 h-5 rounded-full border-2 border-gray-100" style={{ borderTopColor: C.blue.text }} />
                </div>
              ) : totalLoans === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No loan applications yet</p>
              ) : (
                <>
                  <StatRow label="Total Applications" value={totalLoans}    valueColor={C.blue.text} />
                  <StatRow label="Pending Review"      value={loansPending}  valueColor={loansPending  ? C.amber.text   : undefined} muted={!loansPending} />
                  <StatRow label="Approved"            value={loansApproved} valueColor={loansApproved ? C.emerald.text  : undefined} muted={!loansApproved} />
                  <StatRow label="Disbursed"           value={loansDisbursed} valueColor={loansDisbursed ? C.violet.text : undefined} muted={!loansDisbursed} />
                  {loansRejected > 0 && <StatRow label="Rejected" value={loansRejected} muted />}
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Loyalty & Rewards">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl font-bold text-gray-900">{loyaltyPoints.toLocaleString()}</span>
                <span className="text-xs text-gray-400">Jigi Points</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: loyaltyTier === "Platinum" ? C.blue.bg : loyaltyTier === "Gold" ? C.amber.bg : loyaltyTier === "Silver" ? "#f8fafc" : C.amber.bg,
                    color:      loyaltyTier === "Platinum" ? C.blue.text : loyaltyTier === "Gold" ? C.amber.text : loyaltyTier === "Silver" ? "#64748b" : "#b45309",
                    border:     `1px solid ${loyaltyTier === "Platinum" ? C.blue.light : C.amber.light}`,
                  }}>
                  {loyaltyTier}
                </span>
                {loyaltySince && <span className="text-xs text-gray-400">since {loyaltySince}</span>}
              </div>
              <Link to="/vendor/rewards"
                className="inline-block text-xs font-semibold transition"
                style={{ color: C.violet.text }}>
                View Rewards →
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Top Delivery Destinations">
            <div className="px-5 py-3">
              {loading ? (
                <div className="py-3 flex justify-center">
                  <div className="animate-spin w-5 h-5 rounded-full border-2 border-gray-100" style={{ borderTopColor: C.cyan.text }} />
                </div>
              ) : topDestinations.length === 0 ? (
                <div className="py-3 flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.cyan.text} strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <p className="text-xs text-gray-400">No shipments yet</p>
                </div>
              ) : (
                topDestinations.map((dest, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.cyan.text} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="text-xs text-gray-700 truncate">{dest.name}</span>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: C.cyan.text }}>
                      {dest.count} {dest.count === 1 ? "shipment" : "shipments"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

        </div>
      </div>
    </Layout>
  );
}
