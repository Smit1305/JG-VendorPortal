import { useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";

/* ─── Color palette (matches SellerDashboard) ───────────────── */
const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

const SERVICES = [
  {
    id: 1, title: "Account Setup Assistance", available: true,
    description: "Get help with completing your vendor profile, uploading documents, and getting verified.",
    color: C.blue,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  },
  {
    id: 2, title: "Product Listing Support", available: true,
    description: "Our team will help you list your products correctly with proper categories and specifications.",
    color: C.violet,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
  {
    id: 3, title: "Order Management Training", available: true,
    description: "Learn how to manage orders, handle returns, and track shipments effectively.",
    color: C.emerald,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  },
  {
    id: 4, title: "Payment & Finance Guidance", available: true,
    description: "Understand payment cycles, invoice requirements, and financing options available to you.",
    color: C.amber,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  {
    id: 5, title: "Technical Integration Support", available: true,
    description: "Get help with API integration, bulk product upload, and system connectivity.",
    color: C.blue,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  },
  {
    id: 6, title: "Compliance & Documentation", available: true,
    description: "Assistance with GST compliance, TDS certificates, and regulatory documentation.",
    color: C.violet,
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  },
];

const FAQS = [
  { q: "How long does vendor verification take?", a: "Typically 3-5 business days after all documents are submitted. You'll receive an email notification once verified." },
  { q: "What documents are required for verification?", a: "PAN Card, GST Certificate, Bank Account details, and company registration documents. Additional documents may be required based on your firm type." },
  { q: "How do I update my product catalogue?", a: "Go to Manage Catalogue in the sidebar. You can add single or multiple SKU products, upload images, and set pricing." },
  { q: "When will I receive payment for my orders?", a: "Payments are processed every Friday for orders delivered and accepted in the previous week. Funds are credited within 2-3 business days." },
  { q: "How do I raise a dispute for a rejected order?", a: "Go to Manage Returns and click 'New Return'. Fill in the order details and reason. Our team will review within 5 business days." },
];

export default function AssistanceService() {
  const [requestModal, setRequestModal] = useState({ open: false, service: null });
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openChat = () => window.dispatchEvent(new CustomEvent("open-chatbot"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vendorApi.requestAssistance({ service: requestModal.service?.title, ...form });
      setSubmitted(true);
      setTimeout(() => {
        setRequestModal({ open: false, service: null });
        setSubmitted(false);
        setForm({ name: "", email: "", phone: "", message: "" });
      }, 2500);
    } catch (err) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assistance Service</h1>
            <p className="text-xs text-gray-400 mt-0.5">Our support team is here to help you grow your business</p>
          </div>
          <button
            onClick={openChat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition hover:opacity-90"
            style={{ background: C.blue.text }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Live Chat
          </button>
        </div>

        {/* ── Contact Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Phone */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: C.emerald.bg, color: C.emerald.text }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium leading-tight mb-0.5">Call Us</p>
              <p className="text-sm font-bold text-gray-800">+91 63593 65247</p>
              <p className="text-xs text-gray-400">Mon–Sat, 9AM–6PM</p>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: C.blue.bg, color: C.blue.text }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium leading-tight mb-0.5">Email Us</p>
              <p className="text-sm font-bold text-gray-800">info@jigisha.com</p>
              <p className="text-xs text-gray-400">Response within 24 hours</p>
            </div>
          </div>

          {/* Live Chat */}
          <button
            onClick={openChat}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 text-left w-full hover:shadow-md transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: C.violet.bg, color: C.violet.text }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium leading-tight mb-0.5">Live Chat</p>
              <p className="text-sm font-bold" style={{ color: C.violet.text }}>Chat Now →</p>
              <p className="text-xs text-gray-400">AI-powered assistant</p>
            </div>
          </button>
        </div>

        {/* ── Assistance Services ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Available Assistance Services</p>
            <span className="text-xs text-gray-400">{SERVICES.filter(s => s.available).length} services available</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map(service => (
              <div
                key={service.id}
                className={`rounded-xl border p-4 flex gap-3 transition-shadow ${service.available ? "border-gray-100 hover:shadow-sm" : "border-gray-100 opacity-55"}`}
                style={{ background: service.available ? service.color.bg : "#f9fafb" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm"
                  style={{ color: service.color.text }}>
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{service.title}</p>
                    {!service.available && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-medium">Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2.5 leading-relaxed">{service.description}</p>
                  {service.available && (
                    <button
                      onClick={() => setRequestModal({ open: true, service })}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white shadow-sm border transition-shadow hover:shadow"
                      style={{ color: service.color.text, borderColor: service.color.light }}
                    >
                      Request Assistance →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQs ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Frequently Asked Questions</p>
          </div>
          <div className="p-5 space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{faq.q}</span>
                  <svg
                    className="w-4 h-4 flex-shrink-0 ml-3 transition-transform text-gray-400"
                    style={{ transform: expandedFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {expandedFaq === i && (
                  <div className="px-4 py-3 border-t border-gray-100" style={{ background: C.blue.bg }}>
                    <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Request Modal ── */}
      {requestModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
              style={{ background: requestModal.service?.color?.bg || C.blue.bg }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm"
                  style={{ color: requestModal.service?.color?.text || C.blue.text }}>
                  {requestModal.service?.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Assistance Request</p>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{requestModal.service?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setRequestModal({ open: false, service: null })}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/60 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: C.emerald.bg, color: C.emerald.text }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-base font-bold text-gray-800">Request Submitted!</p>
                <p className="text-xs text-gray-400 mt-1">Our team will contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Your Name</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    placeholder="you@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Describe your issue</label>
                  <textarea value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                    placeholder="Please describe how we can help you..." />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button"
                    onClick={() => setRequestModal({ open: false, service: null })}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
                    style={{ background: C.blue.text }}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
