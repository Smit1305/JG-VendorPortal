import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    HiBan,
    HiBriefcase,
    HiCheckCircle,
    HiCube,
    HiDocumentText,
    HiDownload,
    HiEye,
    HiMail,
    HiRefresh,
    HiTrash,
    HiUpload,
    HiUser,
    HiX,
} from "react-icons/hi";
import { useParams } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import { adminApi } from "../../services/api.js";

function openBase64File(b64, mime) {
  try {
    const data = b64.includes(",") ? b64.split(",")[1] : b64;
    const bs = atob(data);
    const ab = new ArrayBuffer(bs.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([ab], { type: mime || "application/octet-stream" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  } catch { toast.error("Failed to open file"); }
}

const statusColor = (s) => {
  switch ((s || "").toLowerCase()) {
    case "active": case "verified": case "approved": return "bg-green-100 text-green-700";
    case "pending": return "bg-amber-100 text-amber-700";
    case "rejected": return "bg-red-100 text-red-700";
    case "resubmit": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-500";
  }
};

const TABS = [
  { key: "basic",     label: "Basic Details",     icon: HiUser },
  { key: "documents", label: "Documents",          icon: HiDocumentText },
  { key: "products",  label: "Products",           icon: HiCube },
  { key: "service",   label: "Service Provider",   icon: HiBriefcase },
];

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("basic");
  const [actionModal, setActionModal] = useState({ open: false, type: "" });
  const [reason, setReason]           = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [docTypes, setDocTypes]       = useState([]);
  const [uploadForm, setUploadForm]   = useState({ doc_type: "", doc_number: "", file: null });
  const [uploading, setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  const fetchVendor = async () => {
    try {
      const [vendorRes, typesRes] = await Promise.all([
        adminApi.getVendorDetail(id),
        adminApi.getDocumentTypes().catch(() => ({ data: [] })),
      ]);
      setVendor(vendorRes.data || vendorRes);
      const td = typesRes?.data || typesRes;
      setDocTypes(Array.isArray(td) ? td : td?.items || []);
    } catch (err) {
      toast.error(err.message || "Failed to load vendor details");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchVendor(); }, [id]);

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.doc_type) { toast.error("Please select a document type"); return; }
    if (!uploadForm.file)     { toast.error("Please select a file"); return; }
    setUploading(true);
    try {
      await adminApi.uploadVendorDocument(id, uploadForm.doc_type, uploadForm.file, uploadForm.doc_number);
      toast.success("Document uploaded");
      setUploadForm({ doc_type: "", doc_number: "", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchVendor();
    } catch (err) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDocEntryDelete = async (doc) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      if (doc.file_index !== null && doc.file_index !== undefined)
        await adminApi.deleteVendorDocumentEntry(id, doc.doc_type, doc.file_index);
      else
        await adminApi.deleteVendorDocument(id, doc.doc_type);
      toast.success("Document deleted");
      await fetchVendor();
    } catch (err) { toast.error(err.message || "Delete failed"); }
  };

  const handleDocAction = async () => {
    setActionLoading(true);
    const statusMap = { approve: "verified", reject: "rejected", resubmit: "resubmit" };
    try {
      await adminApi.updateVendorStatus(id, {
        document_verify_status: statusMap[actionModal.type],
        rejection_reason: reason || null,
      });
      toast.success("Status updated — notification sent");
      await fetchVendor();
      setActionModal({ open: false, type: "" });
      setReason("");
    } catch (err) { toast.error(err.message || "Action failed"); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-blue-600 animate-spin" />
      </div>
    </Layout>
  );

  if (!vendor) return (
    <Layout>
      <div className="text-center py-16 text-sm text-gray-400">Vendor not found</div>
    </Layout>
  );

  const initials = (vendor.name || "V").charAt(0).toUpperCase();
  const documents = vendor.documents || [];
  const products  = vendor.products  || [];
  const serviceProvider = vendor.service_provider || null;

  const basicFields = [
    ["Name", vendor.name], ["Email", vendor.email], ["Mobile", vendor.mobile],
    ["WhatsApp", vendor.whatsappno], ["Landline", vendor.landlineno],
    ["Company Name", vendor.company_name], ["Firm Type", vendor.firm_type],
    ["Company Status", vendor.company_status], ["Country", vendor.country],
    ["State", vendor.state], ["City", vendor.city], ["District", vendor.district],
    ["Pin Code", vendor.pin_code], ["Address", vendor.address],
    ["GST Number", vendor.gst_no], ["PAN Number", vendor.pan_no],
    ["TAN Number", vendor.tan_no], ["VAT Number", vendor.vat_no],
    ["MSME Number", vendor.msme_number], ["Annual Turnover", vendor.annual_turnover],
    ["Website", vendor.website], ["Fax", vendor.fax],
    ["Contact Person", vendor.contact_person_name], ["Designation", vendor.designation],
    ["Business Description", vendor.business_description],
    ["Verification", vendor.verification_status], ["Document Status", vendor.document_verify_status],
    ["Registered On", vendor.created_at ? new Date(vendor.created_at).toLocaleDateString("en-IN") : "—"],
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-blue-600">{initials}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{vendor.name || "Vendor"}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{vendor.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(vendor.verification_status)}`}>
                    {vendor.verification_status || "unverified"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(vendor.document_verify_status)}`}>
                    Docs: {vendor.document_verify_status || "pending"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${vendor.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {vendor.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {vendor.document_verify_status !== "verified" && (
                <button onClick={() => setActionModal({ open: true, type: "approve" })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <HiCheckCircle className="w-4 h-4" /> Approve
                </button>
              )}
              {vendor.document_verify_status !== "verified" && vendor.document_verify_status !== "rejected" && (
                <button onClick={() => setActionModal({ open: true, type: "reject" })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <HiBan className="w-4 h-4" /> Reject
                </button>
              )}
              {vendor.document_verify_status !== "verified" && vendor.document_verify_status !== "resubmit" && (
                <button onClick={() => setActionModal({ open: true, type: "resubmit" })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                  <HiRefresh className="w-4 h-4" /> Resubmit
                </button>
              )}
              {vendor.document_verify_status === "verified" && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-semibold">
                  <HiCheckCircle className="w-4 h-4" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pill Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Basic Details */}
        {activeTab === "basic" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Basic Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {basicFields.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{value || "—"}</p>
                </div>
              ))}
            </div>
            {vendor.services?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((s, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {activeTab === "documents" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Upload Document</h2>
              <form onSubmit={handleDocUpload} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Document Type</label>
                  <div className="relative">
                    <select value={uploadForm.doc_type}
                      onChange={(e) => setUploadForm((p) => ({ ...p, doc_type: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white">
                      <option value="">— Select —</option>
                      {docTypes.map((dt) => (
                        <option key={dt.id || dt.doc_type} value={dt.doc_type || dt.id}>{dt.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Document Number</label>
                  <input type="text" value={uploadForm.doc_number}
                    onChange={(e) => setUploadForm((p) => ({ ...p, doc_number: e.target.value }))}
                    placeholder="e.g. GST1234567"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">File</label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setUploadForm((p) => ({ ...p, file: e.target.files[0] }))}
                    className="block w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <button type="submit" disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                  <HiUpload className="w-4 h-4" />{uploading ? "Uploading..." : "Upload"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Uploaded Documents</h2>
              </div>
              {documents.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-400">No documents uploaded</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {doc.name || doc.doc_type?.replace(/_/g, " ") || `Document ${idx + 1}`}
                        </p>
                        {doc.input_value && <p className="text-xs text-gray-400 mt-0.5 font-mono">{doc.input_value}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.file_url && (
                          <>
                            <button onClick={() => openBase64File(doc.file_url, doc.mime)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                              <HiEye className="w-3.5 h-3.5" /> View
                            </button>
                            <button onClick={() => {
                              const data = doc.file_url.includes(",") ? doc.file_url.split(",")[1] : doc.file_url;
                              const a = document.createElement("a");
                              a.href = `data:${doc.mime || "application/octet-stream"};base64,${data}`;
                              a.download = doc.name || doc.doc_type || "document";
                              a.click();
                            }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                              <HiDownload className="w-3.5 h-3.5" /> Download
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDocEntryDelete(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                          <HiTrash className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Products</h2>
            </div>
            {products.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">No products found</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["#", "Name", "Category", "Price"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p, i) => (
                    <tr key={p.id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{p.category_name || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{p.regular_price ? `₹${Number(p.regular_price).toLocaleString("en-IN")}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Service Provider */}
        {activeTab === "service" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Service Provider Details</h2>
            {!serviceProvider ? (
              <p className="text-center text-sm text-gray-400 py-8">No service provider details available</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(serviceProvider).map(([key, value]) => {
                  if (["id","user_id","created_at","updated_at","_sa_instance_state"].includes(key)) return null;
                  if (value === null || value === undefined) return null;
                  return (
                    <div key={key}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-900 mt-0.5">
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {actionModal.type === "approve" ? "Approve Documents" : actionModal.type === "reject" ? "Reject Documents" : "Request Resubmission"}
              </h3>
              <button onClick={() => { setActionModal({ open: false, type: "" }); setReason(""); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"><HiX className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5">
              {actionModal.type === "approve" ? (
                <p className="text-sm text-gray-600">Approve this vendor's documents? An approval email will be sent automatically.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {actionModal.type === "reject" ? "Reason for rejection:" : "Reason for resubmission:"}
                  </p>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Enter reason..." />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setActionModal({ open: false, type: "" }); setReason(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDocAction}
                disabled={actionLoading || (actionModal.type !== "approve" && !reason.trim())}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors ${
                  actionModal.type === "approve" ? "bg-green-600 hover:bg-green-700"
                  : actionModal.type === "reject" ? "bg-red-600 hover:bg-red-700"
                  : "bg-orange-500 hover:bg-orange-600"
                }`}>
                <HiMail className="w-4 h-4" />
                {actionLoading ? "Processing..." : actionModal.type === "approve" ? "Approve & Notify" : actionModal.type === "reject" ? "Reject & Notify" : "Request & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
