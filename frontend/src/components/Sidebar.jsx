import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { authApi } from "../services/api";

/* ── Tabler-style SVG icons ── */
const Icon = {
  dashboard:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  user:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  check:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  grid:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  file:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  building:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></svg>,
  package:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5M16 5.25l-8 4.5"/></svg>,
  clipboard:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h6"/></svg>,
  layers:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  truck:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17a2 2 0 104 0 2 2 0 00-4 0"/><path d="M15 17a2 2 0 104 0 2 2 0 00-4 0"/><path d="M5 17H3V6a1 1 0 011-1h11v12M9 17h6m4 0h2v-6l-3-5H16V6"/></svg>,
  refresh:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8.1 8.1 0 00-15.5-2m-.5-4v4h4"/><path d="M4 13a8.1 8.1 0 0015.5 2m.5 4v-4h-4"/></svg>,
  headset:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v-3a8 8 0 1116 0v3"/><path d="M18 19c0 1.66-2.686 3-6 3"/><rect x="4" y="12" width="4" height="6" rx="2"/><rect x="16" y="12" width="4" height="6" rx="2"/></svg>,
  bank:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>,
  creditcard:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22M7 15h.01M11 15h2"/></svg>,
  message:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  briefcase:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01M3 13a20 20 0 0018 0"/></svg>,
  gift:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8A2.5 2.5 0 0112 5.5 2.5 2.5 0 0116.5 8"/></svg>,
  logout:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  serviceProvider: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 8v4l3 3"/></svg>,
  document:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  // chevron for toggle button
  chevronLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  chevronRight:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
};

/* ── Nav data ── */
const vendorSections = [
  {
    cap: null,
    links: [
      { to: "/vendor/main", icon: Icon.dashboard, label: "Seller Dashboard" },
    ],
  },
  {
    cap: "VENDOR MANAGEMENT",
    links: [
      { to: "/vendor/orders",      icon: Icon.package,   label: "Manage Product Orders" },
      { to: "/vendor/rfqs",        icon: Icon.clipboard, label: "Manage your RFQs" },
      { to: "/vendor/products",    icon: Icon.layers,    label: "Manage Catalogue" },
      { to: "/vendor/logistics",   icon: Icon.truck,     label: "Manage Logistics" },
      { to: "/vendor/returns",     icon: Icon.refresh,   label: "Manage Returns" },
    ],
  },
  {
    cap: "SUPPORT & FINANCE",
    links: [
      { to: "/vendor/assistance",  icon: Icon.headset,    label: "Get Assistance Service" },
      { to: "/vendor/loans",       icon: Icon.bank,       label: "Manage Loans" },
      { to: "/vendor/payments",    icon: Icon.creditcard, label: "Manage Payments" },
      { to: "/vendor/support",     icon: Icon.message,    label: "Support Requests" },
      { to: "/vendor/commercials", icon: Icon.briefcase,  label: "Manage Commercials" },
    ],
  },
  {
    cap: "ACCOUNT",
    links: [
      { to: "/vendor/documents",        icon: Icon.document,        label: "Upload Documents" },
      { to: "/vendor/service-provider", icon: Icon.serviceProvider, label: "Service Provider" },
      { to: "/vendor/profile",          icon: Icon.user,            label: "Manage your Profile" },
      { to: "/vendor/rewards",          icon: Icon.gift,            label: "Loyalty Rewards", badge: "New" },
    ],
  },
];

const adminSections = [
  {
    cap: null,
    links: [
      { to: "/admin/dashboard", icon: Icon.dashboard, label: "Dashboard" },
    ],
  },
  {
    cap: "VENDOR MANAGEMENT",
    links: [
      { to: "/admin/vendors",         icon: Icon.users,  label: "Verified Vendors" },
      { to: "/admin/pending-vendors", icon: Icon.check,  label: "Non-Verified Vendors" },
      { to: "/admin/users",           icon: Icon.user,   label: "All Users" },
    ],
  },
  {
    cap: "SETTINGS",
    links: [
      { to: "/admin/categories",     icon: Icon.grid,     label: "Category Settings" },
      { to: "/admin/document-types", icon: Icon.file,     label: "Document Master" },
      { to: "/admin/company",        icon: Icon.building, label: "Company Profile" },
      { to: "/admin/profile",        icon: Icon.user,     label: "My Profile" },
    ],
  },
];

const ACTIVE_BG   = "#eef2f7";   /* soft slate-blue tint */
const ACTIVE_TEXT = "#1e293b";   /* dark slate */
const HOVER_BG    = "#f5f5f5";   /* barely-there hover */
const HOVER_TEXT    = "#374151";   /* one step darker than default */
const DEFAULT_TEXT  = "#6b7280";   /* medium gray */
const FULL_W  = 270;
const MINI_W  = 64;

