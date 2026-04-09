import React, { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";

/* ── Design system colors ── */
const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

const INDUSTRY_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Electronics",
  "IT",
  "Civil",
  "HVAC",
  "Plumbing",
  "Fire Safety",
  "Security Systems",
  "Automation",
  "Fabrication",
  "Transportation",
  "Cleaning & Housekeeping",
  "Catering",
  "Manpower Supply",
  "Other",
];

const EMPTY_SERVICE_CENTER = {
  address: "",
  city: "",
  state: "",
  pin_code: "",
  contact_person: "",
  phone: "",
};

const INITIAL_FORM = {
  // Company Information
  company_name: "",
  registered_address: "",
  country: "",
  state: "",
  city: "",
  zip: "",
  phone: "",
  website: "",
  // Contact Person
  contact_name: "",
  contact_designation: "",
  contact_email: "",
  // Business Details
  type_of_firm: "",
  nature_of_business: "",
  primary_services: "",
  secondary_services: "",
  // Tax & Registration
  gst_no: "",
  tan_no: "",
  pan_no: "",
  epfo_no: "",
  company_reg_no: "",
  msme_available: "no",
  msme_details: "",
  iso_available: "no",
  iso_details: "",
  // Industry Category
  industry_categories: [],
  // Financial
  annual_turnover: "",
  // Experience
  existing_clients: "",
  past_experience: "",
  // Authorization
  auth_name: "",
  auth_designation: "",
  auth_date: "",
  auth_phone: "",
  auth_email: "",
};

/* ── Inline SVG icons for section headers ── */
const SvgCompany = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
  </svg>
);
const SvgContact = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);
const SvgBusiness = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01M3 13a20 20 0 0018 0"/>
  </svg>
);
const SvgTax = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const SvgTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
  </svg>
);
const SvgFinancial = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const SvgExperience = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
  </svg>
);
const SvgLocation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);
const SvgShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
);
const SvgPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SvgTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const SvgDoc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const SvgUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const SvgX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function SectionHeader({ svg, title, color }) {
  const c = color || C.blue;
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: c.bg, color: c.text }}
      >
        {svg}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
    </div>
  );
}

