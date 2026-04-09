import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { adminApi } from "../../services/api";

/* ─── constants ─────────────────────────────────────────────── */
const STATUS_CFG = {
  "Open":        { cls: "bg-blue-100  text-blue-700  border-blue-200",  dot: "#2563eb", bg: "#eff6ff" },
  "In Progress": { cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "#d97706", bg: "#fffbeb" },
  "Resolved":    { cls: "bg-green-100 text-green-700 border-green-200", dot: "#059669", bg: "#ecfdf5" },
  "Closed":      { cls: "bg-gray-100  text-gray-500  border-gray-200",  dot: "#9ca3af", bg: "#f9fafb" },
};
const PRIORITY_CLS = {
  High:   "bg-red-50   text-red-600   border-red-200",
  Medium: "bg-amber-50 text-amber-600 border-amber-200",
  Low:    "bg-green-50 text-green-600 border-green-200",
};

function Badge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG["Open"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

/* ─── Detail panel (right side) ─────────────────────────────── */
function DetailPanel({ ticket, onUpdate, onClose }) {
  const [reply, setReply]     = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy]       = useState(false);
  const msgEndRef             = useRef(null);

  const isClosed = ["Resolved", "Closed"].includes(ticket.status);

  /* scroll to latest message whenever ticket changes */
  useEffect(() => {
    setReply("");
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [ticket.id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await adminApi.replyToTicket(ticket.id, { message: reply.trim() });
      toast.success("Reply sent");
      setReply("");
      onUpdate();
    } catch (err) { toast.error(err?.message || "Failed to send"); }
    finally { setSending(false); }
  };

  const handleStatus = async (newStatus) => {
    setBusy(true);
    try {
      await adminApi.updateTicketStatus(ticket.id, newStatus);
      toast.success(`Marked as ${newStatus}`);
      onUpdate();
    } catch (err) { toast.error(err?.message || "Failed to update"); }
    finally { setBusy(false); }
  };

  const scfg = STATUS_CFG[ticket.status] || STATUS_CFG["Open"];

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Panel header ── */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100" style={{ background: scfg.bg }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-mono text-xs font-bold text-gray-500">{ticket.id}</span>
              <Badge status={ticket.status} />
              {ticket.priority && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_CLS[ticket.priority] || ""}`}>
                  {ticket.priority}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-900 leading-snug">{ticket.subject}</p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-semibold text-indigo-600">{ticket.vendor_name}</span>
              {ticket.category && <> · {ticket.category}</>}
              {ticket.created && <> · {ticket.created}</>}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-white/80 rounded-lg flex-shrink-0 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status changer row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">Change status:</span>
          {["Open", "In Progress", "Resolved", "Closed"].map(s => (
            <button key={s} disabled={busy || ticket.status === s}
              onClick={() => handleStatus(s)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition disabled:opacity-40"
              style={ticket.status === s
                ? { background: STATUS_CFG[s].dot, color: "#fff", borderColor: STATUS_CFG[s].dot }
                : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: "#f8fafc" }}>
        {(!ticket.messages || ticket.messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-gray-400">No messages yet</p>
          </div>
        ) : (
          ticket.messages.map((msg, i) => {
            const isAdmin = msg.from === "support";
            return (
              <div key={i} className={`flex gap-2.5 ${isAdmin ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: isAdmin ? "#4f46e5" : "#6b7280", color: "#fff" }}>
                  {isAdmin ? "A" : "V"}
                </div>
                <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-[75%]`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isAdmin ? "rounded-tr-sm text-white" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"}`}
                    style={isAdmin ? { background: "#4f46e5" } : {}}>
                    {msg.text}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    {isAdmin ? "Support (Admin)" : "Vendor"} · {msg.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={msgEndRef} />
      </div>

      {/* ── Reply box ── */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white p-4">
        {isClosed ? (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              Ticket is <span className="font-semibold">{ticket.status}</span>.
              Change status to reply.
            </p>
          </div>
        ) : (
          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Type your reply to the vendor… (Ctrl+Enter to send)"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none transition"
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleReply(); }} />
            </div>
            <button onClick={handleReply} disabled={sending || !reply.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex-shrink-0"
              style={{ background: "#4f46e5" }}>
              {sending
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              }
              {sending ? "Sending…" : "Reply"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function AdminTickets() {
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);   // currently open ticket
  const [filter, setFilter]       = useState("");
  const [search, setSearch]       = useState("");

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTickets();
      setTickets(res?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load tickets");
    } finally { setLoading(false); }
  };

  /* after update, refresh list and keep selected ticket fresh */
  const handleUpdate = async () => {
    const res = await adminApi.getTickets().catch(() => null);
    if (!res) return;
    const updated = res.data || [];
    setTickets(updated);
    if (selected) {
      const fresh = updated.find(t => t.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  };

  const counts = {
    "":            tickets.length,
    "Open":        tickets.filter(t => t.status === "Open").length,
    "In Progress": tickets.filter(t => t.status === "In Progress").length,
    "Resolved":    tickets.filter(t => t.status === "Resolved").length,
    "Closed":      tickets.filter(t => t.status === "Closed").length,
  };

  const filtered = tickets
    .filter(t => !filter || t.status === filter)
    .filter(t => !search
      || t.subject?.toLowerCase().includes(search.toLowerCase())
      || t.vendor_name?.toLowerCase().includes(search.toLowerCase())
      || t.id?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      {/* Full-height container — flex row splits list | detail */}
      <div className="flex flex-col h-full" style={{ height: "calc(100vh - 72px)" }}>

        {/* ── Page title bar ── */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-1 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-xs text-gray-400 mt-0.5">View and respond to vendor support requests</p>
          </div>
          <button onClick={fetchTickets}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Split panel ── */}
        <div className="flex flex-1 gap-4 min-h-0">

          {/* ── LEFT: ticket list ── */}
          <div className={`flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${selected ? "w-[42%] min-w-[320px]" : "flex-1"}`}>

            {/* Filter / search bar */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 space-y-2.5">
              {/* Status chips */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "",            label: "All" },
                  { key: "Open",        label: "Open" },
                  { key: "In Progress", label: "In Progress" },
                  { key: "Resolved",    label: "Resolved" },
                  { key: "Closed",      label: "Closed" },
                ].map(s => {
                  const scfg = STATUS_CFG[s.key] || { dot: "#374151" };
                  const active = filter === s.key;
                  return (
                    <button key={s.key} onClick={() => setFilter(s.key)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition"
                      style={active
                        ? { background: s.key ? scfg.dot : "#1e293b", color: "#fff", borderColor: "transparent" }
                        : { background: "#f8fafc", color: "#6b7280", borderColor: "#e5e7eb" }}>
                      {s.label} {!loading && `(${counts[s.key]})`}
                    </button>
                  );
                })}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 h-8">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by subject, vendor or ID…"
                  className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none border-none focus:ring-0" style={{ boxShadow: "none" }} />
              </div>
            </div>

            {/* Ticket rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full" style={{ borderTopColor: "#4f46e5" }} />
                  <p className="text-xs text-gray-400">Loading tickets…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="w-10 h-10 text-gray-200 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                  <p className="text-sm text-gray-400">No tickets found</p>
                </div>
              ) : (
                filtered.map(t => {
                  const isActive = selected?.id === t.id;
                  const scfg = STATUS_CFG[t.status] || STATUS_CFG["Open"];
                  const msgCount = t.messages?.length || 0;
                  return (
                    <div key={t.id}
                      onClick={() => setSelected(prev => prev?.id === t.id ? null : t)}
                      className="px-4 py-3.5 cursor-pointer transition-colors"
                      style={{ background: isActive ? "#eef2ff" : "white" }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "white"; }}>

                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-400">{t.id}</span>
                          <Badge status={t.status} />
                          {t.priority && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${PRIORITY_CLS[t.priority] || ""}`}>
                              {t.priority}
                            </span>
                          )}
                        </div>
                        {msgCount > 0 && (
                          <span className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                            </svg>
                            {msgCount}
                          </span>
                        )}
                      </div>

                      <p className={`text-sm font-semibold leading-snug truncate ${isActive ? "text-indigo-700" : "text-gray-800"}`}>
                        {t.subject}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <span className="text-xs font-medium truncate" style={{ color: "#4f46e5" }}>{t.vendor_name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{t.created}</span>
                      </div>

                      {t.messages?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {t.messages[t.messages.length - 1]?.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: detail panel (only when a ticket is selected) ── */}
          {selected && (
            <div className="flex-1 min-w-0 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <DetailPanel
                ticket={selected}
                onUpdate={handleUpdate}
                onClose={() => setSelected(null)}
              />
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
