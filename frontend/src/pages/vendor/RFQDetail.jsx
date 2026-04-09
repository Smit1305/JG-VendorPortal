import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
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
  return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
}

function InfoCard({ label, value, accent, mono }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">{label}</p>
      <p className={`text-sm font-semibold ${mono ? "font-mono" : ""}`} style={{ color: accent || "#111827" }}>{value || "—"}</p>
    </div>
  );
}

function QuoteModal({ rfq, onClose, onSuccess }) {
  const [form, setForm] = useState({ price: "", delivery_days: "", remarks: "" });
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

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await vendorApi.getRFQ(id);
        const found = res?.data;
        if (found) setRfq(found);
        else toast.error("RFQ not found");
      } catch { toast.error("Failed to load RFQ"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    try {
      await vendorApi.deleteRFQ(id);
      toast.success("RFQ deleted");
      navigate("/vendor/rfqs");
    } catch { toast.error("Failed to delete RFQ"); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
          <p className="text-sm text-gray-400">Loading RFQ…</p>
        </div>
      </div>
    </Layout>
  );

  if (!rfq) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">RFQ not found</p>
          <button onClick={() => navigate("/vendor/rfqs")} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: C.text }}>Back to RFQs</button>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="w-full space-y-5">

        {/* Breadcrumb + Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <button onClick={() => navigate("/vendor/rfqs")} className="hover:text-violet-600 transition font-medium">Manage RFQs</button>
              <span>/</span>
              <span className="text-gray-600 font-mono">{rfq.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/vendor/rfqs")}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RFQ Details</h1>
                <p className="text-xs text-gray-400 mt-0.5">Full details for {rfq.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadRFQPDF(rfq)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Export PDF
            </button>
            {rfq.status?.toLowerCase() === "open" && (
              <button onClick={() => setShowQuote(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition"
                style={{ background: C.text }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Submit Quote
              </button>
            )}
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition"
              style={{ background: "#e11d48" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Delete
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: C.bg }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">RFQ ID</p>
              <p className="text-base font-bold font-mono" style={{ color: C.text }}>{rfq.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Buyer</p>
              <p className="text-sm font-semibold text-gray-800">{rfq.buyer || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Quantity</p>
              <p className="text-sm font-semibold text-gray-800">{rfq.qty || rfq.quantity || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Deadline</p>
              <p className="text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{rfq.deadline || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <Badge status={rfq.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Title / Product</h2>
              <p className="text-base font-semibold text-gray-900">{rfq.title || rfq.product || "—"}</p>
            </div>

            {rfq.description && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-800 mb-3">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{rfq.description}</p>
              </div>
            )}

            {rfq.quotedPrice && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
                <h2 className="text-sm font-bold text-emerald-700 mb-2">Quote Submitted</h2>
                <p className="text-2xl font-bold text-emerald-600">₹ {Number(rfq.quotedPrice).toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {/* Side Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">RFQ Information</h2>
            <div className="space-y-3">
              <InfoCard label="RFQ ID" value={rfq.id} mono accent={C.text} />
              <InfoCard label="Buyer" value={rfq.buyer} />
              <InfoCard label="Quantity" value={rfq.qty || rfq.quantity} />
              <InfoCard label="Category" value={rfq.category || "—"} />
              <InfoCard label="Deadline" value={rfq.deadline} />
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Status</p>
                <Badge status={rfq.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQuote && <QuoteModal rfq={rfq} onClose={() => setShowQuote(false)} onSuccess={() => navigate("/vendor/rfqs")} />}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete RFQ?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition" style={{ background: "#e11d48" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
