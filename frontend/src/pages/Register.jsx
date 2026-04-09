import React from 'react';
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

/* ── Exact country codes from PHP registration.blade.php ── */
const COUNTRY_CODES = [
  { v: "+91", l: "India (+91)" }, { v: "+1", l: "USA (+1)" }, { v: "+44", l: "UK (+44)" },
  { v: "+61", l: "Australia (+61)" }, { v: "+81", l: "Japan (+81)" }, { v: "+49", l: "Germany (+49)" },
  { v: "+33", l: "France (+33)" }, { v: "+86", l: "China (+86)" }, { v: "+971", l: "UAE (+971)" },
  { v: "+880", l: "Bangladesh (+880)" }, { v: "+92", l: "Pakistan (+92)" }, { v: "+94", l: "Sri Lanka (+94)" },
  { v: "+66", l: "Thailand (+66)" }, { v: "+62", l: "Indonesia (+62)" }, { v: "+60", l: "Malaysia (+60)" },
  { v: "+63", l: "Philippines (+63)" }, { v: "+7", l: "Russia (+7)" }, { v: "+234", l: "Nigeria (+234)" },
  { v: "+27", l: "South Africa (+27)" }, { v: "+20", l: "Egypt (+20)" }, { v: "+213", l: "Algeria (+213)" },
  { v: "+212", l: "Morocco (+212)" }, { v: "+255", l: "Tanzania (+255)" }, { v: "+254", l: "Kenya (+254)" },
  { v: "+977", l: "Nepal (+977)" }, { v: "+84", l: "Vietnam (+84)" }, { v: "+82", l: "South Korea (+82)" },
  { v: "+90", l: "Turkey (+90)" }, { v: "+98", l: "Iran (+98)" }, { v: "+964", l: "Iraq (+964)" },
  { v: "+962", l: "Jordan (+962)" }, { v: "+961", l: "Lebanon (+961)" }, { v: "+353", l: "Ireland (+353)" },
  { v: "+39", l: "Italy (+39)" }, { v: "+34", l: "Spain (+34)" }, { v: "+351", l: "Portugal (+351)" },
  { v: "+30", l: "Greece (+30)" }, { v: "+41", l: "Switzerland (+41)" }, { v: "+31", l: "Netherlands (+31)" },
  { v: "+32", l: "Belgium (+32)" }, { v: "+43", l: "Austria (+43)" }, { v: "+46", l: "Sweden (+46)" },
  { v: "+47", l: "Norway (+47)" }, { v: "+45", l: "Denmark (+45)" }, { v: "+358", l: "Finland (+358)" },
  { v: "+48", l: "Poland (+48)" }, { v: "+36", l: "Hungary (+36)" }, { v: "+420", l: "Czech Republic (+420)" },
  { v: "+40", l: "Romania (+40)" }, { v: "+56", l: "Chile (+56)" }, { v: "+54", l: "Argentina (+54)" },
  { v: "+55", l: "Brazil (+55)" }, { v: "+52", l: "Mexico (+52)" }, { v: "+64", l: "New Zealand (+64)" },
];

/* ── Exact firm types from PHP ── */
const FIRM_TYPES = [
  "Public Sector Undertaking", "Public Limited Company", "Private Limited Company",
  "One Person Company (OPC)", "Limited Liability Partnership (LLP)",
  "Trust & Cooperative Society", "Sole Proprietorship", "NGO",
];

/* ── Exact company statuses from PHP ── */
const COMPANY_STATUSES = ["MANUFACTURER", "SERVICE PROVIDER", "RAW MATERIAL SUPPLIER"];