export default function Sidebar({ open, onToggle }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const sections = role === "admin" ? adminSections : vendorSections;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    navigate("/login");
  };

  return (
    <>
      {/* Mobile dark overlay — only when fully expanded on small screens */}
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className="fixed inset-y-0 left-0 z-40 flex flex-col"
        style={{
          width: open ? FULL_W : MINI_W,
          background: "#fff",
          borderRight: "1px solid #e5eaef",
          boxShadow: "1px 0 10px rgba(0,0,0,0.06)",
          transition: "width 280ms cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
          // On mobile when closed → fully hidden off-screen
        }}
      >
        {/* ── Logo / Header ── */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            minHeight: 70,
            borderBottom: "1px solid #e5eaef",
            padding: open ? "0 12px 0 16px" : "0",
            justifyContent: open ? "space-between" : "center",
            transition: "padding 280ms",
          }}
        >
          {/* Logo — only visible when expanded */}
          <div
            style={{
              opacity: open ? 1 : 0,
              width: open ? "auto" : 0,
              overflow: "hidden",
              transition: "opacity 200ms, width 280ms",
              whiteSpace: "nowrap",
            }}
          >
            <img
              src="/finallogojigi.jpeg"
              alt="Jigisha"
              style={{ height: 42, width: "auto", maxWidth: 180, objectFit: "contain", display: "block" }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.insertAdjacentHTML("afterend",
                  '<span style="font-weight:800;font-size:13px;color:#5d87ff;letter-spacing:-0.5px;">JIGISHA INTL</span>'
                );
              }}
            />
          </div>

          {/* Toggle button */}
          <button
            onClick={onToggle}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              width: 30, height: 30, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#a1aab2", border: "1px solid #e5eaef",
              background: "transparent", cursor: "pointer", flexShrink: 0,
              transition: "background 150ms, color 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = HOVER_BG; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1aab2"; }}
          >
            {open ? Icon.chevronLeft : Icon.chevronRight}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3"
          style={{ scrollbarWidth: "thin" }}
        >
          {sections.map((section, si) => (
            <div key={si} style={{ marginTop: open && si > 0 ? 6 : (si > 0 ? 2 : 0) }}>
              {/* Section caption — only when expanded */}
              {section.cap && open && (
                <div
                  style={{
                    padding: "6px 16px 2px",
                    fontSize: 11, fontWeight: 700,
                    color: "#a1aab2", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {section.cap}
                </div>
              )}

              {section.links.map((link) => (
                <div key={link.to} style={{ padding: "1px 8px" }}>
                  <NavLink
                    to={link.to}
                    title={!open ? link.label : undefined}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: open ? "7px 10px" : "9px 0",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      justifyContent: open ? "flex-start" : "center",
                      background: isActive ? ACTIVE_BG : "transparent",
                      color: isActive ? ACTIVE_TEXT : DEFAULT_TEXT,
                      boxShadow: "none",
                      transition: "background 150ms, color 150ms, padding 280ms, justify-content 280ms",
                    })}
                    onMouseEnter={(e) => {
                      /* use aria-current="page" set by NavLink — reliable, no color string parsing */
                      if (e.currentTarget.getAttribute("aria-current") !== "page") {
                        e.currentTarget.style.background = HOVER_BG;
                        e.currentTarget.style.color = HOVER_TEXT;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (e.currentTarget.getAttribute("aria-current") !== "page") {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = DEFAULT_TEXT;
                      }
                    }}
                  >
                    <span style={{ flexShrink: 0, lineHeight: 0 }}>{link.icon}</span>

                    {/* Label — fades out when collapsed */}
                    <span
                      style={{
                        flex: 1,
                        opacity: open ? 1 : 0,
                        maxWidth: open ? 200 : 0,
                        overflow: "hidden",
                        transition: "opacity 200ms, max-width 280ms",
                      }}
                    >
                      {link.label}
                    </span>

                    {/* Badge */}
                    {link.badge && open && (
                      <span
                        style={{
                          background: "#e5e7eb", color: "#374151",
                          fontSize: 10, padding: "1px 7px",
                          borderRadius: 20, fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                </div>
              ))}
            </div>
          ))}

          {/* ── Logout ── */}
          <div style={{ margin: "8px 8px 0", paddingTop: 8, borderTop: "1px solid #e5eaef" }}>
            <button
              onClick={handleLogout}
              title={!open ? "Logout" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: open ? "8px 10px" : "9px 0",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#dc3545",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
                justifyContent: open ? "flex-start" : "center",
                transition: "background 150ms, padding 280ms, justify-content 280ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ flexShrink: 0, lineHeight: 0 }}>{Icon.logout}</span>
              <span
                style={{
                  opacity: open ? 1 : 0,
                  maxWidth: open ? 200 : 0,
                  overflow: "hidden",
                  transition: "opacity 200ms, max-width 280ms",
                  whiteSpace: "nowrap",
                }}
              >
                Logout
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Spacer so main content doesn't go under the fixed sidebar */}
      <div
        style={{
          flexShrink: 0,
          width: open ? FULL_W : MINI_W,
          transition: "width 280ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </>
  );
}
