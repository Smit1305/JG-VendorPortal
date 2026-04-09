import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { exportCSV } from "../../utils/exportUtils";

const CATEGORIES = ["Payment Issue", "Order Problem", "Document Verification", "Product Listing", "Account Access", "Technical Issue", "Other"];

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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

/* ─── Conversation detail panel ────────────────────────────── */
function DetailPanel({ ticket, onUpdate, onClose }) {
  const [reply, setReply]     = useState("");
  const [sending, setSending] = useState(false);
  const msgEndRef             = useRef(null);
  const isClosed = ["Resolved", "Closed"].includes(ticket.status);

  useEffect(() => {
    setReply("");
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [ticket.id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await vendorApi.replyToTicket(ticket.id, { message: reply.trim() });
      toast.success("Reply sent!");
      setReply("");
      onUpdate();
    } catch (err) { toast.error(err?.message || "Failed to send reply"); }
    finally { setSending(false); }
  };

  const scfg = STATUS_CFG[ticket.status] || STATUS_CFG["Open"];

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
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
              {ticket.category && <>{ticket.category} · </>}
              Created: {ticket.created || "—"}
              {ticket.last_update && <> · Updated: {ticket.last_update}</>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-white/80 rounded-lg transition flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: "#f8fafc" }}>
        {(!ticket.messages || ticket.messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            <p className="text-sm text-gray-400">No messages yet</p>
          </div>
        ) : (
          ticket.messages.map((msg, i) => {
            const isSupport = msg.from === "support";
            return (
              <div key={i} className={`flex gap-2.5 ${isSupport ? "" : "flex-row-reverse"}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: isSupport ? "#4f46e5" : "#2563eb", color: "#fff" }}>
                  {isSupport ? "S" : "V"}
                </div>
                <div className={`flex flex-col ${isSupport ? "items-start" : "items-end"} max-w-[75%]`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isSupport ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm" : "rounded-tr-sm text-white"}`}
                    style={isSupport ? {} : { background: "#2563eb" }}>
                    {msg.text}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    {isSupport ? "Support Team" : "You"} · {msg.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={msgEndRef} />
      </div>

      {/* Reply box */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white p-4">
        {isClosed ? (
          <p className="text-xs text-gray-400 text-center py-2">
            This ticket is <span className="font-semibold">{ticket.status}</span>. No further replies can be sent.
          </p>
        ) : (
          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Type your reply… (Enter to send)"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none transition"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }} />
              <p className="text-xs text-gray-400 mt-1">Press Enter to send · Shift+Enter for new line</p>
            </div>
            <button onClick={handleReply} disabled={sending || !reply.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex-shrink-0"
              style={{ background: "#2563eb" }}>
              {sending
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              }
              {sending ? "…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function SupportRequests() {
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [filter, setFilter]         = useState("");
  const [newModal, setNewModal]     = useState(false);
  const [form, setForm]             = useState({ subject: "", category: "", priority: "Medium", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getSupportTickets();
      setTickets(res?.data?.items || res?.data || []);
    } catch (err) { toast.error(err?.message || "Failed to load tickets"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    const res = await vendorApi.getSupportTickets().catch(() => null);
    if (!res) return;
    const updated = res?.data?.items || res?.data || [];
    setTickets(updated);
    if (selected) {
      const fresh = updated.find(t => t.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  };

  const handleCreate = async () => {
    if (!form.subject.trim()) { toast.error("Please enter a subject"); return; }
    if (!form.category)       { toast.error("Please select a category"); return; }
    setSubmitting(true);
    try {
      await vendorApi.createSupportTicket(form);
      toast.success("Ticket created! We'll respond within 24 hours.");
      setNewModal(false);
      setForm({ subject: "", category: "", priority: "Medium", description: "" });
      fetchTickets();
    } catch (err) { toast.error(err?.message || "Failed to create ticket"); }
    finally { setSubmitting(false); }
  };

  const counts = {
    "":            tickets.length,
    "Open":        tickets.filter(t => t.status === "Open").length,
    "In Progress": tickets.filter(t => t.status?.includes("Progress")).length,
    "Resolved":    tickets.filter(t => t.status === "Resolved").length,
    "Closed":      tickets.filter(t => t.status === "Closed").length,
  };

  const filtered = filter ? tickets.filter(t => t.status === filter) : tickets;

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: "calc(100vh - 72px)" }}>

        {/* Title bar */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-1 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support Requests</h1>
            <p className="text-xs text-gray-400 mt-0.5">Raise and track support issues with our team</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportCSV(filtered, ["id","subject","category","priority","status","created"], ["Ticket ID","Subject","Category","Priority","Status","Created"], "support-tickets")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              CSV
            </button>
            <button onClick={() => { setNewModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
              style={{ background: "#2563eb" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              New Ticket
            </button>
          </div>
        </div>

        {/* Split panel */}
        <div className="flex flex-1 gap-4 min-h-0">

          {/* LEFT — ticket list */}
          <div className={`flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${selected ? "w-[42%] min-w-[300px]" : "flex-1"}`}>

            {/* Filters */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "", label: "All" },
                  { key: "Open", label: "Open" },
                  { key: "In Progress", label: "In Progress" },
                  { key: "Resolved", label: "Resolved" },
                  { key: "Closed", label: "Closed" },
                ].map(s => {
                  const scfg = STATUS_CFG[s.key];
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
            </div>

            {/* Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full" style={{ borderTopColor: "#2563eb" }} />
                  <p className="text-xs text-gray-400">Loading…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                  <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                  <p className="text-sm text-gray-400">No tickets found</p>
                  <button onClick={() => setNewModal(true)}
                    className="text-xs font-semibold text-blue-600 hover:underline">Create one →</button>
                </div>
              ) : (
                filtered.map(t => {
                  const isActive = selected?.id === t.id;
                  const lastMsg = t.messages?.[t.messages.length - 1];
                  const msgCount = t.messages?.length || 0;
                  return (
                    <div key={t.id}
                      onClick={() => setSelected(prev => prev?.id === t.id ? null : t)}
                      className="px-4 py-3.5 cursor-pointer transition-colors"
                      style={{ background: isActive ? "#eff6ff" : "white" }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "white"; }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
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
                      <p className={`text-sm font-semibold leading-snug truncate ${isActive ? "text-blue-700" : "text-gray-800"}`}>
                        {t.subject}
                      </p>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        {t.category && <span className="text-xs text-blue-500 truncate">{t.category}</span>}
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">{t.created}</span>
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          <span className={`font-semibold ${lastMsg.from === "support" ? "text-indigo-500" : "text-gray-500"}`}>
                            {lastMsg.from === "support" ? "Support: " : "You: "}
                          </span>
                          {lastMsg.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT — detail panel (only when a ticket is selected) */}
          {selected && (
            <div className="flex-1 min-w-0 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <DetailPanel ticket={selected} onUpdate={handleUpdate} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create Support Ticket</h3>
                <p className="text-xs text-gray-400 mt-0.5">We'll respond within 24 hours</p>
              </div>
              <button onClick={() => setNewModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject <span className="text-red-500">*</span></label>
                <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Brief description of your issue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-none"
                  placeholder="Describe your issue in detail…" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setNewModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleCreate} disabled={submitting}
                className="px-5 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition hover:opacity-90"
                style={{ background: "#2563eb" }}>
                {submitting ? "Creating…" : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
