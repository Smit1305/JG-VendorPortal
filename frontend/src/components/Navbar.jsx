import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { adminApi, authApi, vendorApi } from "../services/api";

const PRIMARY = "#5d87ff";

/* Quick-search index — maps keywords to routes */
const SEARCH_INDEX = [
  { label: "Seller Dashboard",        route: "/vendor/main",            keywords: ["dashboard", "home", "overview", "main"] },
  { label: "Manage Orders",           route: "/vendor/orders",          keywords: ["orders", "order", "purchase"] },
  { label: "Manage RFQs",             route: "/vendor/rfqs",            keywords: ["rfq", "quotation", "quote", "rfqs"] },
  { label: "Manage Catalogue",        route: "/vendor/products",        keywords: ["products", "product", "catalogue", "catalog", "sku", "listing"] },
  { label: "Manage Logistics",        route: "/vendor/logistics",       keywords: ["logistics", "shipment", "shipping", "delivery", "track"] },
  { label: "Manage Returns",          route: "/vendor/returns",         keywords: ["returns", "return", "refund", "dispute"] },
  { label: "Manage Payments",         route: "/vendor/payments",        keywords: ["payments", "payment", "invoice", "invoice", "paid", "due"] },
  { label: "Manage Loans",            route: "/vendor/loans",           keywords: ["loans", "loan", "credit", "finance", "financing"] },
  { label: "Support Requests",        route: "/vendor/support",         keywords: ["support", "ticket", "help", "issue", "problem"] },
  { label: "Manage Commercials",      route: "/vendor/commercials",     keywords: ["commercials", "commercial", "bank", "settlement", "commission"] },
  { label: "Get Assistance",          route: "/vendor/assistance",      keywords: ["assistance", "assist", "service"] },
  { label: "Upload Documents",        route: "/vendor/documents",       keywords: ["documents", "document", "upload", "verification", "gst", "pan"] },
  { label: "Service Provider",        route: "/vendor/service-provider",keywords: ["service provider", "service"] },
  { label: "My Profile",              route: "/vendor/profile",         keywords: ["profile", "account", "settings", "password"] },
  { label: "Loyalty Rewards",         route: "/vendor/rewards",         keywords: ["rewards", "reward", "loyalty", "points"] },
  { label: "Admin Dashboard",         route: "/admin/dashboard",        keywords: ["admin", "dashboard"] },
  { label: "Verified Vendors",        route: "/admin/vendors",          keywords: ["vendors", "vendor"] },
  { label: "Pending Vendors",         route: "/admin/pending-vendors",  keywords: ["pending", "non-verified"] },
];

