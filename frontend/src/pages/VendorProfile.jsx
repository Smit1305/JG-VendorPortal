import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";

/* ── Design system colors ── */
const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

/* ── service category options ── */
const MANUFACTURER_OPTS = [
  "ABRASIVES","AUTOMOTIVE CONSUMABLES","AUTOMOTIVES","AIR CONDITIONING & REFRIGERATION",
  "BEARING, BUSHINGS AND BELTINGS","BUILDING MATERIALS","BOILERS & FURNACES",
  "CHEMICALS, GASES & LABORATORY PRODUCTS","COMMISSARY & JANITORIAL SUPPLIES",
  "COMPRESSOR & COMPRESSOR SPARES","CRUSHING & GRINDING EQUIPMENT SPARES",
  "COMMUNICATION EQUIPMENTS","CONVEYING & HOISTING EQUIPMENT","COMPUTER & IT SPARES",
  "DRILLING & BLASTING","ELECTRICAL & ELECTRONIC COMMODITIES (GENERAL)",
  "ENAMELS, PAINTS, VARNISHES & THINNERS","EXPLOSIVES","ELECTRICAL PANELS & CONTACTORS",
  "ELECTRICAL EQUIPMENTS","EARTH MOVING EQUIPMENTS","EOT CRANE & ACCESSORIES",
  "FASTENERS & HARDWARE","FANS & BLOWERS","FILTERING, MIXING & SEPARATING DEVICES",
  "GENERATORS & MOTORS","GARAGE EQUIPMENT & AUTO ELECTRICAL",
  "HAND TOOLS, CUTTING TOOLS & TACKLES","HOSE & HOSE FITTINGS",
  "HEAT EXCHANGERS, DRYERS & COOLING TOWERS","INSULATION MATERIAL","INSTRUMENTATION",
  "INTERNAL COMBUSTION ENGINES & SPARES","MEDICINE & HOSPITAL ITEMS",
  "METALS (FERROUS)","METALS (NON-FERROUS)","MECHANICAL POWER TRANSMISSIONS",
  "MACHINE SHOP EQUIPMENTS & SPARES","MINE CAR & ACCESSORIES",
  "LAB EQUIPMENTS, INSTRUMENTS & APPARATUS","OIL, FUELS, GREASES & LUBRICANTS",
  "OSP CONTRACTS","PACKING SHEETS, GASKETS & OIL SEALS","PIPES & PIPE FITTINGS",
  "PUMPS & PUMP SPARES","REFRACTORIES","ROPE, CHAINS, TACKLES & MATERIAL HANDLING",
  "STATIONERY, PRINTING & PHOTOGRAPHIC MATERIALS","SAFETY & FIRE FIGHTING EQUIPMENT",
  "TEXTILES & CLOTHING MATERIALS","TIMBERS","TURBINES","VALVES & VALVE PARTS",
  "WELDING & METALLISING STORES","WATER TREATMENT PLANT EQUIPMENT & SPARES",
  "WELDING EQUIPMENT & ACCESSORIES",
];
const SERVICE_OPTS = [
  "Accounting and tax Services","After Sales Services","Calibration & Metrology",
  "Corporate Governance","Corporate Travel Desk","Customer Care Center",
  "Engineering Services","Environmental Services","Event Management",
  "Executive Services","Facility Management","Hire Purchase Services",
  "HR Services","Industrial & Commercial","Infrastructure Management",
  "Installation Services","IT Services","Legal Services","Management Consultancy",
  "Marketing & Communication","MRO Services","News & Media Services",
  "Printing Services","Procurement & Purchase","Product Approval Services",
  "Product Development","Quality Control Services","Repairing Services",
  "Security Services","Segment Under Contract","Sustainability Services",
  "Testing & Certification","Troubleshooting Services","Work Force Management",
];
const RAW_MATERIAL_OPTS = [
  "Agro","Ceramics & Glass","Chemicals","Construction","Cosmetics & Perfume",
  "Electrical & Electronics","Energy & Power","Fertilizers","Gems & Jewellery",
  "Herbs & Herbal Oil","Metals & Steel","Oil & Gas","Ore & Mineral","Paints",
  "Paper & Pulp","Pesticides & Insecticide","Pharmaceuticals & Drug",
  "Plastics & Polymer","Rubber & Elastomer","Wood & Laminate","Yarn & Fibre",
];

