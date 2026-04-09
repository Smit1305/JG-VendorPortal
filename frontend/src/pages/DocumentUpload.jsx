import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  HiOutlineBadgeCheck, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineCloudUpload, HiOutlineDocumentText, HiOutlineExclamationCircle,
  HiOutlineEye, HiOutlineOfficeBuilding, HiOutlinePencil, HiOutlinePlus,
  HiOutlineSave, HiOutlineTrash, HiOutlineUser, HiOutlineX,
} from "react-icons/hi";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";

/* ── DropZone ── */
function DropZone({ onFileDrop, file, onClear }) {
  const onDrop = useCallback((a) => { if (a.length > 0) onFileDrop(a[0]); }, [onFileDrop]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
  });
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isDragActive ? "border-blue-500 bg-blue-50" : file ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 bg-gray-50"}`}>
      <input {...getInputProps()} />
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{file.name}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-red-400 hover:text-red-600"><HiOutlineX className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="space-y-1">
          <HiOutlineCloudUpload className="w-7 h-7 text-gray-300 mx-auto" />
          <p className="text-xs text-gray-500">{isDragActive ? "Drop here..." : "Drag & drop or click"}</p>
          <p className="text-xs text-gray-400">PDF, PNG, JPG · max 10 MB</p>
        </div>
      )}
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ doc, onClose, onSave, saving }) {
  const [docNumber, setDocNumber] = useState(doc.doc_number || "");
  const [file, setFile] = useState(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Edit Document</h3>
            <p className="text-xs text-blue-600 font-medium mt-0.5 capitalize">{doc.doc_type?.replace(/_/g, " ")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Document Number / Reference</label>
            <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Enter document number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Replace File <span className="text-gray-400 font-normal normal-case ml-1">(leave blank to keep existing)</span>
            </label>
            {doc.has_file && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <HiOutlineDocumentText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-blue-600 truncate">{doc.file_name || "Current file"}</span>
              </div>
            )}
            <DropZone file={file} onFileDrop={setFile} onClear={() => setFile(null)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
          <button onClick={() => onSave(docNumber, file)} disabled={saving || (!file && !docNumber)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Verify Banner ── */
function VerifyBanner({ status, reason }) {
  const cfg = {
    verified: { bg: "bg-green-50 border-green-200", icon: HiOutlineBadgeCheck, ic: "text-green-600", tc: "text-green-800", label: "Your documents have been verified successfully." },
    rejected: { bg: "bg-red-50 border-red-200", icon: HiOutlineExclamationCircle, ic: "text-red-600", tc: "text-red-800", label: "Some documents were rejected. Please re-upload." },
    resubmit: { bg: "bg-orange-50 border-orange-200", icon: HiOutlineExclamationCircle, ic: "text-orange-500", tc: "text-orange-800", label: "Resubmission requested. Please upload updated documents." },
    pending:  { bg: "bg-yellow-50 border-yellow-200", icon: HiOutlineClock, ic: "text-yellow-600", tc: "text-yellow-800", label: "Documents are under review. You will be notified once verified." },
  };
  const c = cfg[status] || cfg.pending;
  const Icon = c.icon;
  return (
    <div className={`flex flex-col gap-1 px-4 py-3 rounded-xl border ${c.bg}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 ${c.ic}`} />
        <p className={`text-sm font-medium ${c.tc}`}>{c.label}</p>
      </div>
      {reason && (status === "rejected" || status === "resubmit") && (
        <p className={`text-xs ml-8 ${c.tc} opacity-80`}>Reason: {reason}</p>
      )}
    </div>
  );
}

/* ── Field ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition";

/* ═══════════════════════════════════════════════════════ */
export default function DocumentUpload() {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get("tab") === "business" ? "business" : "documents";
  const [tab, setTab] = useState(initialTab);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [entries, setEntries] = useState([{ docNumber: "", file: null }]);
  const [documents, setDocuments] = useState([]);
  const [docStatus, setDocStatus] = useState("pending");
  const [docReason, setDocReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Business details state
  const [biz, setBiz] = useState({
    number_of_employees: "", epfo_register_number: "",
    registered_address: "", head_office_address: "",
  });
  const [contactPersons, setContactPersons] = useState([]);
  const [factoryAddresses, setFactoryAddresses] = useState([]);
  const [bizSaving, setBizSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesRes, docsRes, profileRes] = await Promise.all([
        vendorApi.getDocumentTypes(),
        vendorApi.getDocuments(),
        vendorApi.getProfile().catch(() => null),
      ]);
      const td = typesRes?.data || typesRes;
      setDocumentTypes(Array.isArray(td) ? td : td?.items || []);
      if (profileRes) {
        const p = profileRes?.data || profileRes;
        const status = p?.document_verify_status || p?.vendor_profile?.document_verify_status || "pending";
        setDocStatus(status);
        setDocReason(p?.reject_reason || p?.resubmit_reason || "");
        // Sync to localStorage so Navbar reflects latest status immediately
        localStorage.setItem("vp_doc_verify_status", status);
        if (p?.verification_status) localStorage.setItem("vp_verification_status", p.verification_status);
        window.dispatchEvent(new Event("storage"));
      }
      const dd = docsRes?.data || docsRes;
      // Flatten documents
      const docsDict = dd?.documents || {};
      const flat = Object.entries(docsDict).flatMap(([type, val]) => {
        if (Array.isArray(val)) {
          return val.map((e, idx) => ({
            doc_type: type, doc_number: e.number || e.doc_number || "",
            file_name: e.filename || e.file_name || type,
            has_file: e.has_file ?? true, index: idx,
          }));
        }
        if (val && typeof val === "object") {
          return [{ doc_type: type, doc_number: val.number || val.doc_number || "",
            file_name: val.filename || val.file_name || type,
            has_file: val.has_file ?? true, index: null }];
        }
        return [];
      });
      setDocuments(flat);
      // Business details
      setBiz({
        number_of_employees: dd?.number_of_employees ?? "",
        epfo_register_number: dd?.epfo_register_number ?? "",
        registered_address: dd?.registered_address ?? "",
        head_office_address: dd?.head_office_address ?? "",
      });
      setContactPersons(dd?.contact_persons || []);
      setFactoryAddresses(dd?.factory_addresses || []);
    } catch (err) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ── Document upload helpers ──
  const uploadedSingleTypes = new Set(documents.filter(d => d.index === null).map(d => d.doc_type));
  const uploadedDocTypes = new Set(documents.map(d => d.doc_type));
  const availableTypes = documentTypes.filter(dt => {
    const isSingle = (dt.upload_type || "Single") === "Single";
    return !(isSingle && uploadedSingleTypes.has(dt.doc_type || dt.id));
  });
  const handleEntryChange = (i, f, v) => setEntries(p => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u; });
  const addEntry = () => setEntries(p => [...p, { docNumber: "", file: null }]);
  const removeEntry = (i) => setEntries(p => p.filter((_, j) => j !== i));

  const handleUpload = async () => {
    if (!selectedType) { toast.error("Please select a document type"); return; }
    const valid = entries.filter(e => e.file);
    if (!valid.length) { toast.error("Please select at least one file"); return; }
    try {
      setUploading(true);
      for (const e of valid) await vendorApi.uploadDocumentFile(selectedType, e.file, e.docNumber);
      toast.success(`${valid.length} document${valid.length > 1 ? "s" : ""} uploaded`);
      setEntries([{ docNumber: "", file: null }]); setSelectedType(""); loadData();
    } catch (err) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.doc_type?.replace(/_/g, " ")}"?`)) return;
    try {
      doc.index !== null && doc.index !== undefined
        ? await vendorApi.deleteDocumentEntry(doc.doc_type, doc.index)
        : await vendorApi.deleteDocument(doc.doc_type);
      toast.success("Deleted"); loadData();
    } catch (err) { toast.error(err.message || "Failed"); }
  };

  const handleEditSave = async (docNumber, file) => {
    if (!file) { toast.error("Please select a new file"); return; }
    try {
      setEditSaving(true);
      if (editDoc.index !== null && editDoc.index !== undefined)
        await vendorApi.deleteDocumentEntry(editDoc.doc_type, editDoc.index);
      await vendorApi.uploadDocumentFile(editDoc.doc_type, file, docNumber || editDoc.doc_number);
      toast.success("Updated"); setEditDoc(null); loadData();
    } catch (err) { toast.error(err.message || "Failed"); }
    finally { setEditSaving(false); }
  };

  const handleView = async (doc) => {
    try {
      const res = await vendorApi.viewDocument(doc.doc_type, doc.index);
      const payload = res?.data || res;
      const entry = payload?.data;
      const fe = Array.isArray(entry) ? entry[doc.index] : entry;
      const fd = fe?.file;
      if (!fd) { toast.error("No file stored"); return; }
      const mime = fe?.mime || "application/octet-stream";
      const b64 = fd.includes(",") ? fd.split(",")[1] : fd;
      const bs = atob(b64); const ab = new ArrayBuffer(bs.length); const ia = new Uint8Array(ab);
      for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([ab], { type: mime }));
      window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { toast.error(err.message || "Failed to load file"); }
  };

  // ── Business details helpers ──
  const addContact = () => setContactPersons(p => [...p, { name: "", phone: "", email: "", designation: "" }]);
  const removeContact = (i) => setContactPersons(p => p.filter((_, j) => j !== i));
  const updateContact = (i, f, v) => setContactPersons(p => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u; });

  const addFactory = () => setFactoryAddresses(p => [...p, { address: "", city: "", state: "", country: "", zip_code: "" }]);
  const removeFactory = (i) => setFactoryAddresses(p => p.filter((_, j) => j !== i));
  const updateFactory = (i, f, v) => setFactoryAddresses(p => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u; });

  const handleSaveBusiness = async () => {
    try {
      setBizSaving(true);
      await vendorApi.updateBusinessDetails({
        number_of_employees: biz.number_of_employees ? parseInt(biz.number_of_employees) : null,
        epfo_register_number: biz.epfo_register_number || null,
        registered_address: biz.registered_address || null,
        head_office_address: biz.head_office_address || null,
        contact_persons: contactPersons.filter(c => c.name && c.phone),
        factory_addresses: factoryAddresses.filter(f => f.address),
      });
      toast.success("Business details saved");
    } catch (err) { toast.error(err.message || "Failed to save"); }
    finally { setBizSaving(false); }
  };

  const getTypeName = (dt) => { const d = documentTypes.find(x => (x.doc_type || x.id) === dt); return d?.name || dt?.replace(/_/g, " "); };
  const isMultiple = (dt) => { const d = documentTypes.find(x => (x.doc_type || x.id) === dt); return d?.upload_type === "Multiple"; };
  const statusBadge = (s) => {
    const m = { verified: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", rejected: "bg-red-100 text-red-700", resubmit: "bg-orange-100 text-orange-700" };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${m[s] || "bg-gray-100 text-gray-600"}`}>{s || "pending"}</span>;
  };
  const groupedDocs = documents.reduce((a, d) => { if (!a[d.doc_type]) a[d.doc_type] = []; a[d.doc_type].push(d); return a; }, {});
  const totalRequired = documentTypes.filter(d => d.is_required).length;
  const uploadedReqCount = documentTypes.filter(d => {
    if (!d.is_required) return false;
    const key = d.doc_type || d.id;
    return d.upload_type === "Multiple" ? uploadedDocTypes.has(key) : uploadedSingleTypes.has(key);
  }).length;

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="w-full space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Upload Documents</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your verification documents and business details</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            {statusBadge(docStatus)}
          </div>
        </div>

        <VerifyBanner status={docStatus} reason={docReason} />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "documents", label: "Documents", icon: HiOutlineDocumentText },
            { key: "business", label: "Business Details", icon: HiOutlineOfficeBuilding },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* ── DOCUMENTS TAB ── */}
        {tab === "documents" && (
          <>
            {/* Progress */}
            {totalRequired > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Required Documents</p>
                  <span className="text-sm font-bold text-blue-600">{uploadedReqCount} / {totalRequired}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(uploadedReqCount / totalRequired) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {documentTypes.filter(d => d.is_required).map(dt => {
                    const key = dt.doc_type || dt.id;
                    const done = dt.upload_type === "Multiple" ? uploadedDocTypes.has(key) : uploadedSingleTypes.has(key);
                    return (
                      <span key={dt.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${done ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {done ? <HiOutlineCheckCircle className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                        {dt.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Upload New Document</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Type <span className="text-red-500">*</span></label>
                  <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setEntries([{ docNumber: "", file: null }]); }}
                    className={inp} disabled={availableTypes.length === 0}>
                    <option value="">— Select document type —</option>
                    {availableTypes.map(dt => (
                      <option key={dt.id || dt.doc_type} value={dt.doc_type || dt.id}>
                        {dt.name}{dt.is_required ? " *" : ""}{dt.upload_type === "Multiple" ? " (Multiple)" : ""}
                      </option>
                    ))}
                  </select>
                  {availableTypes.length === 0 && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1"><HiOutlineCheckCircle className="w-4 h-4" /> All documents uploaded.</p>}
                </div>
                {selectedType && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-100" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{documentTypes.find(d => (d.doc_type || d.id) === selectedType)?.name}</span>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    {entries.map((entry, i) => (
                      <div key={i} className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reference Number</label>
                          <input type="text" value={entry.docNumber} onChange={e => handleEntryChange(i, "docNumber", e.target.value)}
                            placeholder="e.g. GSTIN, PAN, Certificate No." className={inp} />
                        </div>
                        <DropZone file={entry.file} onFileDrop={f => handleEntryChange(i, "file", f)} onClear={() => handleEntryChange(i, "file", null)} />
                        {entries.length > 1 && (
                          <button onClick={() => removeEntry(i)} className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      {isMultiple(selectedType) && (
                        <button onClick={addEntry} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                          <HiOutlinePlus className="w-4 h-4" /> Add Another File
                        </button>
                      )}
                      <div className="ml-auto">
                        <button onClick={handleUpload} disabled={uploading}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                          <HiOutlineCloudUpload className="w-4 h-4" />
                          {uploading ? "Uploading..." : "Upload Document"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Uploaded Documents</h2>
                <p className="text-xs text-gray-500 mt-0.5">{documents.length} document{documents.length !== 1 ? "s" : ""} uploaded</p>
              </div>
              {Object.keys(groupedDocs).length === 0 ? (
                <div className="p-16 text-center">
                  <HiOutlineDocumentText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {Object.entries(groupedDocs).map(([docType, docs]) => (
                    <div key={docType}>
                      <div className="px-6 py-3 bg-gray-50 flex items-center gap-2">
                        <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{getTypeName(docType)}</span>
                        {isMultiple(docType) && <span className="text-xs text-gray-400">({docs.length} files)</span>}
                        <div className="flex-1" />
                        {isMultiple(docType) && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">Multiple</span>}
                      </div>
                      {docs.map((doc, idx) => (
                        <div key={idx} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition group">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <HiOutlineDocumentText className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name || "Document"}{doc.index !== null && doc.index !== undefined ? ` #${doc.index + 1}` : ""}</p>
                            {doc.doc_number && <p className="text-xs text-gray-500 mt-0.5">Ref: <span className="font-mono">{doc.doc_number}</span></p>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            {doc.has_file && (
                              <button onClick={() => handleView(doc)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                                <HiOutlineEye className="w-3.5 h-3.5" /> View
                              </button>
                            )}
                            <button onClick={() => setEditDoc(doc)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                              <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => handleDelete(doc)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                              <HiOutlineTrash className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Document Checklist</h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {documentTypes.map(dt => {
                  const done = isMultiple(dt) ? documents.some(d => d.doc_type === (dt.doc_type || dt.id)) : uploadedSingleTypes.has(dt.doc_type || dt.id);
                  return (
                    <div key={dt.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${done ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500" : "bg-gray-300"}`}>
                        {done ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${done ? "text-green-800 font-medium" : "text-gray-600"}`}>{dt.name}</span>
                      <div className="flex items-center gap-1.5">
                        {dt.is_required && <span className="text-xs text-red-500 font-medium">Required</span>}
                        {dt.upload_type === "Multiple" && <span className="text-xs text-blue-500">Multi</span>}
                        {done && <span className="text-xs text-green-600 font-semibold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── BUSINESS DETAILS TAB ── */}
        {tab === "business" && (
          <div className="space-y-5">

            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <HiOutlineOfficeBuilding className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-800">Company Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Number of Employees">
                  <input type="number" value={biz.number_of_employees} onChange={e => setBiz(p => ({ ...p, number_of_employees: e.target.value }))}
                    placeholder="e.g. 50" className={inp} />
                </Field>
                <Field label="EPFO Register Number">
                  <input type="text" value={biz.epfo_register_number} onChange={e => setBiz(p => ({ ...p, epfo_register_number: e.target.value }))}
                    placeholder="e.g. MH/12345/ABC" className={inp} />
                </Field>
                <Field label="Registered Address">
                  <textarea value={biz.registered_address} onChange={e => setBiz(p => ({ ...p, registered_address: e.target.value }))}
                    placeholder="Full registered address" rows={3} className={inp + " resize-none"} />
                </Field>
                <Field label="Head Office Address">
                  <textarea value={biz.head_office_address} onChange={e => setBiz(p => ({ ...p, head_office_address: e.target.value }))}
                    placeholder="Head office address" rows={3} className={inp + " resize-none"} />
                </Field>
              </div>
            </div>

            {/* Contact Persons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineUser className="w-5 h-5 text-blue-500" />
                  <h2 className="text-base font-semibold text-gray-800">Contact Persons</h2>
                  <span className="text-xs text-gray-400">({contactPersons.length})</span>
                </div>
                <button onClick={addContact} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                  <HiOutlinePlus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>
              <div className="p-6 space-y-4">
                {contactPersons.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No contact persons added yet</p>
                ) : contactPersons.map((cp, i) => (
                  <div key={i} className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name *">
                      <input type="text" value={cp.name} onChange={e => updateContact(i, "name", e.target.value)} placeholder="Full name" className={inp} />
                    </Field>
                    <Field label="Phone *">
                      <input type="text" value={cp.phone} onChange={e => updateContact(i, "phone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inp} />
                    </Field>
                    <Field label="Email">
                      <input type="email" value={cp.email} onChange={e => updateContact(i, "email", e.target.value)} placeholder="email@company.com" className={inp} />
                    </Field>
                    <Field label="Designation">
                      <input type="text" value={cp.designation} onChange={e => updateContact(i, "designation", e.target.value)} placeholder="e.g. Manager" className={inp} />
                    </Field>
                    <button onClick={() => removeContact(i)} className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Factory Addresses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineOfficeBuilding className="w-5 h-5 text-blue-500" />
                  <h2 className="text-base font-semibold text-gray-800">Factory / Production Addresses</h2>
                  <span className="text-xs text-gray-400">({factoryAddresses.length})</span>
                </div>
                <button onClick={addFactory} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                  <HiOutlinePlus className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>
              <div className="p-6 space-y-4">
                {factoryAddresses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No factory addresses added yet</p>
                ) : factoryAddresses.map((fa, i) => (
                  <div key={i} className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Address *">
                        <textarea value={fa.address} onChange={e => updateFactory(i, "address", e.target.value)} placeholder="Full factory address" rows={2} className={inp + " resize-none"} />
                      </Field>
                    </div>
                    <Field label="City">
                      <input type="text" value={fa.city} onChange={e => updateFactory(i, "city", e.target.value)} placeholder="City" className={inp} />
                    </Field>
                    <Field label="State">
                      <input type="text" value={fa.state} onChange={e => updateFactory(i, "state", e.target.value)} placeholder="State" className={inp} />
                    </Field>
                    <Field label="Country">
                      <input type="text" value={fa.country} onChange={e => updateFactory(i, "country", e.target.value)} placeholder="Country" className={inp} />
                    </Field>
                    <Field label="ZIP Code">
                      <input type="text" value={fa.zip_code} onChange={e => updateFactory(i, "zip_code", e.target.value)} placeholder="ZIP / PIN" className={inp} />
                    </Field>
                    <button onClick={() => removeFactory(i)} className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button onClick={handleSaveBusiness} disabled={bizSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                <HiOutlineSave className="w-4 h-4" />
                {bizSaving ? "Saving..." : "Save Business Details"}
              </button>
            </div>
          </div>
        )}

      </div>

      {editDoc && <EditModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={handleEditSave} saving={editSaving} />}
    </Layout>
  );
}
