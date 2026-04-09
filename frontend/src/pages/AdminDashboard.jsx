import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { adminApi } from "../services/api.js";

/* ── palette ── */
const STAT_CARDS = [
  { key: "total_users",       label: "Total Users",        sub: "Registered accounts",   color: "#6366f1", bg: "#eef2ff", icon: UsersIcon },
  { key: "total_vendors",     label: "Total Vendors",      sub: "All vendor accounts",   color: "#0ea5e9", bg: "#e0f2fe", icon: BuildingIcon },
  { key: "verified_vendors",  label: "Verified Vendors",   sub: "Document verified",     color: "#10b981", bg: "#d1fae5", icon: CheckIcon },
  { key: "pending_vendors",   label: "Pending Vendors",    sub: "Awaiting verification", color: "#f59e0b", bg: "#fef3c7", icon: ClockIcon },
  { key: "total_products",    label: "Total Products",     sub: "Across all vendors",    color: "#8b5cf6", bg: "#ede9fe", icon: BoxIcon },
  { key: "total_categories",  label: "Total Categories",   sub: "Product categories",    color: "#ec4899", bg: "#fce7f3", icon: TagIcon },
];

const STATUS_STYLES = {
  active:    "bg-emerald-50 text-emerald-700",
  verified:  "bg-emerald-50 text-emerald-700",
  pending:   "bg-amber-50   text-amber-700",
  rejected:  "bg-rose-50    text-rose-700",
  inactive:  "bg-gray-100   text-gray-500",
};
const statusCls = (s) => STATUS_STYLES[(s || "").toLowerCase()] || "bg-blue-50 text-blue-700";

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [recentUsers, setUsers]     = useState([]);
  const [recentVendors, setVendors] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => {
        const d = res?.data || res;
        setStats(d);
        setUsers(d.recent_users   || []);
        setVendors(d.recent_vendors || []);
      })
      .catch((err) => toast.error(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const adminName = localStorage.getItem("vp_user_name") || "Admin";

  /* quick-action tiles */
  const quickActions = [
    { label: "Pending Vendors", desc: "Review & approve",  color: "#f59e0b", bg: "#fef3c7", path: "/admin/pending-vendors",  icon: ClockIcon },
    { label: "All Vendors",     desc: "Manage vendors",    color: "#0ea5e9", bg: "#e0f2fe", path: "/admin/vendors",           icon: BuildingIcon },
    { label: "All Users",       desc: "User management",   color: "#6366f1", bg: "#eef2ff", path: "/admin/users",             icon: UsersIcon },
    { label: "Categories",      desc: "Manage catalogue",  color: "#ec4899", bg: "#fce7f3", path: "/admin/categories",        icon: TagIcon },
  ];

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {adminName} 👋</h1>
            <p className="text-sm text-gray-400 mt-0.5">Here's what's happening on the platform today.</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_CARDS.map(({ key, label, sub, color, bg, icon: Icon }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.[key] ?? "—"}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(({ label, desc, color, bg, path, icon: Icon }) => (
              <button key={label} onClick={() => navigate(path)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tables row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Users */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <UsersIcon size={14} color="#6366f1" />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Recent Users</h2>
              </div>
              <button onClick={() => navigate("/admin/users")}
                className="text-xs text-indigo-600 font-medium hover:underline">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentUsers.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-xs">No recent users</td></tr>
                  ) : recentUsers.map((u, i) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                            {(u.name || "U")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-28">{u.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs truncate max-w-32">{u.email}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(u.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls(u.verification_status || u.status)}`}>
                          {u.verification_status || u.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Vendors */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                  <BuildingIcon size={14} color="#0ea5e9" />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Recent Vendors</h2>
              </div>
              <button onClick={() => navigate("/admin/vendors")}
                className="text-xs text-sky-600 font-medium hover:underline">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Company</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentVendors.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-xs">No recent vendors</td></tr>
                  ) : recentVendors.map((v, i) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/vendors/${v.id}`)}>
                      <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-600 flex-shrink-0">
                            {(v.company_name || v.name || "V")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 truncate max-w-28">{v.company_name || v.name || "—"}</p>
                            <p className="text-xs text-gray-400 truncate max-w-28">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(v.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls(v.status || v.verification_status)}`}>
                          {v.status || v.verification_status || "pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls(v.document_verify_status)}`}>
                          {v.document_verify_status || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

/* ── Inline SVG icon components (no extra deps) ── */
function UsersIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function BuildingIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function CheckIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
function ClockIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function BoxIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>
    </svg>
  );
}
function TagIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}
