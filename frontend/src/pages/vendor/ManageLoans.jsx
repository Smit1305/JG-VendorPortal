import React, { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { exportCSV } from "../../utils/exportUtils";
import { downloadLoanPDF, downloadLoansSummaryPDF } from "../../utils/pdfExport";

const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

const LOAN_PRODUCTS = [
  { id: 1, name: "Working Capital Loan", max_amount: "50,00,000", rate: "12-18% p.a.", tenure: "12-36 months", processing_fee: "1-2%", description: "Short-term financing for day-to-day business operations, inventory purchase, and operational expenses." },
  { id: 2, name: "Equipment Finance", max_amount: "2,00,00,000", rate: "10-15% p.a.", tenure: "24-60 months", processing_fee: "0.5-1%", description: "Finance for purchase of machinery, equipment, and tools required for manufacturing." },
  { id: 3, name: "Invoice Discounting", max_amount: "1,00,00,000", rate: "14-20% p.a.", tenure: "30-90 days", processing_fee: "0.5%", description: "Get immediate cash against your outstanding invoices. Improve cash flow without waiting for payment." },
];

const STATUS_COLORS = {
  "Under Review": "bg-yellow-100 text-yellow-700",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Disbursed": "bg-blue-100 text-blue-700",
  "approved": "bg-green-100 text-green-700",
  "pending": "bg-yellow-100 text-yellow-700",
  "rejected": "bg-red-100 text-red-700",
};

export default function ManageLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState({ open: false, product: null });
  const [form, setForm] = useState({ amount: "", tenure: "", purpose: "" });
  const [submitting, setSubmitting] = useState(false);
  const [viewLoan, setViewLoan] = useState(null);

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getLoans();
      setLoans(res?.data?.items || res?.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!form.amount) { toast.error("Please enter a loan amount"); return; }
    if (!form.purpose) { toast.error("Please describe the purpose"); return; }
    setSubmitting(true);
    try {
      await vendorApi.applyLoan({
        loan_type: applyModal.product?.name,
        amount: form.amount,
        tenure: form.tenure,
        purpose: form.purpose,
      });
      toast.success("Loan application submitted! Our finance team will contact you within 3 business days.");
      setApplyModal({ open: false, product: null });
      setForm({ amount: "", tenure: "", purpose: "" });
      fetchLoans();
    } catch (err) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manage Loans</h1>
            <p className="text-xs text-gray-400 mt-0.5">Access financing options and track your loan applications</p>
          </div>
        </div>

        {/* Finance Partner Program Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm" style={{ background: C.amber.bg }}>
          <div className="px-5 py-4 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.amber.light }}>
              <svg className="w-5 h-5" fill="none" stroke={C.amber.text} strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: C.amber.text }}>Jigisha Finance Partner Program</h2>
              <p className="text-xs mt-0.5" style={{ color: "#92400e" }}>Access exclusive financing options for verified vendors. Quick approvals, competitive rates, and minimal documentation.</p>
            </div>
          </div>
        </div>

        {/* Available Loan Products */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Available Loan Products</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOAN_PRODUCTS.map((product, idx) => {
                const colors = [C.blue, C.violet, C.emerald];
                const col = colors[idx % colors.length];
                return (
                  <div key={product.id} className="rounded-xl border border-gray-100 p-5 flex flex-col" style={{ background: col.bg }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: col.light }}>
                        <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 flex-1">{product.description}</p>
                    <div className="space-y-1.5 text-xs mb-4">
                      <div className="flex justify-between"><span className="text-gray-500">Max Amount</span><span className="font-semibold text-gray-800">₹{product.max_amount}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Interest Rate</span><span className="font-semibold text-gray-800">{product.rate}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Tenure</span><span className="font-semibold text-gray-800">{product.tenure}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Processing Fee</span><span className="font-semibold text-gray-800">{product.processing_fee}</span></div>
                    </div>
                    <button
                      onClick={() => { setApplyModal({ open: true, product }); setForm({ amount: "", tenure: "", purpose: "" }); }}
                      className="w-full py-2 text-white text-xs font-semibold rounded-lg transition hover:opacity-90"
                      style={{ background: col.text }}
                    >
                      Apply Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* My Loan Applications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">My Loan Applications</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(loans, ["id","loan_type","amount","tenure","status","applied_on"], ["ID","Loan Type","Amount","Tenure","Status","Applied On"], "loans")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                CSV
              </button>
              <button
                onClick={() => downloadLoansSummaryPDF(loans)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Application ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Loan Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Applied On</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Disbursed On</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Interest</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </td></tr>
                ) : loans.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: C.blue.bg }}>
                      <svg className="w-6 h-6" fill="none" stroke={C.blue.text} strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-400">No loan applications found</p>
                    <p className="text-xs text-gray-300 mt-1">Apply for a loan above to get started</p>
                  </td></tr>
                ) : (
                  loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-700">{loan.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{loan.purpose?.substring(0, 30) || "—"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{loan.amount}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{loan.applied_on || loan.created_at?.split("T")[0] || "—"}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{loan.disbursed_on || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[loan.status] || "bg-gray-100 text-gray-700"}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{loan.interest_rate || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewLoan(loan)} className="p-1.5 rounded-lg transition hover:bg-blue-50" title="View Details" style={{ color: C.blue.text }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => downloadLoanPDF(loan)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition" title="Download PDF">
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

      {/* View Loan Modal */}
      {viewLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Loan Application Details</h3>
              <button onClick={() => setViewLoan(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                ["Application ID", viewLoan.id],
                ["Loan Type / Purpose", viewLoan.loan_type || viewLoan.purpose || "—"],
                ["Amount", viewLoan.amount ? `₹${viewLoan.amount}` : "—"],
                ["Tenure", viewLoan.tenure || "—"],
                ["Applied On", viewLoan.applied_on || viewLoan.created_at?.split("T")[0] || "—"],
                ["Disbursed On", viewLoan.disbursed_on || "—"],
                ["Status", viewLoan.status || "—"],
                ["Interest Rate", viewLoan.interest_rate || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0 gap-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0">{label}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right">{value}</span>
                </div>
              ))}
              {viewLoan.purpose && (
                <div className="mt-2 p-3 rounded-lg text-xs" style={{ background: C.blue.bg, color: C.blue.text }}>{viewLoan.purpose}</div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setViewLoan(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Close</button>
              <button onClick={() => { downloadLoanPDF(viewLoan); setViewLoan(null); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
                style={{ background: C.blue.text }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Apply for {applyModal.product?.name}</h3>
              <button onClick={() => setApplyModal({ open: false, product: null })} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Loan Amount (₹) <span className="text-red-500">*</span></label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" placeholder="Enter required amount" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Preferred Tenure</label>
                <input type="text" value={form.tenure} onChange={e => setForm(p => ({ ...p, tenure: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" placeholder="e.g. 24 months" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Purpose of Loan <span className="text-red-500">*</span></label>
                <textarea value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-none" placeholder="Describe how you plan to use the funds..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setApplyModal({ open: false, product: null })} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleApply} disabled={submitting}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                style={{ background: C.blue.text }}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
