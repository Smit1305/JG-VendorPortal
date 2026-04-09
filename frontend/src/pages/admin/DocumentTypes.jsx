import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiPencil, HiPlus, HiTrash, HiX } from "react-icons/hi";
import Layout from "../../components/Layout.jsx";
import { adminApi } from "../../services/api.js";

function StyledSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full appearance-none border border-gray-200 rounded-lg bg-white px-3 py-2.5 pr-9 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

const emptyForm = { name: "", doc_type: "", upload_type: "Single", is_required: false };

export default function DocumentTypes() {
  const [docTypes, setDocTypes]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState({ open: false, mode: "add", data: null });
  const [form, setForm]                 = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [saving, setSaving]             = useState(false);

  const fetchDocTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDocumentTypes();
      const d   = res?.data || res;
      setDocTypes(Array.isArray(d) ? d : d?.items || []);
    } catch (err) { toast.error(err.message || "Failed to load document types"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocTypes(); }, [fetchDocTypes]);

  const openAddModal  = () => { setForm({ ...emptyForm }); setModal({ open: true, mode: "add", data: null }); };
  const openEditModal = (item) => {
    setForm({ name: item.name, doc_type: item.doc_type, upload_type: item.upload_type || "Single", is_required: item.is_required });
    setModal({ open: true, mode: "edit", data: item });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === "add") { await adminApi.createDocumentType(form); toast.success("Document type created"); }
      else { await adminApi.updateDocumentType(modal.data.id, form); toast.success("Document type updated"); }
      setModal({ open: false, mode: "add", data: null });
      fetchDocTypes();
    } catch (err) { toast.error(err.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await adminApi.deleteDocumentType(deleteConfirm.item.id);
      toast.success("Document type deleted");
      setDeleteConfirm({ open: false, item: null });
      fetchDocTypes();
    } catch (err) { toast.error(err.message || "Failed to delete"); }
  };

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Document Types</h1>
            <p className="text-sm text-gray-400 mt-0.5">Configure required vendor document types</p>
          </div>
          <button onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shrink-0">
            <HiPlus className="w-4 h-4" /> Add New
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-blue-600 animate-spin" />
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["#", "Name", "Doc Type", "Upload Type", "Required", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docTypes.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">No document types found</td></tr>
                ) : docTypes.map((dt, idx) => (
                  <tr key={dt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{dt.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{dt.doc_type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${dt.upload_type === "Multiple" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {dt.upload_type || "Single"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${dt.is_required ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {dt.is_required ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(dt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <HiPencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => setDeleteConfirm({ open: true, item: dt })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                          <HiTrash className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{modal.mode === "add" ? "Add Document Type" : "Edit Document Type"}</h3>
              <button onClick={() => setModal({ open: false, mode: "add", data: null })} className="text-gray-400 hover:text-gray-600 transition-colors"><HiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inp} placeholder="e.g. PAN Card" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Doc Type (slug)</label>
                <input type="text" value={form.doc_type} onChange={e => setForm(p => ({ ...p, doc_type: e.target.value }))} className={inp + " font-mono"} placeholder="e.g. pan_card" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Upload Type</label>
                <StyledSelect value={form.upload_type} onChange={e => setForm(p => ({ ...p, upload_type: e.target.value }))}>
                  <option value="Single">Single (one file)</option>
                  <option value="Multiple">Multiple (many files)</option>
                </StyledSelect>
              </div>
              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="is_required" checked={form.is_required} onChange={e => setForm(p => ({ ...p, is_required: e.target.checked }))} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="is_required" className="text-sm font-medium text-gray-700">Is Required</label>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setModal({ open: false, mode: "add", data: null })} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? "Saving..." : modal.mode === "add" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Delete Document Type</h3>
              <button onClick={() => setDeleteConfirm({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 transition-colors"><HiX className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600">Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteConfirm.item?.name}</span>? This cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm({ open: false, item: null })} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
