import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiPhotograph, HiUpload } from "react-icons/hi";
import Layout from "../../components/Layout.jsx";
import { adminApi } from "../../services/api.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:8000";

export default function CompanyProfile() {
  const [form, setForm] = useState({ company_name: "", email: "", contact_number: "", office_address: "", city: "", state: "", country: "", pincode: "" });
  const [logoPreview, setLogoPreview]     = useState(null);
  const [logoFile, setLogoFile]           = useState(null);
  const [regImagePreview, setRegImagePreview] = useState(null);
  const [regImageFile, setRegImageFile]   = useState(null);
  const [panImagePreview, setPanImagePreview] = useState(null);
  const [panImageFile, setPanImageFile]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    adminApi.getCompanyProfile()
      .then(res => {
        const data = res.data || res;
        setForm({ company_name: data.company_name || "", email: data.email || "", contact_number: data.contact_number || "", office_address: data.office_address || "", city: data.city || "", state: data.state || "", country: data.country || "", pincode: data.pincode || "" });
        if (data.company_logo)       setLogoPreview(`${BASE_URL}/uploads/${data.company_logo}`);
        if (data.registration_image) setRegImagePreview(`${BASE_URL}/uploads/${data.registration_image}`);
        if (data.pan_card_image)     setPanImagePreview(`${BASE_URL}/uploads/${data.pan_card_image}`);
      })
      .catch(err => toast.error(err.message || "Failed to load company profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "logo")         { setLogoFile(file);     setLogoPreview(preview); }
    else if (type === "registration") { setRegImageFile(file); setRegImagePreview(preview); }
    else if (type === "pan")     { setPanImageFile(file); setPanImagePreview(preview); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateCompanyProfile(form);
      const uploads = [];
      if (logoFile)     uploads.push(adminApi.uploadCompanyLogo(logoFile));
      if (regImageFile) uploads.push(adminApi.uploadCompanyRegistrationImage(regImageFile));
      if (panImageFile) uploads.push(adminApi.uploadCompanyPanImage(panImageFile));
      if (uploads.length > 0) await Promise.all(uploads);
      toast.success("Company profile updated");
      setLogoFile(null); setRegImageFile(null); setPanImageFile(null);
    } catch (err) { toast.error(err.message || "Failed to update"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-blue-600 animate-spin" />
      </div>
    </Layout>
  );

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  const textFields = [
    { key: "company_name",   label: "Company Name",    type: "text" },
    { key: "email",          label: "Email",           type: "email" },
    { key: "contact_number", label: "Contact Number",  type: "tel" },
    { key: "office_address", label: "Office Address",  type: "text", full: true },
    { key: "city",           label: "City",            type: "text" },
    { key: "state",          label: "State",           type: "text" },
    { key: "country",        label: "Country",         type: "text" },
    { key: "pincode",        label: "Pincode",         type: "text" },
  ];

  const imageUploads = [
    { key: "logo",         label: "Company Logo",       preview: logoPreview,     onChange: e => handleFileChange(e, "logo") },
    { key: "registration", label: "Registration Image", preview: regImagePreview, onChange: e => handleFileChange(e, "registration") },
    { key: "pan",          label: "PAN Card Image",     preview: panImagePreview, onChange: e => handleFileChange(e, "pan") },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your company information and branding assets</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {textFields.map(f => (
                <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className={inp} />
                </div>
              ))}
            </div>
          </div>

          {/* Company Images */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Company Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {imageUploads.map(img => (
                <div key={img.key} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-500">{img.label}</p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center min-h-[140px]">
                    {img.preview
                      ? <img src={img.preview} alt={img.label} className="w-full h-36 object-contain p-2" />
                      : <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
                          <HiPhotograph className="w-10 h-10" />
                          <span className="text-xs text-gray-400">No image</span>
                        </div>}
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer font-medium">
                    <HiUpload className="w-4 h-4" /> Upload
                    <input type="file" accept="image/*" onChange={img.onChange} className="hidden" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
