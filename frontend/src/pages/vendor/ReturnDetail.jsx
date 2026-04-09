import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { downloadReturnPDF } from "../../utils/pdfExport";
const C = { bg: "#fff1f2", text: "#e11d48", light: "#fecdd3" };

const STATUS = {
  approved:   { label: "Approved",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending:    { label: "Pending",    cls: "bg-amber-50   text-amber-700   border-amber-200" },
  rejected:   { label: "Rejected",   cls: "bg-rose-50    text-rose-700    border-rose-200" },
  processing: { label: "Processing", cls: "bg-blue-50    text-blue-700    border-blue-200" },
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

export default function ReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnItem, setReturnItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await vendorApi.getReturn(id);
        const found = res?.data;
        if (found) setReturnItem(found);
        else toast.error("Return not found");
      } catch { toast.error("Failed to load return"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleDelete = () => {
    toast.success("Return removed");
    navigate("/vendor/returns");
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
          <p className="text-sm text-gray-400">Loading return…</p>
        </div>
      </div>
    </Layout>
  );

  if (!returnItem) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Return not found</p>
          <button onClick={() => navigate("/vendor/returns")} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: C.text }}>Back to Returns</button>
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
              <button onClick={() => navigate("/vendor/returns")} className="hover:text-rose-600 transition font-medium">Manage Returns</button>
              <span>/</span>
              <span className="text-gray-600 font-mono">{returnItem.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/vendor/returns")}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Return Details</h1>
                <p className="text-xs text-gray-400 mt-0.5">Full details for return {returnItem.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadReturnPDF(returnItem)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Export PDF
            </button>
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11a8.1 8.1 0 00-15.5-2m-.5-4v4h4"/><path d="M4 13a8.1 8.1 0 0015.5 2m.5 4v-4h-4"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Return ID</p>
              <p className="text-base font-bold font-mono" style={{ color: C.text }}>{returnItem.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Order ID</p>
              <p className="text-sm font-semibold font-mono text-gray-800">{returnItem.order_id || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Product</p>
              <p className="text-sm font-semibold text-gray-800 max-w-32 truncate">{returnItem.product || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Quantity</p>
              <p className="text-sm font-semibold text-gray-800">{returnItem.quantity || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <Badge status={returnItem.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Return Reason */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-3">Return Reason</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{returnItem.reason || "No reason provided."}</p>
            </div>

            {/* Refund Info */}
            {returnItem.refund_amount && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
                <h2 className="text-sm font-bold text-emerald-700 mb-2">Refund Amount</h2>
                <p className="text-2xl font-bold text-emerald-600">₹ {Number(returnItem.refund_amount).toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {/* Side Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Return Information</h2>
            <div className="space-y-3">
              <InfoCard label="Return ID" value={returnItem.id} mono accent={C.text} />
              <InfoCard label="Order ID" value={returnItem.order_id} mono />
              <InfoCard label="Product" value={returnItem.product} />
              <InfoCard label="Quantity" value={returnItem.quantity} />
              <InfoCard label="Requested On" value={returnItem.requested_on} />
              {returnItem.refund_amount && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Refund Amount</p>
                  <p className="text-lg font-bold text-emerald-700">₹ {Number(returnItem.refund_amount).toLocaleString("en-IN")}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Status</p>
                <Badge status={returnItem.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete Return?</h3>
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
