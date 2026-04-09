import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";
import { downloadOrderPDF } from "../utils/pdfExport";

const C = { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" };

const STATUS = {
  delivered:  { label: "Delivered",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed:  { label: "Completed",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  processing: { label: "Processing", cls: "bg-blue-50   text-blue-700   border-blue-200" },
  shipped:    { label: "Shipped",    cls: "bg-violet-50 text-violet-700 border-violet-200" },
  cancelled:  { label: "Cancelled",  cls: "bg-rose-50   text-rose-700   border-rose-200" },
  rejected:   { label: "Rejected",   cls: "bg-rose-50   text-rose-700   border-rose-200" },
  pending:    { label: "Pending",    cls: "bg-amber-50  text-amber-700  border-amber-200" },
};

function Badge({ status }) {
  const s = STATUS[(status || "").toLowerCase()] || { label: status || "—", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
}

const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap";
const TD = "px-4 py-3 text-sm text-gray-700";
const PER_PAGE_OPTS = [10, 20, 50];

export default function MyOrders() {
  const navigate = useNavigate();
  const [allOrders, setAllOrders]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [search, setSearch]        = useState("");
  const [statusFilter, setStatus]  = useState("");
  const [perPage, setPerPage]      = useState(10);
  const [page, setPage]            = useState(1);
  const [deleteId, setDeleteId]    = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getOrders();
      setAllOrders(res?.data?.items || res?.data || []);
    } catch (err) { toast.error(err?.message || "Failed to load orders"); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let rows = allOrders;
    if (statusFilter) rows = rows.filter(o => o.status?.toLowerCase() === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(o => o.id?.toLowerCase().includes(q) || o.buyer?.toLowerCase().includes(q));
    }
    return rows;
  }, [allOrders, statusFilter, search]);

  const stats = useMemo(() => ({
    total:     allOrders.length,
    active:    allOrders.filter(o => !["delivered","completed","cancelled","rejected"].includes(o.status?.toLowerCase())).length,
    completed: allOrders.filter(o => ["delivered","completed"].includes(o.status?.toLowerCase())).length,
    cancelled: allOrders.filter(o => ["cancelled","rejected"].includes(o.status?.toLowerCase())).length,
  }), [allOrders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async () => {
    try {
      await vendorApi.deleteOrder(deleteId);
      toast.success("Order deleted");
      setAllOrders(p => p.filter(o => o.id !== deleteId));
    } catch { toast.error("Failed to delete order"); }
    finally { setDeleteId(null); }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.bg }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Product Orders</h1>
              <p className="text-xs text-gray-400 mt-0.5">View and track all buyer orders</p>
            </div>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 11A8.1 8.1 0 004.5 9M4 5v4h4M4 13a8.1 8.1 0 0015.5 2m.5 4v-4h-4"/></svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Orders",  val: stats.total,     color: "#6366f1", bg: "#f5f3ff" },
            { label: "Active",        val: stats.active,    color: "#2563eb", bg: "#eff6ff" },
            { label: "Completed",     val: stats.completed, color: "#059669", bg: "#ecfdf5" },
            { label: "Cancelled",     val: stats.cancelled, color: "#e11d48", bg: "#fff1f2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <span className="text-sm font-bold" style={{ color: s.color }}>{loading ? "—" : s.val}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-100 rounded-lg px-3 h-9">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search order ID or buyer…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 border-none" style={{ boxShadow: "none" }} />
            </div>
            <Sel value={statusFilter} onChange={v => { setStatus(v); setPage(1); }} label="All Status" opts={[
              { v: "processing", l: "Processing" }, { v: "shipped", l: "Shipped" },
              { v: "delivered", l: "Delivered" }, { v: "completed", l: "Completed" }, { v: "cancelled", l: "Cancelled" },
            ]} />
            <Sel value={perPage} onChange={v => { setPerPage(Number(v)); setPage(1); }} label={null} opts={PER_PAGE_OPTS.map(n => ({ v: n, l: `${n} Rows` }))} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className={TH}>#</th>
                  <th className={TH}>Order ID</th>
                  <th className={TH}>Buyer</th>
                  <th className={TH}>Date</th>
                  <th className={TH}>Items</th>
                  <th className={TH}>Value</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
                      <p className="text-xs text-gray-400">Loading orders…</p>
                    </div>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center"><p className="text-sm text-gray-400">No orders found</p></td></tr>
                ) : paginated.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/vendor/orders/${order.id}`)}>
                    <td className={TD + " text-gray-400 text-xs"}>{(page - 1) * perPage + idx + 1}</td>
                    <td className={TD}><span className="font-mono font-semibold text-xs" style={{ color: C.text }}>{order.id}</span></td>
                    <td className={TD + " font-medium text-gray-800"}>{order.buyer}</td>
                    <td className={TD + " text-gray-500 text-xs"}>{order.date}</td>
                    <td className={TD}><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{order.products?.length || 0} items</span></td>
                    <td className={TD + " font-semibold text-gray-900"}>₹ {Number(order.value || 0).toLocaleString("en-IN")}</td>
                    <td className={TD}><Badge status={order.status} /></td>
                    <td className={TD}>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <ActionBtn icon="eye" title="View" color="#2563eb" onClick={() => navigate(`/vendor/orders/${order.id}`)} />
                        <ActionBtn icon="pdf" title="Download PDF" color="#059669" onClick={() => downloadOrderPDF(order)} />
                        <ActionBtn icon="edit" title="Edit" color="#6366f1" onClick={() => toast("Edit feature coming soon")} />
                        <ActionBtn icon="trash" title="Delete" color="#e11d48" onClick={() => setDeleteId(order.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-500 font-medium">
              Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} results
            </p>
            <Pagination page={page} total={totalPages} onPage={setPage} />
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete Order?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition" style={{ background: "#e11d48" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function ActionBtn({ icon, title, color, onClick }) {
  const icons = {
    eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    pdf: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  };
  return (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded-lg transition"
      style={{ color: "#9ca3af" }}
      onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = color + "15"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}>
      {icons[icon]}
    </button>
  );
}

function Sel({ value, onChange, label, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-9 px-3 pr-8 text-xs font-semibold border border-gray-200 rounded-lg bg-white text-gray-600 outline-none appearance-none focus:outline-none"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
      {label && <option value="">{label}</option>}
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function Pagination({ page, total, onPage }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(total, page + 2));
  return (
    <div className="flex items-center gap-1">
      <PBtn label="Previous" disabled={page <= 1} onClick={() => onPage(p => p - 1)} />
      {pages.map(n => <PBtn key={n} label={String(n).padStart(2, "0")} active={n === page} onClick={() => onPage(n)} />)}
      <PBtn label="Next" disabled={page >= total} onClick={() => onPage(p => p + 1)} />
    </div>
  );
}

function PBtn({ label, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition"
      style={active
        ? { background: "#1e293b", color: "#fff", borderColor: "#1e293b" }
        : { background: "#fff", color: disabled ? "#d1d5db" : "#374151", borderColor: "#e5e7eb", cursor: disabled ? "not-allowed" : "pointer" }}>
      {label}
    </button>
  );
}