function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);
  const [focused, setFocused]     = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false); setResults([]); setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setActiveIdx(-1);
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    const filtered = SEARCH_INDEX.filter((item) =>
      item.label.toLowerCase().includes(lower) ||
      item.keywords.some((kw) => kw.includes(lower))
    );
    setResults(filtered.slice(0, 7));
  };

  const handleSelect = (route) => {
    navigate(route); setQuery(""); setResults([]); setFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) handleSelect(results[activeIdx].route);
    if (e.key === "Escape") { setQuery(""); setResults([]); setFocused(false); inputRef.current?.blur(); }
  };

  const showDrop = focused && results.length > 0;
  const showEmpty = focused && query.trim().length > 0 && results.length === 0;

  return (
    <div ref={wrapRef} className="relative" style={{ width: 420 }}>
      {/* Input shell */}
      <div style={{
        display: "flex", alignItems: "center",
        height: 42,
        borderRadius: showDrop || showEmpty ? "12px 12px 0 0" : 12,
        background: focused ? "#fff" : "#f4f6fb",
        border: `1.5px solid ${focused ? "#5d87ff55" : "#e5eaef"}`,
        boxShadow: focused ? "0 0 0 3px #5d87ff18, 0 2px 12px rgba(93,135,255,0.08)" : "none",
        transition: "all 180ms ease",
        overflow: "hidden",
      }}>
        {/* Left icon area */}
        <div style={{
          width: 42, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={focused ? "#5d87ff" : "#9aa5b8"} strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "stroke 180ms" }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages, features…"
          style={{
            flex: 1, border: "none", background: "transparent",
            outline: "none", boxShadow: "none",
            fontSize: 13.5, color: "#1e293b", fontWeight: 500,
            caretColor: "#5d87ff",
          }}
        />

        {/* Right side: clear btn OR keyboard hint */}
        <div style={{ paddingRight: 10, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          {query ? (
            <button
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              style={{
                width: 20, height: 20, borderRadius: "50%", background: "#e2e8f0",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 2,
              background: "#f1f5f9", borderRadius: 6,
              padding: "2px 6px", border: "1px solid #e2e8f0",
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: 0.3 }}>⌘K</span>
            </div>
          )}

          {/* Search button */}
          <button
            onClick={() => query && results[0] && handleSelect(results[0].route)}
            style={{
              width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
              background: focused ? "linear-gradient(135deg, #5d87ff, #7c3aed)" : "#e8ecf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 180ms ease",
              flexShrink: 0,
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={focused ? "#fff" : "#9aa5b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "stroke 180ms" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown results */}
      {(showDrop || showEmpty) && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50,
          background: "#fff",
          border: "1.5px solid #5d87ff55",
          borderTop: "1px solid #f0f4ff",
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 12px 32px rgba(93,135,255,0.12)",
          overflow: "hidden",
        }}>
          {showEmpty ? (
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <span style={{ fontSize: 12.5, color: "#94a3b8" }}>No results for "<strong style={{ color: "#64748b" }}>{query}</strong>"</span>
            </div>
          ) : (
            <>
              <div style={{ padding: "8px 14px 4px", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
              </div>
              {results.map((item, i) => (
                <button
                  key={item.route}
                  onClick={() => handleSelect(item.route)}
                  className="w-full flex items-center gap-3 text-left"
                  style={{
                    padding: "9px 14px",
                    background: i === activeIdx ? "#f5f8ff" : "transparent",
                    border: "none", cursor: "pointer",
                    borderLeft: `3px solid ${i === activeIdx ? "#5d87ff" : "transparent"}`,
                    transition: "all 120ms",
                  }}
                  onMouseEnter={e => { setActiveIdx(i); e.currentTarget.style.background = "#f5f8ff"; e.currentTarget.style.borderLeftColor = "#5d87ff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: i === activeIdx ? "#eff6ff" : "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 120ms",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={i === activeIdx ? "#5d87ff" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12h18M13 6l6 6-6 6"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: i === activeIdx ? 600 : 500, color: i === activeIdx ? "#1e293b" : "#374151" }}>
                    {item.label}
                  </span>
                  {i === activeIdx && (
                    <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                      <kbd style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 5, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6" }}>↵</kbd>
                    </div>
                  )}
                </button>
              ))}
              <div style={{ padding: "6px 14px 8px", borderTop: "1px solid #f8fafc", display: "flex", gap: 12 }}>
                {[["↑↓", "Navigate"], ["↵", "Open"], ["Esc", "Close"]].map(([key, hint]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <kbd style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700 }}>{key}</kbd>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{hint}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onMenuClick }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const dropRef  = useRef(null);
  const notifRef = useRef(null);

  const [navState, setNavState] = useState(() => ({
    userName:  localStorage.getItem("vp_user_name")  || "User",
    userEmail: localStorage.getItem("vp_user_email") || "",
    userPhoto: localStorage.getItem("vp_user_photo") || null,
    verStatus: localStorage.getItem("vp_verification_status") || "",
    docStatus: localStorage.getItem("vp_doc_verify_status")   || "",
  }));

  // Re-read localStorage whenever it changes (photo upload, status update, etc.)
  useEffect(() => {
    const sync = () => setNavState({
      userName:  localStorage.getItem("vp_user_name")  || "User",
      userEmail: localStorage.getItem("vp_user_email") || "",
      userPhoto: localStorage.getItem("vp_user_photo") || null,
      verStatus: localStorage.getItem("vp_verification_status") || "",
      docStatus: localStorage.getItem("vp_doc_verify_status")   || "",
    });
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const { userName, userEmail, userPhoto, verStatus, docStatus } = navState;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const api = role === "admin" ? adminApi : vendorApi;
      const res = await api.getNotifications();
      const data = res?.data || res;
      setNotifications(data?.items || []);
      setUnreadCount(data?.unread_count || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const api = role === "admin" ? adminApi : vendorApi;
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const api = role === "admin" ? adminApi : vendorApi;
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDeleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      const api = role === "admin" ? adminApi : vendorApi;
      await api.deleteNotification(id);
      const removed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (removed && !removed.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    if (notif.link) { navigate(notif.link); setNotifOpen(false); }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    navigate("/login");
  };

  const profileRoute = role === "admin" ? "/admin/profile" : "/vendor/profile";

  const notifTypeColor = (type) => ({
    success: { bg: "#ecfdf5", border: "#a7f3d0", dot: "#059669" },
    error:   { bg: "#fff1f2", border: "#fecdd3", dot: "#e11d48" },
    warning: { bg: "#fffbeb", border: "#fde68a", dot: "#d97706" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb" },
  }[type] || { bg: "#f8fafc", border: "#e2e8f0", dot: "#64748b" });

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header
      className="flex-shrink-0 px-4 md:px-5"
      style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #e5eaef",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Left: hamburger */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ color: "#536076" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
          onMouseLeave={e => e.currentTarget.style.background = ""}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Center: search box */}
      <div className="hidden md:flex justify-center px-4">
        <SearchBar />
      </div>

      {/* Right: status badges + profile */}
      <div className="flex items-center justify-end gap-2.5" ref={dropRef}>
        {/* Verification status badges — vendor only */}
        {role !== "admin" && (
          <div className="hidden lg:flex items-center gap-2">
            {verStatus && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: verStatus === "verified" ? "#e8f5e9" : "#fff8e1",
                color: verStatus === "verified" ? "#2e7d32" : "#f57f17",
                border: `1px solid ${verStatus === "verified" ? "#a5d6a7" : "#ffe082"}`,
              }}>
                {verStatus === "verified" ? "✓ Verified" : "⏳ Unverified"}
              </span>
            )}
            {docStatus && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                ...(docStatus === "verified"  ? { background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" }
                  : docStatus === "rejected"  ? { background: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" }
                  : docStatus === "resubmit"  ? { background: "#fff3e0", color: "#e65100", border: "1px solid #ffcc80" }
                  :                             { background: "#fff8e1", color: "#f57f17", border: "1px solid #ffe082" }),
              }}>
                {docStatus === "verified"  ? "✓ Docs Verified"
                 : docStatus === "rejected"  ? "✗ Docs Rejected"
                 : docStatus === "resubmit"  ? "⚠ Resubmit Docs"
                 : "⏳ Docs Pending"}
              </span>
            )}
          </div>
        )}

        {/* Notifications bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: "#536076" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white flex items-center justify-center"
                style={{ fontSize: 10, fontWeight: 700, padding: "0 4px" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 z-50"
              style={{ width: 360, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid #e5eaef" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #f0f4ff" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#eff6ff", color: "#2563eb" }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead}
                    style={{ fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const c = notifTypeColor(notif.type);
                    return (
                      <div key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group"
                        style={{
                          background: notif.is_read ? "transparent" : c.bg,
                          borderBottom: "1px solid #f8fafc",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? "transparent" : c.bg}
                      >
                        {/* Dot */}
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: notif.is_read ? "#d1d5db" : c.dot, flexShrink: 0, marginTop: 5 }} />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 13, fontWeight: notif.is_read ? 500 : 700, color: "#1e293b", marginBottom: 2 }}>{notif.title}</p>
                          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{notif.message}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{timeAgo(notif.created_at)}</p>
                        </div>
                        <button onClick={(e) => handleDeleteNotif(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-100"
                          style={{ color: "#9ca3af", flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
            style={{ border: "1px solid #e5eaef" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
              background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${PRIMARY}33`, flexShrink: 0,
            }}>
              {userPhoto
                ? <img src={userPhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 13 }}>{userName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="hidden sm:block text-left">
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2a3547", lineHeight: 1.2, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </p>
              <p style={{ fontSize: 10, color: "#a1aab2", lineHeight: 1.2 }}>
                {role === "admin" ? "Administrator" : "Vendor"}
              </p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a1aab2" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-12 z-50 overflow-hidden"
              style={{ width: 270, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e5eaef" }}
            >
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f0f4ff", background: "#f8faff" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", overflow: "hidden",
                  background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  border: `2px solid ${PRIMARY}44`,
                }}>
                  {userPhoto
                    ? <img src={userPhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 15 }}>{userName.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#2a3547", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
                  <p style={{ fontSize: 11, color: "#a1aab2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
                  <span style={{
                    display: "inline-block", marginTop: 3, fontSize: 10, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 20,
                    background: role === "admin" ? "#e8f0fe" : "#e8f5e9",
                    color: role === "admin" ? PRIMARY : "#2e7d32",
                  }}>
                    {role === "admin" ? "Administrator" : "Vendor"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to={profileRoute}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ color: "#536076", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: PRIMARY }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#2a3547" }}>My Profile</p>
                    <p style={{ fontSize: 11, color: "#a1aab2" }}>Account Settings</p>
                  </div>
                </Link>

                {role !== "admin" && (
                  <Link
                    to="/vendor/documents"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                    style={{ color: "#536076", textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff8e1", display: "flex", alignItems: "center", justifyContent: "center", color: "#f57f17" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#2a3547" }}>My Documents</p>
                      <p style={{ fontSize: 11, color: "#a1aab2" }}>Upload & Manage</p>
                    </div>
                  </Link>
                )}
              </div>

              <div className="px-4 pb-3 pt-1" style={{ borderTop: "1px solid #f0f4ff" }}>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{ border: `1px solid ${PRIMARY}`, color: PRIMARY, background: "transparent", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = PRIMARY; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = PRIMARY; }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
