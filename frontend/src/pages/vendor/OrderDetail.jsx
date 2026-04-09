import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { downloadOrderPDF } from "../../utils/pdfExport";

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

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await vendorApi.getOrder(id);
        const found = res?.data;
        if (found) setOrder(found);
        else toast.error("Order not found");
      } catch { toast.error("Failed to load order"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    try {
      await vendorApi.deleteOrder(id);
      toast.success("Order deleted");
      navigate("/vendor/orders");
    } catch { toast.error("Failed to delete order"); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
          <p className="text-sm text-gray-400">Loading order…</p>
        </div>
      </div>
    </Layout>
  );

  if (!order) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <button onClick={() => navigate("/vendor/orders")} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: C.text }}>Back to Orders</button>
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
              <button onClick={() => navigate("/vendor/orders")} className="hover:text-blue-600 transition font-medium">Manage Product Orders</button>
              <span>/</span>
              <span className="text-gray-600 font-mono">{order.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/vendor/orders")}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
                <p className="text-xs text-gray-400 mt-0.5">Full details for order {order.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadOrderPDF(order)}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Order ID</p>
              <p className="text-base font-bold font-mono" style={{ color: C.text }}>{order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Buyer</p>
              <p className="text-sm font-semibold text-gray-800">{order.buyer || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-800">{order.date || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Total Value</p>
              <p className="text-base font-bold text-emerald-600">₹ {Number(order.value || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <Badge status={order.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Order Items */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Order Items</h2>
              <p className="text-xs text-gray-400 mt-0.5">{order.products?.length || 0} item(s) in this order</p>
            </div>
            {(order.products || []).length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No items in this order</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {(order.products || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round">
                          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Qty: {p.qty}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">₹ {Number(p.price || 0).toLocaleString("en-IN")}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-4 bg-blue-50">
                  <p className="text-sm font-bold text-gray-700">Total</p>
                  <p className="text-base font-bold text-emerald-600">₹ {Number(order.value || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Side Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Order Information</h2>
              <div className="space-y-3">
                <InfoCard label="Order ID" value={order.id} mono accent={C.text} />
                <InfoCard label="Buyer" value={order.buyer} />
                <InfoCard label="Order Date" value={order.date} />
                <InfoCard label="Total Items" value={`${order.products?.length || 0} items`} />
              </div>
            </div>

            {order.reason && (
              <div className="bg-rose-50 rounded-xl border border-rose-100 p-4">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2">Note / Reason</p>
                <p className="text-sm text-rose-700">{order.reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete Order?</h3>
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
