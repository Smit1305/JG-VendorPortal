import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { adminApi } from "../../services/api";

const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved:  "bg-green-100  text-green-700  border-green-200",
  rejected:  "bg-red-100    text-red-700    border-red-200",
  disbursed: "bg-blue-100   text-blue-700   border-blue-200",
};

const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap";
const TD = "px-4 py-3.5 text-sm text-gray-700";

export default function AdminLoans() {
  const [loans, setLoans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editLoan, setEditLoan] = useState(null);   // loan being edited
  const [form, setForm]         = useState({ status: "", interest_rate: "", disbursed_on: "" });
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState("");

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLoans();
      setLoans(res?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load loans");
    } finally { setLoading(false); }
  };

  const openEdit = (loan) => {
    setEditLoan(loan);
    setForm({
      status:        loan.status        || "pending",
      interest_rate: loan.interest_rate || "",
      disbursed_on:  loan.disbursed_on  || "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (form.status)        payload.status        = form.status;
      if (form.interest_rate) payload.interest_rate = form.interest_rate;
      if (form.disbursed_on)  payload.disbursed_on  = form.disbursed_on;

      await adminApi.updateLoan(editLoan.id, payload);
      toast.success("Loan updated successfully");
      setEditLoan(null);
      fetchLoans();
    } catch (err) {
      toast.error(err?.message || "Failed to update loan");
    } finally { setSaving(false); }
  };

  const filtered = filter
    ? loans.filter(l => l.status === filter)
    : loans;

  const counts = {
    all:       loans.length,
    pending:   loans.filter(l => l.status === "pending").length,
    approved:  loans.filter(l => l.status === "approved").length,
    disbursed: loans.filter(l => l.status === "disbursed").length,
    rejected:  loans.filter(l => l.status === "rejected").length,
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loan Applications</h1>
          <p className="text-xs text-gray-400 mt-0.5">Review, approve and disburse vendor loan applications</p>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "",          label: "All",       count: counts.all,       cls: "bg-gray-100 text-gray-700 border-gray-200" },
            { key: "pending",   label: "Pending",   count: counts.pending,   cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            { key: "approved",  label: "Approved",  count: counts.approved,  cls: "bg-green-50 text-green-700 border-green-200" },
            { key: "disbursed", label: "Disbursed", count: counts.disbursed, cls: "bg-blue-50 text-blue-700 border-blue-200" },
            { key: "rejected",  label: "Rejected",  count: counts.rejected,  cls: "bg-red-50 text-red-700 border-red-200" },
          ].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${s.cls} ${filter === s.key ? "ring-2 ring-offset-1 ring-current" : "opacity-70 hover:opacity-100"}`}>
              {s.label} ({s.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className={TH}>Vendor</th>
                  <th className={TH}>Loan Type</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Tenure</th>
                  <th className={TH}>Applied On</th>
                  <th className={TH}>Interest Rate</th>
                  <th className={TH}>Disbursed On</th>
                  <th className={TH}>Status</th>
                  <th className={TH + " text-center"}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={9} className="py-16 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full mx-auto" style={{ borderTopColor: "#2563eb" }} />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">No loan applications found</td></tr>
                ) : filtered.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className={TD}>
                      <p className="font-semibold text-gray-900 text-xs">{loan.vendor_name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{loan.vendor_id?.slice(0, 8)}…</p>
                    </td>
                    <td className={TD}>{loan.loan_type || "—"}</td>
                    <td className={TD + " font-semibold"}>₹{Number(String(loan.amount).replace(/,/g, "")).toLocaleString("en-IN")}</td>
                    <td className={TD}>{loan.tenure || "—"}</td>
                    <td className={TD}>{loan.applied_on || "—"}</td>
                    <td className={TD}>
                      {loan.interest_rate
                        ? <span className="font-semibold text-emerald-700">{loan.interest_rate}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={TD}>
                      {loan.disbursed_on
                        ? <span className="font-semibold text-blue-700">{loan.disbursed_on}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={TD}>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[loan.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className={TD + " text-center"}>
                      <button onClick={() => openEdit(loan)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Update Loan Application</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editLoan.vendor_name} · ₹{editLoan.amount}</p>
              </div>
              <button onClick={() => setEditLoan(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Loan summary */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Loan Type</span><span className="font-semibold text-gray-800">{editLoan.loan_type || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-800">₹{editLoan.amount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tenure</span><span className="font-semibold text-gray-800">{editLoan.tenure || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Purpose</span><span className="font-semibold text-gray-800 text-right max-w-[200px] truncate">{editLoan.purpose || "—"}</span></div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status <span className="text-red-500">*</span></label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="disbursed">Disbursed</option>
                </select>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Interest Rate
                  <span className="ml-1 font-normal text-gray-400">(e.g. 14% p.a.)</span>
                </label>
                <input type="text" value={form.interest_rate} onChange={e => setForm(p => ({ ...p, interest_rate: e.target.value }))}
                  placeholder="e.g. 14% p.a."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>

              {/* Disbursed On */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Disbursed On
                  <span className="ml-1 font-normal text-gray-400">(sets status to Disbursed)</span>
                </label>
                <input type="date" value={form.disbursed_on} onChange={e => setForm(p => ({ ...p, disbursed_on: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditLoan(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
