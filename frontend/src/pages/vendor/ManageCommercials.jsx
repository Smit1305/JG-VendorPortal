import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";

const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

const SETTLEMENT_RULES = [
  {
    id: 1, title: "Payment Terms",
    description: "Net 30 days from invoice date for all standard orders. Net 15 days for orders above ₹5,00,000.",
    col: C.blue,
    icon: (col) => (
      <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 2, title: "Settlement Cycle",
    description: "Payments are processed every Friday. Funds are credited to your registered bank account within 2-3 business days.",
    col: C.violet,
    icon: (col) => (
      <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 3, title: "TDS Deduction",
    description: "TDS @ 1% will be deducted on all payments as per Section 194C of Income Tax Act. TDS certificates will be issued quarterly.",
    col: C.emerald,
    icon: (col) => (
      <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    id: 4, title: "GST Compliance",
    description: "Vendors must upload GST invoices within 7 days of delivery. Payments will be held until valid GST invoice is received.",
    col: C.amber,
    icon: (col) => (
      <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 5, title: "Penalty Clause",
    description: "Late delivery penalty: 0.5% per day of order value, maximum 5%. Quality rejection: Full order value refund required.",
    col: C.blue,
    icon: (col) => (
      <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: 6, title: "Dispute Resolution",
    description: "Disputes must be raised within 15 days of payment. Resolution timeline: 30 working days.",
    col: C.violet,
    icon: (col) => (
      <svg className="w-5 h-5" fill="none" stroke={col.text} strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
];

const DEFAULT_BANK = {
  account_name: "",
  account_number: "",
  bank_name: "",
  ifsc: "",
  branch: "",
};

export default function ManageCommercials() {
  const [editBank, setEditBank] = useState(false);
  const [bankForm, setBankForm] = useState({ ...DEFAULT_BANK });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await vendorApi.getCommercials();
        const bd = res.data?.bank_details || {};
        setBankForm({
          account_name: bd.account_name || bd.account_holder || "",
          account_number: bd.account_number || "",
          bank_name: bd.bank_name || "",
          ifsc: bd.ifsc || "",
          branch: bd.branch || bd.account_type || "",
        });
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveBank = async () => {
    setSaving(true);
    try {
      await vendorApi.updateBankDetails(bankForm);
      toast.success("Bank details updated successfully");
      setEditBank(false);
    } catch (err) {
      toast.error(err.message || "Failed to update bank details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Commercials</h1>
          <p className="text-xs text-gray-400 mt-0.5">View settlement policies, manage bank details, and commission structure</p>
        </div>

        {/* Settlement Rules */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Settlement Rules & Policies</h2>
              <p className="text-xs text-gray-400 mt-0.5">Platform policies applicable to all vendor transactions</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SETTLEMENT_RULES.map(rule => (
                <div key={rule.id} className="flex gap-4 p-4 rounded-xl border border-gray-100" style={{ background: rule.col.bg }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: rule.col.light }}>
                    {rule.icon(rule.col)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{rule.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Bank Account Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">Settlement payments will be credited to this account</p>
            </div>
            <button
              onClick={() => setEditBank(!editBank)}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition hover:opacity-90"
              style={editBank
                ? { color: "#6b7280", borderColor: "#e5e7eb", background: "#f9fafb" }
                : { color: C.blue.text, borderColor: C.blue.light, background: C.blue.bg }
              }>
              {editBank ? "Cancel" : "Edit Details"}
            </button>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="py-6 text-center text-sm text-gray-400">Loading bank details...</div>
            ) : editBank ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Account Holder Name", key: "account_name" },
                  { label: "Account Number", key: "account_number" },
                  { label: "Bank Name", key: "bank_name" },
                  { label: "IFSC Code", key: "ifsc" },
                  { label: "Branch", key: "branch" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{field.label}</label>
                    <input
                      type="text"
                      value={bankForm[field.key]}
                      onChange={e => setBankForm(p => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button onClick={() => setEditBank(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
                  <button onClick={handleSaveBank} disabled={saving}
                    className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                    style={{ background: C.blue.text }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  ["Account Holder Name", bankForm.account_name],
                  ["Account Number", bankForm.account_number],
                  ["Bank Name", bankForm.bank_name],
                  ["IFSC Code", bankForm.ifsc],
                  ["Branch", bankForm.branch],
                ].map(([label, value]) => (
                  <div key={label} className="p-4 rounded-xl border border-gray-100" style={{ background: C.blue.bg }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-bold text-gray-900">{value || <span className="text-gray-400 font-normal">Not set</span>}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Commission Structure */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Commission Structure</h2>
              <p className="text-xs text-gray-400 mt-0.5">Platform commission rates applicable per product category</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Order Value</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ["Electrical & Electronics", "3%",   "₹10,000", "Standard rate"],
                  ["Mechanical Parts",          "2.5%", "₹5,000",  "Standard rate"],
                  ["Raw Materials",             "2%",   "₹25,000", "Bulk orders"],
                  ["Services",                  "5%",   "₹1,000",  "Per service order"],
                ].map(([cat, comm, min, note]) => (
                  <tr key={cat} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-medium text-gray-800">{cat}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                        style={{ background: C.blue.bg, color: C.blue.text, borderColor: C.blue.light }}>
                        {comm}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{min}</td>
                    <td className="px-5 py-4 text-gray-400">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
