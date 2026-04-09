import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { downloadShipmentPDF } from "../../utils/pdfExport";
const C = { bg: "#ecfeff", text: "#0891b2", light: "#cffafe" };

const STATUS = {
  "in transit":       { label: "In Transit",       cls: "bg-blue-50   text-blue-700   border-blue-200" },
  "out for delivery": { label: "Out for Delivery", cls: "bg-amber-50  text-amber-700  border-amber-200" },
  "delivered":        { label: "Delivered",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "pending":          { label: "Pending",          cls: "bg-gray-100  text-gray-600   border-gray-200" },
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

export default function LogisticsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await vendorApi.getShipment(id);
        const found = res?.data;
        if (found) setShipment(found);
        else toast.error("Shipment not found");
      } catch { toast.error("Failed to load shipment"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    toast.success("Shipment removed");
    navigate("/vendor/logistics");
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
          <p className="text-sm text-gray-400">Loading shipment…</p>
        </div>
      </div>
    </Layout>
  );

  if (!shipment) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Shipment not found</p>
          <button onClick={() => navigate("/vendor/logistics")} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: C.text }}>Back to Logistics</button>
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
              <button onClick={() => navigate("/vendor/logistics")} className="hover:text-cyan-600 transition font-medium">Manage Logistics</button>
              <span>/</span>
              <span className="text-gray-600 font-mono">{shipment.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/vendor/logistics")}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shipment Details</h1>
                <p className="text-xs text-gray-400 mt-0.5">Tracking and delivery info for {shipment.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadShipmentPDF(shipment)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Export PDF
            </button>
            <button onClick={() => toast("Edit feature coming soon")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
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
                <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0"/><path d="M15 17a2 2 0 104 0 2 2 0 00-4 0"/>
                <path d="M5 17H3V6a1 1 0 011-1h11v12M9 17h6m4 0h2v-6l-3-5H16V6"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Shipment ID</p>
              <p className="text-base font-bold font-mono" style={{ color: C.text }}>{shipment.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Carrier</p>
              <p className="text-sm font-semibold text-gray-800">{shipment.carrier || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Tracking No.</p>
              <p className="text-sm font-semibold font-mono text-gray-800">{shipment.tracking || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Expected Delivery</p>
              <p className="text-sm font-semibold text-gray-800">{shipment.expected_delivery || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <Badge status={shipment.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Route */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Delivery Route</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-cyan-50 rounded-xl p-4 border border-cyan-100 text-center">
                  <p className="text-xs text-cyan-600 font-semibold uppercase tracking-wide mb-1">Origin</p>
                  <p className="text-sm font-bold text-gray-800">{shipment.origin || "—"}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Destination</p>
                  <p className="text-sm font-bold text-gray-800">{shipment.destination || "—"}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {(shipment.timeline || []).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-800 mb-4">Shipment Timeline</h2>
                <div className="relative">
                  <div className="absolute left-2.5 top-3 bottom-3 w-px bg-gray-200" />
                  <div className="space-y-0">
                    {shipment.timeline.map((t, i) => (
                      <div key={i} className="flex gap-4 pb-5 relative">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center z-10 mt-0.5"
                          style={{ background: i === shipment.timeline.length - 1 ? C.text : "#e5e7eb" }}>
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{t.event}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{t.location} · {t.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Shipment Information</h2>
            <div className="space-y-3">
              <InfoCard label="Shipment ID" value={shipment.id} mono accent={C.text} />
              <InfoCard label="Order ID" value={shipment.order_id} mono />
              <InfoCard label="Carrier" value={shipment.carrier} />
              <InfoCard label="Tracking No." value={shipment.tracking} mono />
              <InfoCard label="Dispatch Date" value={shipment.dispatch_date} />
              <InfoCard label="Expected Delivery" value={shipment.expected_delivery} />
              {shipment.weight && <InfoCard label="Weight" value={shipment.weight} />}
              {shipment.items && <InfoCard label="Items" value={shipment.items} />}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Status</p>
                <Badge status={shipment.status} />
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
            <h3 className="text-base font-bold text-gray-900 text-center">Delete Shipment?</h3>
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