/* ── Exact service options from PHP registration.blade.php ── */
const MANUFACTURER_OPTS = [
  "ABRASIVES", "AUTOMOTIVE CONSUMABLES", "AUTOMOTIVES", "AIR CONDITIONING & REFRIGERATION",
  "BEARING, BUSHINGS AND BELTINGS", "BUILDING MATERIALS", "BOILERS & FURNACES",
  "CHEMICALS, GASES & LABORATORY PRODUCTS", "COMMISSARY & JANITORIAL SUPPLIES",
  "COMPRESSOR & COMPRESSOR SPARES", "CRUSHING & GRINDING EQUIPMENT SPARES",
  "COMMUNICATION EQUIPMENTS", "CONVEYING & HOISTING EQUIPMENT", "COMPUTER & IT SPARES",
  "DRILLING & BLASTING", "ELECTRICAL & ELECTRONIC COMMODITIES (GENERAL)",
  "ENAMELS, PAINTS, VARNISHES & THINNERS", "EXPLOSIVES", "ELECTRICAL PANELS & CONTACTORS",
  "ELECTRICAL EQUIPMENTS", "EARTH MOVING EQUIPMENTS", "EOT CRANE & ACCESSORIES",
  "FASTENERS & HARDWARE", "FANS & BLOWERS", "FILTERING, MIXING & SEPARATING DEVICES",
  "GENERATORS & MOTORS", "GARAGE EQUIPMENT & AUTO ELECTRICAL",
  "HAND TOOLS, CUTTING TOOLS & TACKLES", "HOSE & HOSE FITTINGS",
  "HEAT EXCHANGERS, DRYERS & COOLING TOWERS", "INSULATION MATERIAL", "INSTRUMENTATION",
  "INTERNAL COMBUSTION ENGINES & SPARES", "MEDICINE & HOSPITAL ITEMS",
  "METALS (FERROUS)", "METALS (NON-FERROUS)", "MECHANICAL POWER TRANSMISSIONS",
  "MACHINE SHOP EQUIPMENTS & SPARES", "MINE CAR & ACCESSORIES",
  "LAB EQUIPMENTS, INSTRUMENTS & APPARATUS", "OIL, FUELS, GREASES & LUBRICANTS",
  "OSP CONTRACTS", "PACKING SHEETS, GASKETS & OIL SEALS", "PIPES & PIPE FITTINGS",
  "PUMPS & PUMP SPARES", "REFRACTORIES", "ROPE, CHAINS, TACKLES & MATERIAL HANDLING",
  "STATIONERY, PRINTING & PHOTOGRAPHIC MATERIALS", "SAFETY & FIRE FIGHTING EQUIPMENT",
  "TEXTILES & CLOTHING MATERIALS", "TIMBERS", "TURBINES", "VALVES & VALVE PARTS",
  "WELDING & METALLISING STORES", "WATER TREATMENT PLANT EQUIPMENT & SPARES",
  "WELDING EQUIPMENT & ACCESSORIES",
];

const SERVICE_OPTS = [
  "Accounting and tax Services", "After Sales Services", "Calibration & Metrology",
  "Corporate Governance", "Corporate Travel Desk", "Customer Care Center",
  "Engineering Services", "Environmental Services", "Event Management",
  "Executive Services", "Facility Management", "Hire Purchase Services",
  "HR Services", "Industrial & Commercial", "Infrastructure Management",
  "Installation Services", "IT Services", "Legal Services", "Management Consultancy",
  "Marketing & Communication", "MRO Services", "News & Media Services",
  "Printing Services", "Procurement & Purchase", "Product Approval Services",
  "Product Development", "Quality Control Services", "Repairing Services",
  "Security Services", "Segment Under Contract", "Sustainability Services",
  "Testing & Certification", "Troubleshooting Services", "Work Force Management",
];

const RAW_MATERIAL_OPTS = [
  "Agro", "Ceramics & Glass", "Chemicals", "Construction", "Cosmetics & Perfume",
  "Electrical & Electronics", "Energy & Power", "Fertilizers", "Gems & Jewellery",
  "Herbs & Herbal Oil", "Metals & Steel", "Oil & Gas", "Ore & Mineral", "Paints",
  "Paper & Pulp", "Pesticides & Insecticide", "Pharmaceuticals & Drug",
  "Plastics & Polymer", "Rubber & Elastomer", "Wood & Laminate", "Yarn & Fibre",
];

