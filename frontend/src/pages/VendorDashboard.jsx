import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    FiBriefcase,
    FiCheckCircle,
    FiFile,
    FiLoader,
    FiPlus,
    FiTrash2,
    FiUpload,
    FiUser,
} from "react-icons/fi";
import Layout from "../components/Layout.jsx";
import { vendorApi } from "../services/api.js";

/* ────────────────────────────── helpers ────────────────────────────── */

const FIRM_TYPES = [
  "PSU",
  "Public Ltd",
  "Private Ltd",
  "OPC",
  "LLP",
  "Trust",
  "Sole Proprietorship",
  "NGO",
];

const COMPANY_STATUSES = [
  "Manufacturer/OEM",
  "Subsidiary",
  "Joint Venture",
  "Service Provider",
];

const emptyFactory = () => ({ address: "", city: "", state: "" });

/* ────────────────────── reusable field components ─────────────────── */

function InputField({ label, name, value, onChange, type = "text", readOnly = false, placeholder = "", required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
          readOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder = "Select...", required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={typeof opt === "object" ? opt.value : opt} value={typeof opt === "object" ? opt.value : opt}>
            {typeof opt === "object" ? opt.label : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, name, value, onChange, rows = 3, placeholder = "", required = false }) {
  return (
    <div className="col-span-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

/* ────────────────────────── tab button ─────────────────────────────── */

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 1 — Basic Details
   ══════════════════════════════════════════════════════════════════════ */

function BasicDetailsTab() {
  const [form, setForm] = useState({
    company_name: "",
    email: "",
    firm_type: "",
    company_status: "",
    country: "",
    state: "",
    district: "",
    zip_code: "",
    city: "",
    apartment: "",
    street_address: "",
    country_code: "",
    phone_landline: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await vendorApi.getProfile();
        const data = res?.data ?? res;
        setForm((prev) => ({
          ...prev,
          company_name: data.company_name || "",
          email: data.email || "",
          firm_type: data.firm_type || "",
          company_status: data.company_status || "",
          country: data.country || "",
          state: data.state || "",
          district: data.district || "",
          zip_code: data.pin_code || data.zip_code || "",
          city: data.city || "",
          apartment: data.apartment || "",
          street_address: data.address || data.street_address || "",
          country_code: data.country_code || "",
          phone_landline: data.phone_landline || data.mobile || "",
          website: data.website || "",
        }));
      } catch (err) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorApi.completeOnboarding(form);
      toast.success("Basic details saved successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading profile...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InputField label="Name of Company" name="company_name" value={form.company_name} onChange={handleChange} required />
        <InputField label="Email Address" name="email" value={form.email} onChange={handleChange} readOnly />
        <SelectField label="Type of Firm" name="firm_type" value={form.firm_type} onChange={handleChange} options={FIRM_TYPES} required />
        <SelectField label="Status of Company" name="company_status" value={form.company_status} onChange={handleChange} options={COMPANY_STATUSES} required />
        <InputField label="Country" name="country" value={form.country} onChange={handleChange} required />
        <InputField label="State / Province" name="state" value={form.state} onChange={handleChange} required />
        <InputField label="District" name="district" value={form.district} onChange={handleChange} />
        <InputField label="ZIP / Postal Code" name="zip_code" value={form.zip_code} onChange={handleChange} required />
        <InputField label="City / Town / Village" name="city" value={form.city} onChange={handleChange} required />
        <InputField label="Apartment / Local Area" name="apartment" value={form.apartment} onChange={handleChange} />
        <TextareaField label="Street / Address" name="street_address" value={form.street_address} onChange={handleChange} />
        <InputField label="Country Code" name="country_code" value={form.country_code} onChange={handleChange} placeholder="+91" />
        <InputField label="Phone / Landline" name="phone_landline" value={form.phone_landline} onChange={handleChange} required />
        <InputField label="Website" name="website" value={form.website} onChange={handleChange} placeholder="https://" />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 2 — Upload Documents
   ══════════════════════════════════════════════════════════════════════ */

function UploadDocumentsTab() {
  const [docTypes, setDocTypes] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [entries, setEntries] = useState([{ doc_number: "", file: null }]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [typesRes, docsRes] = await Promise.all([
        vendorApi.getDocumentTypes(),
        vendorApi.getDocuments(),
      ]);
      const td = typesRes?.data || typesRes;
      setDocTypes(Array.isArray(td) ? td : td?.items || []);
      const dd = docsRes?.data || docsRes;
      setUploadedDocs(Array.isArray(dd) ? dd : []);
    } catch (err) {
      toast.error(err.message || "Failed to load document data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addEntry = () => setEntries((prev) => [...prev, { doc_number: "", file: null }]);

  const removeEntry = (idx) => setEntries((prev) => prev.filter((_, i) => i !== idx));

  const updateEntry = (idx, field, value) => {
    setEntries((prev) => prev.map((entry, i) => (i === idx ? { ...entry, [field]: value } : entry)));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedDocType) {
      toast.error("Please select a document type");
      return;
    }
    const validEntries = entries.filter((en) => en.file);
    if (validEntries.length === 0) {
      toast.error("Please attach at least one file");
      return;
    }
    setUploading(true);
    try {
      for (const entry of validEntries) {
        await vendorApi.uploadDocumentFile(selectedDocType, entry.file, entry.doc_number);
      }
      toast.success("Documents uploaded successfully");
      setEntries([{ doc_number: "", file: null }]);
      setSelectedDocType("");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docType, index) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      if (typeof index === "number" && index >= 0) {
        await vendorApi.deleteDocumentEntry(docType, index);
      } else {
        await vendorApi.deleteDocument(docType);
      }
      toast.success("Document deleted");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <form onSubmit={handleUpload} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-800">Upload New Documents</h3>

        <div className="max-w-sm">
          <SelectField
            label="Document Type"
            name="doc_type"
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            options={docTypes.map((dt) => ({ value: dt.doc_type || dt.id, label: dt.name || dt.title }))}
            placeholder="Select document type..."
            required
          />
        </div>

        {selectedDocType && (
          <div className="space-y-3">
            {entries.map((entry, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-white rounded-lg border border-gray-200 p-4">
                <InputField
                  label="Document Number"
                  name={`doc_number_${idx}`}
                  value={entry.doc_number}
                  onChange={(e) => updateEntry(idx, "doc_number", e.target.value)}
                  placeholder="e.g. GST1234567"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                  <input
                    type="file"
                    onChange={(e) => updateEntry(idx, "file", e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div className="flex gap-2">
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(idx)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                  {idx === entries.length - 1 && (
                    <button
                      type="button"
                      onClick={addEntry}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <FiPlus className="w-4 h-4" /> Add More
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiUpload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </form>

      {/* Uploaded documents table */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Uploaded Documents</h3>
        {uploadedDocs.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center bg-gray-50 rounded-xl border border-gray-200">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Document Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Document No.</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">File</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {uploadedDocs.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{doc.doc_type_name || doc.doc_type || doc.type || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.input_value || doc.doc_number || "-"}</td>
                    <td className="px-4 py-3">
                      {doc.file_url || doc.file_path ? (
                        <a
                          href={doc.file_url || doc.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FiFile className="w-4 h-4" /> View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.status === "verified" || doc.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : doc.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {doc.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.doc_type || doc.type, doc.index ?? idx)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        <FiTrash2 className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 3 — Business & Product Details
   ══════════════════════════════════════════════════════════════════════ */

function BusinessDetailsTab() {
  const [form, setForm] = useState({
    number_of_employees: "",
    epfo_register_number: "",
    registered_address: "",
    head_office_address: "",
    product_category: "",
    product_sub_category: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
  });
  const [epfoFile, setEpfoFile] = useState(null);
  const [branchFiles, setBranchFiles] = useState([]);
  const [factories, setFactories] = useState([emptyFactory()]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, docsRes, catData] = await Promise.all([
          vendorApi.getProfile(),
          vendorApi.getDocuments().catch(() => null),
          vendorApi.getCategoryTree().catch(() => ({ data: [] })),
        ]);
        const biz = profileRes?.data ?? profileRes;
        const docs = docsRes?.data ?? docsRes;
        // Load contact persons from vendor documents if available
        const firstContact = docs?.contact_persons?.[0] || {};
        setForm((prev) => ({
          ...prev,
          number_of_employees: docs?.number_of_employees || biz.number_of_employees || "",
          epfo_register_number: docs?.epfo_register_number || biz.epfo_register_number || "",
          registered_address: docs?.registered_address || biz.registered_address || "",
          head_office_address: docs?.head_office_address || biz.head_office_address || "",
          contact_person_name: firstContact.name || biz.contact_person_name || "",
          contact_person_email: firstContact.email || biz.email || "",
          contact_person_phone: firstContact.phone || biz.mobile || "",
        }));
        if (docs?.factory_addresses?.length > 0) {
          setFactories(docs.factory_addresses);
        }
        const cats = Array.isArray(catData?.data) ? catData.data : Array.isArray(catData) ? catData : [];
        setCategories(cats);
        if (biz.product_category) {
          const parentCat = cats.find(
            (c) => String(c.id) === String(biz.product_category) || c.name === biz.product_category
          );
          if (parentCat?.children) setSubCategories(parentCat.children);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load business details");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "product_category") {
      const cat = categories.find((c) => String(c.id) === value || c.name === value);
      setSubCategories(cat?.children || []);
      setForm((prev) => ({ ...prev, product_sub_category: "" }));
    }
  };

  const updateFactory = (idx, field, value) => {
    setFactories((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };

  const addFactory = () => setFactories((prev) => [...prev, emptyFactory()]);
  const removeFactory = (idx) => setFactories((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        number_of_employees: form.number_of_employees ? parseInt(form.number_of_employees) : null,
        epfo_register_number: form.epfo_register_number || null,
        registered_address: form.registered_address || null,
        head_office_address: form.head_office_address || null,
        factory_addresses: factories.filter((f) => f.address),
        contact_persons: form.contact_person_name
          ? [{ name: form.contact_person_name, email: form.contact_person_email || null, phone: form.contact_person_phone || "" }]
          : null,
        product_categories: form.product_category
          ? [{ category: form.product_category, sub_category: form.product_sub_category || null }]
          : null,
      };
      await vendorApi.updateBusinessDetails(payload);

      // Upload EPFO file if selected
      if (epfoFile) {
        await vendorApi.uploadBusinessFile("epfo_file", epfoFile);
      }

      // Upload branch office files
      if (branchFiles.length > 0) {
        for (const file of branchFiles) {
          await vendorApi.uploadBusinessFile("brand_office_files", file);
        }
      }

      toast.success("Business details saved successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save business details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading business details...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Info */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField label="Total Number of Employees" name="number_of_employees" value={form.number_of_employees} onChange={handleChange} type="number" />
          <InputField label="EPFO Registration No." name="epfo_register_number" value={form.epfo_register_number} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EPFO File</label>
            <input
              type="file"
              onChange={(e) => setEpfoFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Addresses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextareaField label="Registered Address" name="registered_address" value={form.registered_address} onChange={handleChange} />
          <TextareaField label="Head Office Address" name="head_office_address" value={form.head_office_address} onChange={handleChange} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch Office Files</label>
          <input
            type="file"
            multiple
            onChange={(e) => setBranchFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {branchFiles.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">{branchFiles.length} file(s) selected</p>
          )}
        </div>
      </div>

      {/* Product Category */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField
            label="Product Category"
            name="product_category"
            value={form.product_category}
            onChange={handleChange}
            options={categories.map((c) => ({ value: c.id || c.name, label: c.name }))}
          />
          <SelectField
            label="Product Sub Category"
            name="product_sub_category"
            value={form.product_sub_category}
            onChange={handleChange}
            options={subCategories.map((c) => ({ value: c.id || c.name, label: c.name }))}
            placeholder={subCategories.length === 0 ? "Select a category first" : "Select..."}
          />
        </div>
      </div>

      {/* Contact Person */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Contact Person</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField label="Name" name="contact_person_name" value={form.contact_person_name} onChange={handleChange} />
          <InputField label="Email" name="contact_person_email" value={form.contact_person_email} onChange={handleChange} type="email" />
          <InputField label="Phone" name="contact_person_phone" value={form.contact_person_phone} onChange={handleChange} />
        </div>
      </div>

      {/* Factory Addresses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Factory Addresses</h3>
          <button
            type="button"
            onClick={addFactory}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <FiPlus className="w-4 h-4" /> Add Factory
          </button>
        </div>
        <div className="space-y-3">
          {factories.map((factory, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-gray-50 rounded-lg border border-gray-200 p-4">
              <InputField
                label="Address"
                name={`factory_address_${idx}`}
                value={factory.address}
                onChange={(e) => updateFactory(idx, "address", e.target.value)}
              />
              <InputField
                label="City"
                name={`factory_city_${idx}`}
                value={factory.city}
                onChange={(e) => updateFactory(idx, "city", e.target.value)}
              />
              <InputField
                label="State"
                name={`factory_state_${idx}`}
                value={factory.state}
                onChange={(e) => updateFactory(idx, "state", e.target.value)}
              />
              <div>
                {factories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFactory(idx)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN — Vendor Dashboard
   ══════════════════════════════════════════════════════════════════════ */

const TABS = [
  { key: "basic", label: "Basic Details", icon: FiUser },
  { key: "documents", label: "Upload Documents", icon: FiUpload },
  { key: "business", label: "Business & Product Details", icon: FiBriefcase },
];

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Complete your vendor onboarding by filling in the details below.</p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              icon={tab.icon}
              label={tab.label}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 lg:p-8">
          {activeTab === "basic" && <BasicDetailsTab />}
          {activeTab === "documents" && <UploadDocumentsTab />}
          {activeTab === "business" && <BusinessDetailsTab />}
        </div>
      </div>
    </Layout>
  );
}
