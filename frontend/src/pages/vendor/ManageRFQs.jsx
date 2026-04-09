import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { downloadRFQPDF } from "../../utils/pdfExport";

const C = { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" };

const STATUS = {
  open:    { label: "Open",    cls: "bg-blue-50   text-blue-700   border-blue-200" },
  quoted:  { label: "Quoted",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired: { label: "Expired", cls: "bg-rose-50   text-rose-700   border-rose-200" },
  closed:  { label: "Closed",  cls: "bg-gray-100  text-gray-600   border-gray-200" },
};

function Badge({ status }) {
  const s = STATUS[(status || "").toLowerCase()] || { label: status || "—", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
}

const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap";
const TD = "px-4 py-3 text-sm text-gray-700";
const PER_PAGE_OPTS = [10, 20, 50];

function downloadCSV(rfq) {
  const rows = [
    ["Field", "Value"],
    ["RFQ ID", rfq.id],
    ["Title / Product", rfq.title || rfq.product],
    ["Buyer", rfq.buyer],
    ["Quantity", rfq.qty || rfq.quantity],
    ["Category", rfq.category || "—"],
    ["Deadline", rfq.deadline],
    ["Status", rfq.status],
    ["Quoted Price", rfq.quotedPrice ? `${rfq.quotedPrice}` : "—"],
    ["Description", rfq.description || "—"],
  ];
  const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `rfq-${rfq.id}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

function QuoteModal({ rfq, onClose, onSuccess }) {
  const [form, setForm]      = useState({ price: "", delivery_days: "", remarks: "" });
  const [submitting, setSub] = useState(false);

  const submit = async () => {
    if (!form.price) { toast.error("Please enter a price"); return; }
    setSub(true);
    try {
      await vendorApi.submitQuote(rfq.id, form);
      toast.success("Quote submitted!");
      onSuccess(); onClose();
    } catch (err) { toast.error(err.message || "Failed to submit quote"); }
    finally { setSub(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Submit Quote</h3>
            <p className="text-xs text-gray-400 mt-0.5">{rfq.id} · {rfq.title || rfq.product}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Your Price (₹) *", key: "price", type: "number", ph: "Enter total quoted price" },
            { label: "Delivery Days", key: "delivery_days", type: "number", ph: "e.g. 15" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.ph} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={3}
              placeholder="Terms, conditions, notes…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-5 py-2 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50" style={{ background: C.text }}>
            {submitting ? "Submitting…" : "Submit Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageRFQs() {
  const navigate = useNavigate();
  const [allRFQs, setAllRFQs]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [perPage, setPerPage]     = useState(10);
  const [page, setPage]           = useState(1);
  const [quoteRFQ, setQuoteRFQ]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);

  useEffect(() => { fetchRFQs(); }, []);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getRFQs();
      setAllRFQs(res?.data?.items || res?.data || []);
    } catch (err) { toast.error(err.message || "Failed to load RFQs"); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let rows = allRFQs;
    if (statusFilter) rows = rows.filter(r => r.status?.toLowerCase() === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.id?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.buyer?.toLowerCase().includes(q));
    }
    return rows;
  }, [allRFQs, statusFilter, search]);

  const stats = useMemo(() => ({
    total:   allRFQs.length,
    open:    allRFQs.filter(r => r.status?.toLowerCase() === "open").length,
    quoted:  allRFQs.filter(r => r.status?.toLowerCase() === "quoted").length,
    expired: allRFQs.filter(r => ["expired","closed"].includes(r.status?.toLowerCase())).length,
  }), [allRFQs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async () => {
    try {
      await vendorApi.deleteRFQ(deleteId);
      setAllRFQs(p => p.filter(r => r.id !== deleteId));
      toast.success("RFQ deleted");
    } catch { toast.error("Failed to delete RFQ"); }
    finally { setDeleteId(null); }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.bg }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Your RFQs</h1>
              <p className="text-xs text-gray-400 mt-0.5">View and respond to buyer Requests for Quotation</p>
            </div>
          </div>
          <button onClick={fetchRFQs} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 11A8.1 8.1 0 004.5 9M4 5v4h4M4 13a8.1 8.1 0 0015.5 2m.5 4v-4h-4"/></svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total RFQs", val: stats.total,   color: "#6366f1", bg: "#f5f3ff" },
            { label: "Open",       val: stats.open,    color: "#2563eb", bg: "#eff6ff" },
            { label: "Quoted",     val: stats.quoted,  color: "#059669", bg: "#ecfdf5" },
            { label: "Expired",    val: stats.expired, color: "#e11d48", bg: "#fff1f2" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
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
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search RFQ ID, title, buyer…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 border-none" style={{ boxShadow: "none" }} />
            </div>
            <Sel value={statusFilter} onChange={v => { setStatus(v); setPage(1); }} label="All Status" opts={[
              { v: "open", l: "Open" }, { v: "quoted", l: "Quoted" }, { v: "expired", l: "Expired" }, { v: "closed", l: "Closed" }
            ]} />
            <Sel value={perPage} onChange={v => { setPerPage(Number(v)); setPage(1); }} label={null} opts={PER_PAGE_OPTS.map(n => ({ v: n, l: `${n} Rows` }))} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className={TH}>#</th>
                  <th className={TH}>RFQ ID</th>
                  <th className={TH}>Title / Product</th>
                  <th className={TH}>Buyer</th>
                  <th className={TH}>Qty</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Deadline</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
                      <p className="text-xs text-gray-400">Loading RFQs…</p>
                    </div>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center"><p className="text-sm text-gray-400">No RFQs found</p></td></tr>
                ) : paginated.map((rfq, idx) => (
                  <tr key={rfq.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/vendor/rfqs/${rfq.id}`)}>
                    <td className={TD + " text-gray-400 text-xs"}>{(page - 1) * perPage + idx + 1}</td>
                    <td className={TD}><span className="font-mono font-semibold text-xs" style={{ color: C.text }}>{rfq.id}</span></td>
                    <td className={TD + " font-medium text-gray-900 max-w-xs"}><span className="truncate block max-w-48">{rfq.title || rfq.product}</span></td>
                    <td className={TD + " text-gray-500"}>{rfq.buyer}</td>
                    <td className={TD}><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{rfq.qty || rfq.quantity}</span></td>
                    <td className={TD + " text-gray-500 text-xs"}><span className="truncate block max-w-32">{rfq.category || "—"}</span></td>
                    <td className={TD}>
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{rfq.deadline}</span>
                    </td>
                    <td className={TD}><Badge status={rfq.status} /></td>
                    <td className={TD}>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {rfq.status?.toLowerCase() === "open" && (
                          <button onClick={() => setQuoteRFQ(rfq)}
                            className="px-2.5 py-1 text-xs font-semibold text-white rounded-lg transition mr-1"
                            style={{ background: C.text }}>Quote</button>
                        )}
                        <ActionBtn icon="eye"   title="View"   color={C.text}    onClick={() => navigate(`/vendor/rfqs/${rfq.id}`)} />
                        <ActionBtn icon="pdf"   title="Download PDF" color="#059669" onClick={() => downloadRFQPDF(rfq)} />
                        <ActionBtn icon="trash" title="Delete" color="#e11d48"   onClick={() => setDeleteId(rfq.id)} />
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

      {quoteRFQ && <QuoteModal rfq={quoteRFQ} onClose={() => setQuoteRFQ(null)} onSuccess={fetchRFQs} />}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete RFQ?</h3>
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
    eye:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    pdf:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  };
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded-lg transition" style={{ color: "#9ca3af" }}
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
    <button onClick={onClick} disabled={disabled} className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition"
      style={active ? { background: "#1e293b", color: "#fff", borderColor: "#1e293b" }
        : { background: "#fff", color: disabled ? "#d1d5db" : "#374151", borderColor: "#e5e7eb", cursor: disabled ? "not-allowed" : "pointer" }}>
      {label}
    </button>
  );
}
