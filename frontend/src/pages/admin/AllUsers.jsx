import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineRefresh, HiOutlineSearch, HiX } from "react-icons/hi";
import Layout from "../../components/Layout.jsx";
import { adminApi } from "../../services/api.js";

const ROLE_CLS = {
  admin:  "bg-blue-100 text-blue-700 border-blue-200",
  vendor: "bg-purple-100 text-purple-700 border-purple-200",
};
const STATUS_CLS = {
  verified:   "bg-green-100 text-green-700 border-green-200",
  unverified: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pending:    "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
};

function Badge({ label, cls }) {
  return (
    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize " + (cls || "bg-gray-100 text-gray-600 border-gray-200")}>
      {label}
    </span>
  );
}

function Sel({ value, onChange, children, w }) {
  return (
    <div className={"relative " + (w || "")}>
      <select value={value} onChange={onChange} className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function UserViewModal({ user, onClose }) {
  if (!user) return null;
  const fields = [
    ["Name", user.name],
    ["Email", user.email],
    ["Mobile", user.mobile || "—"],
    ["Role", user.role],
    ["Verification Status", user.verification_status || "unverified"],
    ["Account Status", user.is_active ? "Active" : "Inactive"],
    ["Registered On", user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—"],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">User Details</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
            <HiX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl flex-shrink-0">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-sm text-gray-800 font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewUser, setViewUser] = useState(null);
  const PER = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = { page, per_page: PER };
      if (roleFilter) p.role = roleFilter;
      const res = await adminApi.getUsers(p);
      const d = res?.data || res;
      const items = d?.items || d || [];
      setUsers(Array.isArray(items) ? items : []);
      setTotal(d?.total || items.length);
    } catch (err) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile?.includes(search))
    : users;

  const pages = Math.ceil(total / PER);

  const toggleActive = async (u) => {
    try {
      await adminApi.updateUserStatus(u.id, { is_active: !u.is_active });
      toast.success(!u.is_active ? "User activated" : "User deactivated");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total users</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Search name, email, mobile..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Sel value={roleFilter} onChange={e => { setRole(e.target.value); setPage(1); }} w="w-36">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
          </Sel>
          <button onClick={() => { setSearch(""); setRole(""); setPage(1); }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-50 shadow-sm transition">
            <HiOutlineRefresh className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-52">
              <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["#","Registered","Name","Email","Mobile","Role","Status","Active","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">No users found</td></tr>
                  ) : filtered.map((u, i) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{(page-1)*PER+i+1}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                        {timeAgo(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800 whitespace-nowrap">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.mobile || "—"}</td>
                      <td className="px-4 py-3"><Badge label={u.role} cls={ROLE_CLS[u.role]} /></td>
                      <td className="px-4 py-3"><Badge label={u.verification_status || "unverified"} cls={STATUS_CLS[u.verification_status] || STATUS_CLS.unverified} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(u)}
                          className={"relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors " + (u.is_active ? "bg-green-500" : "bg-gray-300")}
                          title={u.is_active ? "Deactivate" : "Activate"}
                        >
                          <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform " + (u.is_active ? "translate-x-4" : "translate-x-0")} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewUser(u)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-wrap gap-3">
              <span className="text-xs text-gray-500">Showing {(page-1)*PER+1}&#8211;{Math.min(page*PER,total)} of {total}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: pages }, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={"w-8 h-8 rounded-lg text-xs font-semibold border transition " + (p===page ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewUser && <UserViewModal user={viewUser} onClose={() => setViewUser(null)} />}
    </Layout>
  );
}
