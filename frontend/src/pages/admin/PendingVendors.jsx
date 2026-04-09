import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineRefresh, HiOutlineSearch } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import { adminApi } from "../../services/api.js";

const DS = {
  verified: "bg-green-100 text-green-700 border-green-200",
  pending:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  resubmit: "bg-orange-100 text-orange-700 border-orange-200",
};

const TABS = [
  { key: "pending",  label: "Pending",   color: "text-yellow-700 border-yellow-400 bg-yellow-50" },
  { key: "rejected", label: "Rejected",  color: "text-red-700 border-red-400 bg-red-50" },
  { key: "resubmit", label: "Resubmit",  color: "text-orange-700 border-orange-400 bg-orange-50" },
];

function Badge({ label, cls }) {
  return (
    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize " + (cls || "bg-gray-100 text-gray-600 border-gray-200")}>
      {label}
    </span>
  );
}

export default function PendingVendors() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, rejected: 0, resubmit: 0 });
  const [modal, setModal] = useState({ open: false, type: "", id: null });
  const [reason, setReason] = useState("");
  const PER = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendors({ doc_status: activeTab, page, per_page: PER });
      const d = res?.data || res;
      const items = d?.items || d || [];
      setVendors(Array.isArray(items) ? items : []);
      setTotal(d?.total || items.length);
    } catch (err) {
      toast.error(err.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  // Load counts for all tabs
  const loadCounts = useCallback(async () => {
    try {
      const [p, r, rs] = await Promise.all([
        adminApi.getVendors({ doc_status: "pending",  page: 1, per_page: 1 }),
        adminApi.getVendors({ doc_status: "rejected", page: 1, per_page: 1 }),
        adminApi.getVendors({ doc_status: "resubmit", page: 1, per_page: 1 }),
      ]);
      setCounts({
        pending:  (p?.data || p)?.total  || 0,
        rejected: (r?.data || r)?.total  || 0,
        resubmit: (rs?.data || rs)?.total || 0,
      });
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const filtered = search.trim()
    ? vendors.filter(v =>
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase()) ||
        v.company_name?.toLowerCase().includes(search.toLowerCase()))
    : vendors;

  const pages = Math.ceil(total / PER);

  const doAction = async () => {
    const map = { approve: "verified", reject: "rejected", resubmit: "resubmit" };
    try {
      await adminApi.updateVendorStatus(modal.id, {
        document_verify_status: map[modal.type],
        rejection_reason: reason || null,
      });
      toast.success("Status updated");
      setModal({ open: false, type: "", id: null });
      setReason("");
      load();
      loadCounts();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const toggleActive = async (id, val) => {
    try {
      await adminApi.updateUserStatus(id, { is_active: val });
      toast.success(val ? "Activated" : "Deactivated");
      load();
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  };

  const switchTab = (key) => { setActiveTab(key); setPage(1); setSearch(""); };

  // Smart actions per status
  const getActions = (v) => {
    const s = v.document_verify_status;
    return (
      <div className="flex items-center gap-1.5 flex-nowrap">
        <button onClick={() => navigate("/admin/vendors/" + v.id)}
          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition">
          View
        </button>
        {/* Approve — available for pending, rejected, resubmit */}
        <button onClick={() => setModal({ open: true, type: "approve", id: v.id })}
          className="px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition" title="Approve">
          &#10003;
        </button>
        {/* Reject — not shown if already rejected */}
        {s !== "rejected" && (
          <button onClick={() => setModal({ open: true, type: "reject", id: v.id })}
            className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition" title="Reject">
            &#10005;
          </button>
        )}
        {/* Resubmit — not shown if already resubmit */}
        {s !== "resubmit" && (
          <button onClick={() => setModal({ open: true, type: "resubmit", id: v.id })}
            className="px-2.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition" title="Request Resubmit">
            &#8634;
          </button>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Non-Verified Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vendors requiring document review</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className={"inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition " +
                (activeTab === t.key ? t.color : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50")}>
              {t.label}
              <span className={"px-1.5 py-0.5 rounded-full text-xs font-bold " +
                (activeTab === t.key ? "bg-white/60" : "bg-gray-100 text-gray-600")}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Search name, email, company..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={() => { setSearch(""); setPage(1); }}
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
                    {["#","Company","Name","Mobile","Email","Doc Status","Active","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No {activeTab} vendors found
                    </td></tr>
                  ) : filtered.map((v, i) => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{(page-1)*PER+i+1}</td>
                      <td className="px-4 py-3 max-w-40">
                        <p className="font-semibold text-gray-800 truncate">{v.company_name || "—"}</p>
                        {v.company_status && <p className="text-xs text-gray-400 mt-0.5">{v.company_status}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{v.mobile || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{v.email}</td>
                      <td className="px-4 py-3"><Badge label={v.document_verify_status || "pending"} cls={DS[v.document_verify_status] || DS.pending} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(v.id, !v.is_active)}
                          className={"relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors " + (v.is_active ? "bg-green-500" : "bg-gray-300")}>
                          <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform " + (v.is_active ? "translate-x-4" : "translate-x-0")} />
                        </button>
                      </td>
                      <td className="px-4 py-3">{getActions(v)}</td>
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

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                {modal.type === "approve" ? "Approve Documents" : modal.type === "reject" ? "Reject Documents" : "Request Resubmission"}
              </h3>
              <button onClick={() => { setModal({ open: false, type: "", id: null }); setReason(""); }}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">&#10005;</button>
            </div>
            <div className="px-6 py-5">
              {modal.type === "approve" ? (
                <p className="text-sm text-gray-600">Approve this vendor's documents? A notification email will be sent.</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">{modal.type === "reject" ? "Reason for rejection:" : "Reason for resubmission:"}</p>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Enter reason..." />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setModal({ open: false, type: "", id: null }); setReason(""); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={doAction} disabled={modal.type !== "approve" && !reason.trim()}
                className={"px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 " +
                  (modal.type === "approve" ? "bg-green-600 hover:bg-green-700" : modal.type === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600")}>
                {modal.type === "approve" ? "Approve & Notify" : modal.type === "reject" ? "Reject & Notify" : "Request & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