function getServiceOpts(companyStatus) {
  if (companyStatus === "MANUFACTURER") return MANUFACTURER_OPTS;
  if (companyStatus === "SERVICE PROVIDER") return SERVICE_OPTS;
  if (companyStatus === "RAW MATERIAL SUPPLIER") return RAW_MATERIAL_OPTS;
  return [];
}

const INITIAL_PROFILE = {
  full_name: "", email: "", mobile: "", landlineno: "", whatsappno: "",
  company_name: "", company_status: "", firm_type: "",
  country: "", city: "", state: "", district: "", pin_code: "", address: "", apartment: "",
  country_code: "", phone_landline: "", fax: "", website: "",
  gst_no: "", tan_no: "", pan_no: "", vat_no: "", msme_number: "",
  annual_turnover: "", business_description: "",
  contact_person_name: "", designation: "",
  services: [], photo_url: "",
};

const INITIAL_PASSWORD = { current_password: "", new_password: "", confirm_password: "" };

/* ── shared input styles ── */
const INP   = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder-gray-400";
const RO    = "w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed select-none";
const LABEL = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

export default function VendorProfile() {
  const [profile, setProfile]       = useState(INITIAL_PROFILE);
  const [passwords, setPasswords]   = useState(INITIAL_PASSWORD);
  const [commPrefs, setCommPrefs]   = useState({ email: true, sms: false, whatsapp: false });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res  = await vendorApi.getProfile();
      const data = res?.data ?? res;
      setProfile({
        full_name:           data.full_name || data.name || "",
        email:               data.email || "",
        mobile:              data.mobile || "",
        landlineno:          data.landlineno || "",
        whatsappno:          data.whatsappno || "",
        company_name:        data.company_name || "",
        company_status:      data.company_status || "",
        firm_type:           data.firm_type || "",
        country:             data.country || "",
        city:                data.city || "",
        state:               data.state || "",
        district:            data.district || "",
        pin_code:            data.pin_code || "",
        address:             data.address || "",
        apartment:           data.apartment || "",
        country_code:        data.country_code || "",
        phone_landline:      data.phone_landline || "",
        fax:                 data.fax || "",
        website:             data.website || "",
        gst_no:              data.gst_no || "",
        tan_no:              data.tan_no || "",
        pan_no:              data.pan_no || "",
        vat_no:              data.vat_no || "",
        msme_number:         data.msme_number || "",
        annual_turnover:     data.annual_turnover || "",
        business_description:data.business_description || "",
        contact_person_name: data.contact_person_name || "",
        designation:         data.designation || "",
        services:            Array.isArray(data.services) ? data.services : [],
        photo_url:           data.photo_url || data.profile_photo || "",
      });
      // Sync navbar avatar — use the raw base64/path from profile
      const rawPhoto = data.photo_url || data.profile_photo;
      if (rawPhoto) {
        localStorage.setItem("vp_user_photo", rawPhoto);
        window.dispatchEvent(new Event("storage"));
      }
      // Sync status badges in navbar
      if (data.verification_status) localStorage.setItem("vp_verification_status", data.verification_status);
      if (data.document_verify_status) localStorage.setItem("vp_doc_verify_status", data.document_verify_status);
      window.dispatchEvent(new Event("storage"));
      if (data.communication_preferences) setCommPrefs(data.communication_preferences);
    } catch (err) {
      toast.error(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const toggleService = (item) => {
    setProfile((prev) => {
      const s = new Set(prev.services);
      s.has(item) ? s.delete(item) : s.add(item);
      return { ...prev, services: [...s] };
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show instant local preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUri = ev.target.result;
      setProfile(prev => ({ ...prev, photo_url: dataUri }));
      localStorage.setItem("vp_user_photo", dataUri);
      window.dispatchEvent(new Event("storage"));
      try {
        setPhotoUploading(true);
        await vendorApi.uploadProfilePhoto(file);
        // Re-fetch to get the server-stored value
        const res = await vendorApi.getProfile();
        const data = res?.data ?? res;
        const savedPhoto = data.photo_url || data.profile_photo || dataUri;
        setProfile(prev => ({ ...prev, photo_url: savedPhoto }));
        localStorage.setItem("vp_user_photo", savedPhoto);
        window.dispatchEvent(new Event("storage"));
        toast.success("Profile photo updated");
      } catch (err) {
        toast.error(err.message || "Failed to upload photo");
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await vendorApi.updateProfile({
        name:                profile.full_name,
        mobile:              profile.mobile,
        landlineno:          profile.landlineno || null,
        whatsappno:          profile.whatsappno || null,
        company_name:        profile.company_name,
        country:             profile.country,
        city:                profile.city,
        state:               profile.state,
        district:            profile.district,
        zip_code:            profile.pin_code,
        street_address:      profile.address,
        apartment:           profile.apartment,
        country_code:        profile.country_code,
        phone_landline:      profile.phone_landline,
        website:             profile.website || null,
        fax:                 profile.fax || null,
        contact_person_name: profile.contact_person_name || null,
        designation:         profile.designation || null,
        gst_number:          profile.gst_no || null,
        tan_number:          profile.tan_no || null,
        pan_number:          profile.pan_no || null,
        vat_number:          profile.vat_no || null,
        msme_number:         profile.msme_number || null,
        annual_turnover:     profile.annual_turnover || null,
        business_description:profile.business_description || null,
        services:            profile.services.length > 0 ? profile.services : null,
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (!passwords.current_password || !passwords.new_password) {
      toast.error("Please fill all password fields");
      return;
    }
    try {
      await vendorApi.changePassword({
        current_password: passwords.current_password,
        new_password:     passwords.new_password,
      });
      toast.success("Password updated successfully");
      setPasswords(INITIAL_PASSWORD);
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    }
  };

  const serviceOpts = getServiceOpts(profile.company_status);
  const initials    = profile.full_name?.charAt(0)?.toUpperCase() || "V";

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
      <div className="max-w-7xl mx-auto space-y-5 pb-10">

        {/* ── Page title ── */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your account information and business details</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* ══ Card 1: Profile Header ══ */}
          <ProfileCard
            icon={<IcoUser />}
            title="Profile Overview"
            desc="Your public identity on the vendor portal"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
                >
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  title="Change photo"
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: "50%",
                    background: C.blue.text, color: "#fff",
                    border: "2px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <IcoCamera />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 truncate">{profile.full_name || "Vendor"}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.company_name && (
                    <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: "#f1f5f9", color: "#475569", fontWeight: 600, border: "1px solid #e2e8f0" }}>
                      {profile.company_name}
                    </span>
                  )}
                  {profile.company_status && (
                    <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontWeight: 600, border: "1px solid #bbf7d0" }}>
                      {profile.company_status}
                    </span>
                  )}
                  {profile.firm_type && (
                    <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: "#fafafa", color: "#64748b", fontWeight: 500, border: "1px solid #e5e7eb" }}>
                      {profile.firm_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ProfileCard>

          {/* ══ Card 2: Personal & Contact ══ */}
          <ProfileCard
            icon={<IcoPhone />}
            title="Personal & Contact Details"
            desc="Your name, contact numbers and communication info"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <F label="Full Name"       name="full_name"      value={profile.full_name}      onChange={handleChange} />
              <F label="Email ID"        value={profile.email}  readOnly />
              <F label="Mobile Number"   name="mobile"          value={profile.mobile}         onChange={handleChange} />
              <F label="WhatsApp No."    name="whatsappno"      value={profile.whatsappno}     onChange={handleChange} placeholder="Same as mobile?" />
              <F label="Landline No."    name="landlineno"      value={profile.landlineno}     onChange={handleChange} placeholder="STD code + number" />
              <F label="Country Code"    name="country_code"    value={profile.country_code}   onChange={handleChange} placeholder="+91" />
              <F label="Landline / STD"  name="phone_landline"  value={profile.phone_landline} onChange={handleChange} />
              <F label="Fax"             name="fax"             value={profile.fax}            onChange={handleChange} />
              <F label="Website"         name="website"         value={profile.website}        onChange={handleChange} placeholder="https://yoursite.com" />
            </div>
          </ProfileCard>

          {/* ══ Card 3: Business Details ══ */}
          <ProfileCard
            icon={<IcoBusiness />}
            title="Business Details"
            desc="Your company information, designation, and business profile"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <F label="Company Name"         name="company_name"        value={profile.company_name}        onChange={handleChange} />
              <F label="Company Status"       value={profile.company_status}  readOnly />
              <F label="Firm Type"            value={profile.firm_type}       readOnly />
              <F label="Contact Person Name"  name="contact_person_name" value={profile.contact_person_name} onChange={handleChange} />
              <F label="Designation"          name="designation"         value={profile.designation}         onChange={handleChange} placeholder="e.g. Managing Director" />
              <F label="Annual Turnover"      name="annual_turnover"     value={profile.annual_turnover}     onChange={handleChange} placeholder="e.g. 50 Lakhs" />
            </div>
            <div className="mt-4">
              <label className={LABEL}>Business Description</label>
              <textarea
                name="business_description"
                value={profile.business_description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe your business, products/services offered, key strengths..."
                className={INP + " resize-none"}
              />
            </div>
          </ProfileCard>

          {/* ══ Card 4: Address & Location ══ */}
          <ProfileCard
            icon={<IcoLocation />}
            title="Address & Location"
            desc="Registered business address and location details"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <F label="Country"         name="country"   value={profile.country}   onChange={handleChange} />
              <F label="State"           name="state"     value={profile.state}     onChange={handleChange} />
              <F label="District"        name="district"  value={profile.district}  onChange={handleChange} />
              <F label="City"            name="city"      value={profile.city}      onChange={handleChange} />
              <F label="Pin Code"        name="pin_code"  value={profile.pin_code}  onChange={handleChange} />
              <F label="Apartment / Floor" name="apartment" value={profile.apartment} onChange={handleChange} placeholder="Floor, Suite, Unit…" />
            </div>
            <div className="mt-4">
              <label className={LABEL}>Street Address</label>
              <textarea
                name="address"
                value={profile.address}
                onChange={handleChange}
                rows={2}
                placeholder="Building, street, locality…"
                className={INP + " resize-none"}
              />
            </div>
          </ProfileCard>

          {/* ══ Card 5: Tax & Registration ══ */}
          <ProfileCard
            icon={<IcoDoc />}
            title="Tax & Registration Numbers"
            desc="GST, PAN, TAN and other statutory identifiers"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <F label="GST Number"   name="gst_no"      value={profile.gst_no}      onChange={handleChange} placeholder="15-character GST" maxLength={15} />
              <F label="PAN Number"   name="pan_no"      value={profile.pan_no}      onChange={handleChange} placeholder="10-character PAN"  maxLength={10} />
              <F label="TAN Number"   name="tan_no"      value={profile.tan_no}      onChange={handleChange} placeholder="10-character TAN"  maxLength={10} />
              <F label="VAT Number"   name="vat_no"      value={profile.vat_no}      onChange={handleChange} />
              <F label="MSME Number"  name="msme_number" value={profile.msme_number} onChange={handleChange} />
            </div>
          </ProfileCard>

          {/* ══ Card 6: Services / Categories ══ */}
          {serviceOpts.length > 0 && (
            <ProfileCard
              icon={<IcoGrid />}
              title={`Services / Categories`}
              desc={`Select all categories that apply to your business · ${profile.services.length} selected`}
            >
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-60 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "thin" }}
              >
                {serviceOpts.map((item) => {
                  const checked = profile.services.includes(item);
                  return (
                    <label
                      key={item}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors"
                      style={{
                        background: checked ? C.blue.bg : "transparent",
                        color: checked ? C.blue.text : "#6b7280",
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(item)}
                        className="rounded border-gray-300 focus:ring-blue-100 focus:outline-none"
                        style={{ accentColor: C.blue.text }}
                      />
                      <span className="truncate">{item}</span>
                    </label>
                  );
                })}
              </div>
            </ProfileCard>
          )}

          {/* ══ Card 7: Communication Preferences ══ */}
          <ProfileCard
            icon={<IcoBell />}
            title="Communication Preferences"
            desc="Choose how you'd like to receive notifications and updates"
          >
            <div className="flex flex-wrap gap-3">
              {[
                { key: "email",    label: "Email Notifications",   icon: <IcoMail /> },
                { key: "sms",      label: "SMS Notifications",     icon: <IcoSms /> },
                { key: "whatsapp", label: "WhatsApp Notifications", icon: <IcoWa /> },
              ].map(({ key, label, icon }) => {
                const on = commPrefs[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCommPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      border: `1.5px solid ${on ? C.blue.text : "#e5e7eb"}`,
                      background: on ? C.blue.text : "#fafafa",
                      color: on ? "#fff" : "#6b7280",
                    }}
                  >
                    <span style={{ opacity: on ? 1 : 0.5 }}>{icon}</span>
                    {label}
                    {on && <IcoCheck />}
                  </button>
                );
              })}
            </div>
          </ProfileCard>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition hover:opacity-90"
              style={{ background: C.blue.text }}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>

        {/* ══ Card 8: Change Password ══ */}
        <ProfileCard
          icon={<IcoLock />}
          title="Change Password"
          desc="Update your login password. Use a strong, unique password."
        >
          <form onSubmit={handlePasswordUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Current Password", name: "current_password" },
                { label: "New Password",     name: "new_password" },
                { label: "Confirm Password", name: "confirm_password" },
              ].map(({ label, name }) => (
                <div key={name}>
                  <label className={LABEL}>{label}</label>
                  <input
                    type="password"
                    name={name}
                    value={passwords[name]}
                    onChange={e => setPasswords(p => ({ ...p, [e.target.name]: e.target.value }))}
                    className={INP}
                    autoComplete="new-password"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: C.blue.text }}
              >
                Update Password
              </button>
            </div>
          </form>
        </ProfileCard>

      </div>
    </Layout>
  );
}

/* ── Section card wrapper ── */
function ProfileCard({ icon, title, desc, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: C.blue.bg, color: C.blue.text }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      {/* Card body */}
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

/* ── Field helper ── */
function F({ label, name, value, onChange, readOnly, placeholder, maxLength }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        type="text"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        maxLength={maxLength}
        className={readOnly ? RO : INP}
      />
    </div>
  );
}

/* ── Inline SVG icons ── */
const IcoUser     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoPhone    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.58 1.18 2 2 0 012.57 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.54a16 16 0 006.55 6.55l.81-.81a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IcoBusiness = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01M3 13a20 20 0 0018 0"/></svg>;
const IcoLocation = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoDoc      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoGrid     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoBell     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IcoLock     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IcoCamera   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcoMail     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoSms      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
const IcoWa       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const IcoCheck    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
