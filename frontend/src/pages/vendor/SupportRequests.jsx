import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { exportCSV, exportPDF } from "../../utils/exportUtils";

const C = {
  blue:    { bg: "#eff6ff", text: "#2563eb", light: "#dbeafe" },
  violet:  { bg: "#f5f3ff", text: "#7c3aed", light: "#ede9fe" },
  emerald: { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" },
  amber:   { bg: "#fffbeb", text: "#d97706", light: "#fde68a" },
};

const CATEGORIES = ["Payment Issue", "Order Problem", "Document Verification", "Product Listing", "Account Access", "Technical Issue", "Other"];

const STATUS_META = {
  Open:          { cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "In Progress": { cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  Resolved:      { cls: "bg-green-100 text-green-700 border-green-200" },
  Closed:        { cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const PRIORITY_META = {
  High:   "bg-red-100 text-red-600 border-red-200",
  Medium: "bg-yellow-100 text-yellow-600 border-yellow-200",
  Low:    "bg-green-100 text-green-600 border-green-200",
};

function StatusBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META[Object.keys(STATUS_META).find(k => k.toLowerCase() === (status || "").toLowerCase())] || { cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>{status}</span>;
}

function TicketCard({ ticket, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const isClosed = ["Resolved", "Closed", "resolved", "closed"].includes(ticket.status);

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await vendorApi.replyToTicket(ticket.id, { message: reply });
      toast.success("Reply sent!");
      setReply("");
      if (onReply) onReply();
    } catch (err) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition ${expanded ? "shadow-sm" : ""}`} style={{ borderColor: expanded ? C.blue.light : "#f3f4f6" }}>
      {/* Ticket header */}
      <div className="flex flex-wrap items-start gap-3 px-5 py-4 bg-white cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-gray-500">{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            {ticket.priority && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_META[ticket.priority] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                {ticket.priority}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800">{ticket.subject}</p>
          <p className="text-xs text-gray-400">
            {ticket.category && <span className="mr-2" style={{ color: C.blue.text }}>{ticket.category}</span>}
            Created: {ticket.created || "—"}
            {ticket.last_update && ` · Updated: ${ticket.last_update}`}
          </p>
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-semibold"
          style={{ background: expanded ? C.blue.bg : "#f9fafb", color: expanded ? C.blue.text : "#9ca3af" }}>
          {expanded ? "−" : "+"}
        </div>
      </div>

      {/* Conversation */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-4 space-y-4 bg-gray-50 max-h-80 overflow-y-auto">
            {(ticket.messages || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
            ) : (
              ticket.messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.from === "vendor" ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: msg.from === "vendor" ? C.blue.text : "#6b7280", color: "#fff" }}>
                    {msg.from === "vendor" ? "V" : "S"}
                  </div>
                  <div className={`flex flex-col ${msg.from === "vendor" ? "items-end" : "items-start"} max-w-xs lg:max-w-sm`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "vendor" ? "rounded-tr-sm text-white" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"}`}
                      style={msg.from === "vendor" ? { background: C.blue.text } : {}}>
                      {msg.text}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-1">{msg.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {!isClosed && (
            <div className="px-5 py-3 border-t border-gray-100 flex gap-2 bg-white">
              <input type="text" value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendReply()} />
              <button onClick={handleSendReply} disabled={sending || !reply.trim()}
                className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                style={{ background: C.blue.text }}>
                {sending ? "..." : "Send"}
              </button>
            </div>
          )}
          {isClosed && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">This ticket is {ticket.status.toLowerCase()}. No further replies can be sent.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportRequests() {
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "", priority: "Medium", description: "" });
  const [filter, setFilter] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getSupportTickets();
      setTickets(res?.data?.items || res?.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!form.subject.trim()) { toast.error("Please enter a subject"); return; }
    if (!form.category)       { toast.error("Please select a category"); return; }
    setSubmitting(true);
    try {
      await vendorApi.createSupportTicket(form);
      toast.success("Support ticket created! Our team will respond within 24 hours.");
      setNewTicketModal(false);
      setForm({ subject: "", category: "", priority: "Medium", description: "" });
      fetchTickets();
    } catch (err) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter ? tickets.filter(t => t.status === filter) : tickets;

  const statCards = [
    {
      label: "Open",
      count: tickets.filter(t => (t.status || "").toLowerCase() === "open").length,
      col: C.blue,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "In Progress",
      count: tickets.filter(t => (t.status || "").toLowerCase().includes("progress")).length,
      col: C.amber,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: "Resolved",
      count: tickets.filter(t => (t.status || "").toLowerCase() === "resolved").length,
      col: C.emerald,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Support Requests</h1>
            <p className="text-xs text-gray-400 mt-0.5">Raise and track support issues with our team</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(filtered, ["id","subject","category","priority","status","created","last_update"], ["Ticket ID","Subject","Category","Priority","Status","Created","Last Update"], "support-tickets")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button
              onClick={() => exportPDF("Support Requests")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <button onClick={fetchTickets} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={() => setNewTicketModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
              style={{ background: C.blue.text }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Ticket
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.col.bg, color: card.col.text }}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{loading ? "—" : card.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ticket list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</p>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition min-w-[160px]">
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="p-5 space-y-3">
            {loading ? (
              <div className="py-16 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-400">Loading tickets...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: C.blue.bg }}>
                  <svg className="w-6 h-6" fill="none" stroke={C.blue.text} strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-400">No tickets found</p>
                <p className="text-xs text-gray-300 mt-1">Create a new ticket if you need help</p>
              </div>
            ) : (
              filtered.map(t => <TicketCard key={t.id} ticket={t} onReply={fetchTickets} />)
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Create Support Ticket</h3>
                <p className="text-xs text-gray-400 mt-0.5">We'll respond within 24 hours</p>
              </div>
              <button onClick={() => setNewTicketModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject <span className="text-red-500">*</span></label>
                <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" placeholder="Brief description of your issue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-none" placeholder="Describe your issue in detail..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setNewTicketModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleCreateTicket} disabled={submitting}
                className="px-5 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                style={{ background: C.blue.text }}>
                {submitting ? "Creating..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
