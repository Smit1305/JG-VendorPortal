export default function DetailDrawer({ open, onClose, title, subtitle, accentColor = "#2563eb", onPDF, onCSV, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full" style={{ borderLeft: "1px solid #f1f5f9" }}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">{title}</h2>
            {subtitle && (
              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold"
                style={{ background: `${accentColor}15`, color: accentColor }}>{subtitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            {onCSV && (
              <button onClick={onCSV} title="Download Excel/CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
                </svg>
                Excel
              </button>
            )}
            {onPDF && (
              <button onClick={onPDF} title="Download PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition"
                style={{ background: accentColor }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                PDF
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable detail section wrapper ── */
export function DSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">{children}</div>
    </div>
  );
}

/* ── Single field row ── */
export function DField({ label, value, mono, accent }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 flex-shrink-0 w-32">{label}</span>
      <span className={`text-sm font-medium text-right flex-1 ${mono ? "font-mono" : ""}`}
        style={accent ? { color: accent } : { color: "#111827" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}