const INIT = {
  fullname: "", companyname: "", firm_type: "", company_status: "",
  panno: "", tanno: "", gstno: "",
  mobile_code: "+91", stdcodewithphone: "",
  phone_code: "+91", landlineno: "",
  alt_code: "+91", whatsappno: "",
  email: "", password: "",
  country: "", city: "", state: "", pincode: "", address: "",
  services: [],
};

function PhoneField({ codeKey, numKey, codeVal, numVal, onChange, label, required }) {
  const handleNum = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    onChange({ target: { name: numKey, value: digits } });
  };
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-1">
        <select name={codeKey} value={codeVal} onChange={onChange}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm bg-white focus:border-[#5d87ff] focus:outline-none"
          style={{ maxWidth: 130 }}>
          {COUNTRY_CODES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
        </select>
        <input type="text" name={numKey} value={numVal} onChange={handleNum}
          maxLength={10} inputMode="numeric" required={required}
          placeholder="Enter number"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5d87ff] focus:ring-2 focus:ring-[#5d87ff]/20 focus:outline-none" />
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INIT);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleStatusChange = (e) => setForm(p => ({ ...p, company_status: e.target.value, services: [] }));

  const toggleService = (item) => {
    setForm(p => {
      const s = new Set(p.services);
      s.has(item) ? s.delete(item) : s.add(item);
      return { ...p, services: [...s] };
    });
  };

  const serviceOpts = useMemo(() => {
    if (form.company_status === "MANUFACTURER") return MANUFACTURER_OPTS;
    if (form.company_status === "SERVICE PROVIDER") return SERVICE_OPTS;
    if (form.company_status === "RAW MATERIAL SUPPLIER") return RAW_MATERIAL_OPTS;
    return [];
  }, [form.company_status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.stdcodewithphone) { toast.error("Mobile number is required."); return; }
    if (form.services.length === 0 && form.company_status) {
      toast.error("Please select at least one service / product category."); return;
    }
    setLoading(true);
    try {
      await authApi.register({
        name: form.fullname,
        company_name: form.companyname,
        firm_type: form.firm_type,
        company_status: form.company_status,
        pan_number: form.panno || null,
        tan_number: form.tanno || null,
        gst_number: form.gstno || null,
        mobile: `${form.mobile_code}${form.stdcodewithphone}`,
        phone: form.landlineno ? `${form.phone_code}${form.landlineno}` : null,
        alt_contact: form.whatsappno ? `${form.alt_code}${form.whatsappno}` : null,
        email: form.email,
        password: form.password,
        country: form.country,
        city: form.city,
        state: form.state,
        pin_code: form.pincode || null,
        address: form.address || null,
        services: form.services.length > 0 ? form.services : null,
      });
      toast.success("Registration submitted! Awaiting admin approval.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const d = err?.detail;
      const msg = Array.isArray(d)
        ? d.map(e => `${e.loc?.slice(1).join(".")}: ${e.msg?.replace("Value error, ", "")}`).join(", ")
        : err?.message || "Registration failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inp = "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#5d87ff] focus:ring-2 focus:ring-[#5d87ff]/20 focus:outline-none";
  const sel = inp + " bg-white";

  return (
    <div className="min-h-screen py-6 px-4" style={{ background: "radial-gradient(ellipse at 50% 50%, #ebf3fe 0%, #f6f9fc 100%)" }}>
      <div className="max-w-5xl mx-auto">

        {/* Logo — finallogojigi.jpeg exactly like PHP */}
        <div className="flex items-center justify-center mb-4">
          <img src="/assets/images/finallogojigi.jpeg" alt="Jigisha" className="max-h-20 w-auto"
            onError={e => { e.target.style.display = "none"; }} />
        </div>

        <h2 className="text-center text-lg font-bold text-gray-800 mb-4">Register here</h2>

        {/* Card — matches PHP .card.rounded-3 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Row 1: 4 cols — Full Name, Company Name, Firm Type, Company Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="fullname" value={form.fullname} onChange={handleChange} required
                    placeholder="Enter your Full Name" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name of Firm / Company <span className="text-red-500">*</span></label>
                  <input type="text" name="companyname" value={form.companyname} onChange={handleChange} required
                    placeholder="Enter your Company Name" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type Of The Firm <span className="text-red-500">*</span></label>
                  <select name="firm_type" value={form.firm_type} onChange={handleChange} required className={sel}>
                    <option value="" disabled>Select Type</option>
                    {FIRM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status of Company <span className="text-red-500">*</span></label>
                  <select name="company_status" value={form.company_status} onChange={handleStatusChange} required className={sel}>
                    <option value="" disabled>Select Status</option>
                    {COMPANY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: PAN, TAN, GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN No. <span className="text-red-500">*</span></label>
                  <input type="text" name="panno" value={form.panno} onChange={handleChange} required
                    placeholder="PAN No." maxLength={10} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TAN No. <span className="text-red-500">*</span></label>
                  <input type="text" name="tanno" value={form.tanno} onChange={handleChange} required
                    placeholder="TAN No." maxLength={10} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST No. / VAT No. <span className="text-red-500">*</span></label>
                  <input type="text" name="gstno" value={form.gstno} onChange={handleChange} required
                    placeholder="GST No." maxLength={15} className={inp} />
                </div>
              </div>

              {/* Row 3: 3 phone fields — exactly like PHP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                <PhoneField codeKey="mobile_code" numKey="stdcodewithphone"
                  codeVal={form.mobile_code} numVal={form.stdcodewithphone}
                  onChange={handleChange} label="Country Code with Mobile No." required />
                <PhoneField codeKey="phone_code" numKey="landlineno"
                  codeVal={form.phone_code} numVal={form.landlineno}
                  onChange={handleChange} label="Country Code with Phone No." required />
                <PhoneField codeKey="alt_code" numKey="whatsappno"
                  codeVal={form.alt_code} numVal={form.whatsappno}
                  onChange={handleChange} label="Alternate Contact No." required={false} />
              </div>

              {/* Row 4: Email, Password, PIN search, Country, City, State, Pin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email / User ID <span className="text-red-500">*(Unique)</span></label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="Email" className={inp} autoComplete="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} name="password" value={form.password}
                      onChange={handleChange} required minLength={8}
                      placeholder="Enter your Password" className={inp + " pr-10"} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                      {showPwd ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                          <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                          <path d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                          <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <input type="text" name="country" value={form.country} onChange={handleChange} required
                    placeholder="Country" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} required
                    placeholder="City" className={inp} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} required
                    placeholder="State" className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pin <span className="text-red-500">*</span></label>
                  <input type="text" name="pincode" value={form.pincode}
                    onChange={e => { const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 6); setForm(p => ({ ...p, pincode: v })); }}
                    required placeholder="Pin" maxLength={6} className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} required
                    placeholder="Enter Full Address" className={inp} />
                </div>
              </div>

              {/* Services multi-select — exact PHP dynamic options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Items Interested for Supply/Service
                  {form.services.length > 0 && (
                    <span className="ml-2 text-xs text-[#5d87ff] font-semibold">({form.services.length} selected)</span>
                  )}
                </label>
                {!form.company_status ? (
                  <p className="text-sm text-gray-400 italic border border-gray-200 rounded-lg p-3">
                    Select a Company Status above to see available categories.
                  </p>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-3 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                    {serviceOpts.map(item => {
                      const checked = form.services.includes(item);
                      return (
                        <label key={item}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors
                            ${checked ? "bg-[#5d87ff]/10 text-[#5d87ff] font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleService(item)}
                            className="rounded border-gray-300 text-[#5d87ff] focus:ring-[#5d87ff]" />
                          {item}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Register button — matches PHP: btn btn-primary w-100 py-8 mb-4 rounded-2 */}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 mb-4 rounded-lg text-sm font-semibold text-white bg-[#5d87ff] hover:bg-[#4570ea] disabled:opacity-60 transition-colors">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : "Register"}
              </button>

              {/* "Already have an Account? Sign In" — exact PHP text */}
              <div className="flex items-center justify-center text-sm">
                <span className="text-gray-700">Already have an Account?</span>
                <Link to="/login" className="text-[#5d87ff] ml-1 hover:underline">Sign In</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
