import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import toast from "react-hot-toast";
import { exportCSV } from "../../utils/exportUtils";
import { downloadPaymentPDF, downloadPaymentsSummaryPDF } from "../../utils/pdfExport";

const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
  rose:    { bg: "#fff1f2", text: "#e11d48", light: "#fecdd3" },
};

const STATUS_META = {
  paid:    { label: "Paid",    cls: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-700 border-red-200" },
};

const TABS = [
  { key: "all",     label: "All Payments" },
  { key: "pending", label: "Pending" },
  { key: "paid",    label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

function StatusBadge({ status }) {
  const s = STATUS_META[(status || "").toLowerCase()] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
}

export default function ManagePayments() {
  const [activeTab, setActiveTab] = useState("all");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewPayment, setViewPayment] = useState(null);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getPayments();
      setPayments(res?.data?.items || res?.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const safeAmt = (str) => parseInt(String(str || "0").replace(/,/g, "")) || 0;

  const filtered = activeTab === "all" ? payments : payments.filter(p => (p.status || "").toLowerCase() === activeTab);
  const totalPending = payments.filter(p => (p.status || "").toLowerCase() === "pending").reduce((s, p) => s + safeAmt(p.amount), 0);
  const totalPaid    = payments.filter(p => (p.status || "").toLowerCase() === "paid").reduce((s, p) => s + safeAmt(p.amount), 0);
  const totalOverdue = payments.filter(p => (p.status || "").toLowerCase() === "overdue").reduce((s, p) => s + safeAmt(p.amount), 0);

  const fmt = (n) => `₹ ${n.toLocaleString("en-IN")}`;

  const kpis = [
    {
      label: "Pending Amount",
      value: fmt(totalPending),
      col: C.amber,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Received",
      value: fmt(totalPaid),
      col: C.emerald,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Overdue Amount",
      value: fmt(totalOverdue),
      col: C.rose,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manage Payments</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track all your payment transactions and dues</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(filtered, ["id","order_id","buyer","amount","paid_date","due_date","status","mode"], ["Invoice ID","Order ID","Buyer","Amount","Paid/Due Date","Due Date","Status","Mode"], "payments")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button
              onClick={() => downloadPaymentsSummaryPDF(filtered, { pending: totalPending, paid: totalPaid, overdue: totalOverdue })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <button onClick={fetchPayments} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.col.bg, color: kpi.col.text }}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{loading ? "—" : kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                  {tab.key === "all" ? payments.length : payments.filter(p => (p.status || "").toLowerCase() === tab.key).length}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Due / Paid Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mode</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading payments...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: C.blue.bg }}>
                      <svg className="w-6 h-6" fill="none" stroke={C.blue.text} strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">No payments found</p>
                    <p className="text-xs text-gray-300 mt-1">Payments appear here as orders are processed</p>
                  </td></tr>
                ) : (
                  filtered.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-700">{payment.id}</td>
                      <td className="px-5 py-4 text-sm font-medium" style={{ color: C.blue.text }}>{payment.order_id}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{payment.buyer || "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">₹ {payment.amount}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        <div>{payment.paid_date || payment.due_date}</div>
                        {payment.days_overdue && <span className="text-xs text-red-500 font-medium">{payment.days_overdue}d overdue</span>}
                        {payment.days_left && <span className="text-xs text-yellow-600 font-medium">{payment.days_left}d left</span>}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={payment.status} /></td>
                      <td className="px-5 py-4 text-sm text-gray-500">{payment.mode || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewPayment(payment)} className="p-1.5 rounded-lg transition hover:bg-blue-50" title="View Invoice" style={{ color: C.blue.text }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => downloadPaymentPDF(payment)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition" title="Download PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Invoice Modal */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Invoice Details</h3>
              <button onClick={() => setViewPayment(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                ["Invoice ID", viewPayment.id],
                ["Order ID", viewPayment.order_id || "—"],
                ["Buyer", viewPayment.buyer || "—"],
                ["Amount", viewPayment.amount ? `₹ ${viewPayment.amount}` : "—"],
                ["Date", viewPayment.paid_date || viewPayment.due_date || "—"],
                ["Status", viewPayment.status || "—"],
                ["Mode", viewPayment.mode || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
              {viewPayment.days_overdue && (
                <div className="mt-2 px-3 py-2 text-xs font-medium rounded-lg" style={{ background: C.rose.bg, color: C.rose.text }}>{viewPayment.days_overdue}d overdue</div>
              )}
              {viewPayment.days_left && (
                <div className="mt-2 px-3 py-2 text-xs font-medium rounded-lg" style={{ background: C.amber.bg, color: C.amber.text }}>Due in {viewPayment.days_left} day(s)</div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setViewPayment(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Close</button>
              <button onClick={() => { downloadPaymentPDF(viewPayment); setViewPayment(null); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
                style={{ background: C.emerald.text }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