function FileDropZone({ label, file, onFileDrop, onClear, savedName }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFileDrop(accepted[0]);
    },
    [onFileDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
  });

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>}
      {/* Already-saved indicator */}
      {savedName && !file && (
        <div className="flex items-center gap-2 mb-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span className="truncate">Saved: {savedName}</span>
        </div>
      )}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition text-sm ${
          isDragActive ? "border-blue-400" : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
        style={isDragActive ? { background: C.blue.bg } : {}}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <span style={{ color: C.blue.text }}><SvgDoc /></span>
            <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-red-400 hover:text-red-600 transition"
            >
              <SvgX />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <SvgUpload />
            <span>{savedName ? "Replace file" : "Drop file or click to browse"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MultiFileDropZone({ label, files, onFilesDrop, onRemoveFile }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFilesDrop(accepted);
    },
    [onFilesDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
  });

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition text-sm ${
          isDragActive ? "border-blue-400" : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
        style={isDragActive ? { background: C.blue.bg } : {}}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <SvgUpload />
          <span>Drop files or click to browse (multiple)</span>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg text-sm border border-gray-100">
              <span className="text-gray-700 truncate">{f.name}</span>
              <button type="button" onClick={() => onRemoveFile(i)} className="text-red-400 hover:text-red-600 transition ml-2">
                <SvgX />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ServiceProvider() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [serviceCenters, setServiceCenters] = useState([{ ...EMPTY_SERVICE_CENTER }]);
  const [files, setFiles] = useState({
    gst_file: null,
    tan_file: null,
    pan_file: null,
    msme_file: null,
    client_references_file: null,
  });
  const [financialFiles, setFinancialFiles] = useState([]);
  const [savedDocs, setSavedDocs] = useState({});   // filenames already in DB
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await vendorApi.getServiceProvider();
      const sp = res?.data?.data || res?.data || null;
      if (sp && sp.id) {
        // Map backend field names → frontend form field names
        setForm({
          company_name:        sp.company_name        || "",
          registered_address:  sp.registered_address  || "",
          country:             sp.country             || "",
          state:               sp.state               || "",
          city:                sp.city                || "",
          zip:                 sp.zip_code            || "",  // zip_code → zip
          phone:               sp.phone_number        || "",  // phone_number → phone
          website:             sp.website             || "",
          contact_name:        sp.contact_person      || "",  // contact_person → contact_name
          contact_designation: sp.designation         || "",  // designation → contact_designation
          contact_email:       sp.contact_email       || "",
          type_of_firm:        sp.firm_type           || "",  // firm_type → type_of_firm
          nature_of_business:  sp.nature_of_business  || "",
          primary_services:    sp.primary_services    || "",
          secondary_services:  sp.secondary_services  || "",
          gst_no:              sp.gst_number          || "",  // gst_number → gst_no
          tan_no:              sp.tan_number          || "",  // tan_number → tan_no
          pan_no:              sp.pan_number          || "",  // pan_number → pan_no
          epfo_no:             sp.epfo_number         || "",  // epfo_number → epfo_no
          company_reg_no:      sp.company_reg_number  || "",  // company_reg_number → company_reg_no
          msme_available:      sp.msme_available      || "no",
          msme_details:        sp.msme_details        || "",
          iso_available:       sp.iso_available       || "no",
          iso_details:         sp.iso_details         || "",
          industry_categories: sp.industry_categories || [],
          annual_turnover:     sp.annual_turnover     || "",
          existing_clients:    sp.existing_clients    || "",
          past_experience:     sp.past_experience     || "",
          auth_name:           sp.auth_name           || "",
          auth_designation:    sp.auth_designation    || "",
          auth_date:           sp.auth_date           || "",
          auth_phone:          sp.auth_phone          || "",
          auth_email:          sp.auth_email          || "",
        });
        if (sp.service_centers?.length) setServiceCenters(sp.service_centers);
        setIsUpdate(true);

        // Load saved document metadata
        try {
          const docRes = await vendorApi.getSPDocuments();
          setSavedDocs(docRes?.data?.data || docRes?.data || {});
        } catch { /* ignore */ }
      }
    } catch {
      // No existing data, fresh form
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (cat) => {
    setForm((prev) => {
      const cats = prev.industry_categories.includes(cat)
        ? prev.industry_categories.filter((c) => c !== cat)
        : [...prev.industry_categories, cat];
      return { ...prev, industry_categories: cats };
    });
  };

  const handleServiceCenterChange = (index, field, value) => {
    setServiceCenters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addServiceCenter = () => {
    setServiceCenters((prev) => [...prev, { ...EMPTY_SERVICE_CENTER }]);
  };

  const removeServiceCenter = (index) => {
    setServiceCenters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Build JSON payload with backend field names (not FormData)
      const payload = {
        company_name:        form.company_name        || null,
        registered_address:  form.registered_address  || null,
        country:             form.country             || null,
        state:               form.state               || null,
        city:                form.city                || null,
        zip_code:            form.zip                 || null,  // zip → zip_code
        phone_number:        form.phone               || null,  // phone → phone_number
        website:             form.website             || null,
        contact_person:      form.contact_name        || null,  // contact_name → contact_person
        designation:         form.contact_designation || null,  // contact_designation → designation
        contact_email:       form.contact_email       || null,
        firm_type:           form.type_of_firm        || null,  // type_of_firm → firm_type
        nature_of_business:  form.nature_of_business  || null,
        primary_services:    form.primary_services    || null,
        secondary_services:  form.secondary_services  || null,
        gst_number:          form.gst_no              || null,  // gst_no → gst_number
        tan_number:          form.tan_no              || null,  // tan_no → tan_number
        pan_number:          form.pan_no              || null,  // pan_no → pan_number
        epfo_number:         form.epfo_no             || null,  // epfo_no → epfo_number
        company_reg_number:  form.company_reg_no      || null,  // company_reg_no → company_reg_number
        msme_available:      form.msme_available      || null,
        msme_details:        form.msme_details        || null,
        iso_available:       form.iso_available       || null,
        iso_details:         form.iso_details         || null,
        industry_categories: form.industry_categories.length ? form.industry_categories : null,
        annual_turnover:     form.annual_turnover     || null,
        existing_clients:    form.existing_clients    || null,
        past_experience:     form.past_experience     || null,
        auth_name:           form.auth_name           || null,
        auth_designation:    form.auth_designation    || null,
        auth_date:           form.auth_date           || null,
        auth_phone:          form.auth_phone          || null,
        auth_email:          form.auth_email          || null,
        service_centers:     serviceCenters.length    ? serviceCenters : null,
      };

      if (isUpdate) {
        await vendorApi.updateServiceProvider(payload);
      } else {
        await vendorApi.createServiceProvider(payload);
        setIsUpdate(true);
      }

      // Upload any new document files
      const fileEntries = Object.entries(files).filter(([, f]) => f !== null);
      const totalFiles = fileEntries.length + financialFiles.length;
      let uploaded = 0;

      for (const [docType, file] of fileEntries) {
        const fd = new FormData();
        fd.append("doc_type", docType);
        fd.append("file", file);
        await vendorApi.uploadSPDocument(fd);
        uploaded++;
      }

      for (let i = 0; i < financialFiles.length; i++) {
        const fd = new FormData();
        fd.append("doc_type", `financial_statement_${i}`);
        fd.append("file", financialFiles[i]);
        await vendorApi.uploadSPDocument(fd);
        uploaded++;
      }

      // Refresh saved doc metadata
      try {
        const docRes = await vendorApi.getSPDocuments();
        setSavedDocs(docRes?.data?.data || docRes?.data || {});
      } catch { /* ignore */ }

      // Clear new file selections after upload
      if (uploaded > 0) {
        setFiles({ gst_file: null, tan_file: null, pan_file: null, msme_file: null, client_references_file: null });
        setFinancialFiles([]);
      }

      toast.success(
        totalFiles > 0
          ? `Saved successfully with ${totalFiles} document${totalFiles > 1 ? "s" : ""} uploaded`
          : "Service provider details saved successfully"
      );
    } catch (err) {
      toast.error(err.message || "Failed to save service provider details");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition";
  const textareaClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition resize-none";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-6 h-6 rounded-full border-2 border-gray-200 border-t-blue-500 mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service Provider Registration</h1>
          <p className="text-xs text-gray-400 mt-0.5">Complete your service provider profile for vendor portal approval</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Company Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgCompany />} title="Company Information" color={C.blue} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Company Name</label>
                  <input type="text" name="company_name" value={form.company_name} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Registered Address</label>
                  <input type="text" name="registered_address" value={form.registered_address} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" name="country" value={form.country} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ZIP Code</label>
                  <input type="text" name="zip" value={form.zip} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="text" name="website" value={form.website} onChange={handleChange} placeholder="https://" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgContact />} title="Contact Person" color={C.violet} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" name="contact_name" value={form.contact_name} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Designation</label>
                  <input type="text" name="contact_designation" value={form.contact_designation} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgBusiness />} title="Business Details" color={C.amber} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Type of Firm</label>
                  <select name="type_of_firm" value={form.type_of_firm} onChange={handleChange} className={inputClass + " bg-white"}>
                    <option value="">-- Select --</option>
                    <option value="proprietorship">Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="llp">LLP</option>
                    <option value="pvt_ltd">Private Limited</option>
                    <option value="public_ltd">Public Limited</option>
                    <option value="trust">Trust / Society</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nature of Business</label>
                  <input type="text" name="nature_of_business" value={form.nature_of_business} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Primary Services</label>
                  <textarea name="primary_services" value={form.primary_services} onChange={handleChange} rows={3} className={textareaClass} />
                </div>
                <div>
                  <label className={labelClass}>Secondary Services</label>
                  <textarea name="secondary_services" value={form.secondary_services} onChange={handleChange} rows={3} className={textareaClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Tax & Registration */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgTax />} title="Tax & Registration" color={C.emerald} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>GST No</label>
                    <input type="text" name="gst_no" value={form.gst_no} onChange={handleChange} className={inputClass} />
                  </div>
                  <FileDropZone
                    label="GST Certificate"
                    file={files.gst_file}
                    onFileDrop={(f) => setFiles((prev) => ({ ...prev, gst_file: f }))}
                    onClear={() => setFiles((prev) => ({ ...prev, gst_file: null }))}
                    savedName={savedDocs.gst_file?.filename}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>TAN No</label>
                    <input type="text" name="tan_no" value={form.tan_no} onChange={handleChange} className={inputClass} />
                  </div>
                  <FileDropZone
                    label="TAN Certificate"
                    file={files.tan_file}
                    onFileDrop={(f) => setFiles((prev) => ({ ...prev, tan_file: f }))}
                    onClear={() => setFiles((prev) => ({ ...prev, tan_file: null }))}
                    savedName={savedDocs.tan_file?.filename}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>PAN No</label>
                    <input type="text" name="pan_no" value={form.pan_no} onChange={handleChange} className={inputClass} />
                  </div>
                  <FileDropZone
                    label="PAN Card"
                    file={files.pan_file}
                    onFileDrop={(f) => setFiles((prev) => ({ ...prev, pan_file: f }))}
                    onClear={() => setFiles((prev) => ({ ...prev, pan_file: null }))}
                    savedName={savedDocs.pan_file?.filename}
                  />
                </div>
                <div>
                  <label className={labelClass}>EPFO No</label>
                  <input type="text" name="epfo_no" value={form.epfo_no} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Company Registration No</label>
                  <input type="text" name="company_reg_no" value={form.company_reg_no} onChange={handleChange} className={inputClass} />
                </div>

                {/* MSME */}
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>MSME Available</label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="msme_available"
                          value="yes"
                          checked={form.msme_available === "yes"}
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-100"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="msme_available"
                          value="no"
                          checked={form.msme_available === "no"}
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-100"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {form.msme_available === "yes" && (
                    <FileDropZone
                      label="MSME Certificate"
                      file={files.msme_file}
                      onFileDrop={(f) => setFiles((prev) => ({ ...prev, msme_file: f }))}
                      onClear={() => setFiles((prev) => ({ ...prev, msme_file: null }))}
                      savedName={savedDocs.msme_file?.filename}
                    />
                  )}
                </div>

                {/* ISO */}
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>ISO Available</label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="iso_available"
                          value="yes"
                          checked={form.iso_available === "yes"}
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-100"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="iso_available"
                          value="no"
                          checked={form.iso_available === "no"}
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-100"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {form.iso_available === "yes" && (
                    <div>
                      <label className={labelClass}>ISO Details</label>
                      <input type="text" name="iso_details" value={form.iso_details} onChange={handleChange} placeholder="e.g. ISO 9001:2015" className={inputClass} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Industry Category */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgTag />} title="Industry Category" color={C.violet} />
            </div>
            <div className="px-5 py-5">
              <p className="text-xs text-gray-400 mb-4">Select all applicable categories</p>
              <div className="flex flex-wrap gap-3">
                {INDUSTRY_CATEGORIES.map((cat) => {
                  const selected = form.industry_categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition"
                      style={
                        selected
                          ? { background: C.blue.text, color: "#fff", borderColor: C.blue.text }
                          : { background: "white", color: "#374151", borderColor: "#d1d5db" }
                      }
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgFinancial />} title="Financial Details" color={C.emerald} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Annual Turnover</label>
                  <input type="text" name="annual_turnover" value={form.annual_turnover} onChange={handleChange} placeholder="e.g. 50,00,000" className={inputClass} />
                </div>
                <div>
                  <MultiFileDropZone
                    label="Financial Statements"
                    files={financialFiles}
                    onFilesDrop={(newFiles) => setFinancialFiles((prev) => [...prev, ...newFiles])}
                    onRemoveFile={(i) => setFinancialFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                  {/* Show already-saved financial statements */}
                  {Object.keys(savedDocs).filter(k => k.startsWith("financial_statement_")).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.keys(savedDocs).filter(k => k.startsWith("financial_statement_")).map(k => (
                        <div key={k} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                          <span className="truncate">Saved: {savedDocs[k]?.filename || k}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgExperience />} title="Experience" color={C.amber} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Existing Clients</label>
                  <textarea name="existing_clients" value={form.existing_clients} onChange={handleChange} rows={4} className={textareaClass} placeholder="List your current major clients" />
                </div>
                <div>
                  <label className={labelClass}>Past Experience</label>
                  <textarea name="past_experience" value={form.past_experience} onChange={handleChange} rows={4} className={textareaClass} placeholder="Describe relevant past projects" />
                </div>
                <div className="md:col-span-2">
                  <FileDropZone
                    label="Client References (file)"
                    file={files.client_references_file}
                    onFileDrop={(f) => setFiles((prev) => ({ ...prev, client_references_file: f }))}
                    onClear={() => setFiles((prev) => ({ ...prev, client_references_file: null }))}
                    savedName={savedDocs.client_references_file?.filename}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Centers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgLocation />} title="Service Centers" color={C.blue} />
            </div>
            <div className="px-5 py-5">
              <div className="space-y-4">
                {serviceCenters.map((center, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-100 p-4"
                    style={{ background: C.blue.bg }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Service Center #{idx + 1}</span>
                      {serviceCenters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeServiceCenter(idx)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <SvgTrash />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</label>
                        <input
                          type="text"
                          value={center.address}
                          onChange={(e) => handleServiceCenterChange(idx, "address", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City</label>
                        <input
                          type="text"
                          value={center.city}
                          onChange={(e) => handleServiceCenterChange(idx, "city", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State</label>
                        <input
                          type="text"
                          value={center.state}
                          onChange={(e) => handleServiceCenterChange(idx, "state", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pin Code</label>
                        <input
                          type="text"
                          value={center.pin_code}
                          onChange={(e) => handleServiceCenterChange(idx, "pin_code", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Person</label>
                        <input
                          type="text"
                          value={center.contact_person}
                          onChange={(e) => handleServiceCenterChange(idx, "contact_person", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
                        <input
                          type="text"
                          value={center.phone}
                          onChange={(e) => handleServiceCenterChange(idx, "phone", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addServiceCenter}
                  className="flex items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
                  style={{ color: C.blue.text }}
                >
                  <SvgPlus />
                  Add Service Center
                </button>
              </div>
            </div>
          </div>

          {/* Authorization */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <SectionHeader svg={<SvgShield />} title="Authorization" color={C.emerald} />
            </div>
            <div className="px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Authorized Person Name</label>
                  <input type="text" name="auth_name" value={form.auth_name} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Designation</label>
                  <input type="text" name="auth_designation" value={form.auth_designation} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input type="date" name="auth_date" value={form.auth_date} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="text" name="auth_phone" value={form.auth_phone} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="auth_email" value={form.auth_email} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
              style={{ background: C.blue.text }}
            >
              {saving ? "Saving..." : isUpdate ? "Update Details" : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
