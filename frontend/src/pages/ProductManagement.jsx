import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";
import { downloadProductPDF } from "../utils/pdfExport";

const C = { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" };
const MEDIA_BASE = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:8000";
const imgUrl = (path) => path ? (path.startsWith("http") ? path : `${MEDIA_BASE}/uploads/${path}`) : null;

const STATUS_MAP = {
  active:      { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:    { label: "Inactive", cls: "bg-gray-100   text-gray-600   border-gray-200" },
  draft:       { label: "Draft",    cls: "bg-amber-50   text-amber-700  border-amber-200" },
  out_of_stock:{ label: "Out of Stock", cls: "bg-rose-50 text-rose-700  border-rose-200" },
};

function Badge({ status }) {
  const s = STATUS_MAP[(status || "").toLowerCase()] || { label: status || "—", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
}

const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap";
const TD = "px-4 py-3 text-sm text-gray-700";
const PER_PAGE_OPTS = [10, 15, 20, 50];

export default function ProductManagement() {
  const navigate   = useNavigate();
  const importRef  = useRef(null);

  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [perPage, setPerPage]       = useState(15);
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState({ total: 0, pages: 1 });
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [importing, setImporting]   = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res  = await vendorApi.getProducts(params);
      const data = res?.data || res;
      setProducts(data?.items || data?.data || []);
      setMeta({ total: data?.total || 0, pages: data?.pages || 1 });
    } catch (err) {
      toast.error(err?.message || "Failed to load products");
    } finally { setLoading(false); }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const stats = useMemo(() => ({
    total:    meta.total,
    active:   products.filter(p => p.status?.toLowerCase() === "active").length,
    draft:    products.filter(p => p.status?.toLowerCase() === "draft").length,
    inactive: products.filter(p => ["inactive","out_of_stock"].includes(p.status?.toLowerCase())).length,
  }), [products, meta.total]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await vendorApi.deleteProduct(deleteModal.id);
      toast.success("Product deleted");
      setDeleteModal(null);
      loadProducts();
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    } finally { setDeleting(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await vendorApi.importProducts(file);
      toast.success("Products imported successfully");
      loadProducts();
    } catch (err) {
      toast.error(err?.message || "Import failed");
    } finally { setImporting(false); importRef.current.value = ""; }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.bg }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Catalogue</h1>
              <p className="text-xs text-gray-400 mt-0.5">Manage your product listings, pricing and inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={importRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />
            <button onClick={() => importRef.current?.click()} disabled={importing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {importing ? "Importing…" : "Import"}
            </button>
            <button onClick={() => navigate("/vendor/add-product")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition"
              style={{ background: C.text }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Products", val: meta.total,    color: "#6366f1", bg: "#f5f3ff" },
            { label: "Active",         val: stats.active,  color: "#059669", bg: "#ecfdf5" },
            { label: "Draft",          val: stats.draft,   color: "#d97706", bg: "#fffbeb" },
            { label: "Inactive",       val: stats.inactive,color: "#9ca3af", bg: "#f9fafb" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                <span className="text-sm font-bold" style={{ color: s.color }}>{loading ? "—" : s.val}</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Filter bar */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-100 rounded-lg px-3 h-9">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search product name or SKU…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 border-none focus:border-none" style={{ boxShadow: "none" }} />
            </div>
            <Sel value={statusFilter} onChange={v => { setStatus(v); setPage(1); }} label="All Status" opts={[
              { v: "active", l: "Active" }, { v: "inactive", l: "Inactive" }, { v: "draft", l: "Draft" }, { v: "out_of_stock", l: "Out of Stock" }
            ]} />
            <Sel value={perPage} onChange={v => { setPerPage(Number(v)); setPage(1); }} label={null} opts={PER_PAGE_OPTS.map(n => ({ v: n, l: `${n} Rows` }))} />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className={TH}>#</th>
                  <th className={TH}>Product Name</th>
                  <th className={TH}>Category</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>Price (₹)</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
                      <p className="text-xs text-gray-400">Loading products…</p>
                    </div>
                  </td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/></svg>
                    <p className="text-sm text-gray-400">No products found</p>
                    <button onClick={() => navigate("/vendor/add-product")}
                      className="mt-3 px-4 py-2 text-xs font-semibold text-white rounded-lg transition"
                      style={{ background: C.text }}>
                      + Add your first product
                    </button>
                  </td></tr>
                ) : products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/vendor/products/${p.id}`)}>
                    <td className={TD + " text-gray-400 text-xs"}>{(page - 1) * perPage + idx + 1}</td>
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                          {p.thumbnail_image
                            ? <img src={imgUrl(p.thumbnail_image)} alt={p.name} className="w-full h-full object-cover" />
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8" strokeLinecap="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/></svg>}
                        </div>
                        <span className="font-medium text-gray-900 max-w-48 truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className={TD + " text-gray-500 text-xs"}>{p.category_name || "—"}</td>
                    <td className={TD}>
                      <span className="text-xs font-mono text-gray-500">{p.sku_type || "—"}</span>
                    </td>
                    <td className={TD + " font-semibold text-gray-900"}>
                      {p.regular_price ? `₹ ${Number(p.regular_price).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className={TD}><Badge status={p.status} /></td>
                    <td className={TD}>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <ActionBtn icon="eye"   title="View"   color={C.text}  onClick={() => navigate(`/vendor/products/${p.id}`)} />
                        <ActionBtn icon="pdf"   title="Download PDF" color="#059669" onClick={() => downloadProductPDF(p)} />
                        <ActionBtn icon="edit"  title="Edit"   color="#2563eb" onClick={() => navigate(`/vendor/edit-product/${p.id}`)} />
                        <ActionBtn icon="trash" title="Delete" color="#e11d48" onClick={() => setDeleteModal(p)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-500 font-medium">
              Showing {products.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, meta.total)} of {meta.total} results
            </p>
            <Pagination page={page} total={meta.pages} onPage={setPage} />
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800 text-center mb-1">Delete Product?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              <span className="font-medium text-gray-700">"{deleteModal.name}"</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function ActionBtn({ icon, title, color, onClick }) {
  const icons = {
    eye:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    edit:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    pdf:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  };
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded-lg transition" style={{ color: "#9ca3af" }}
      onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = color + "15"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}>
      {icons[icon]}
    </button>
  );
}

function Sel({ value, onChange, label, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-9 px-3 pr-8 text-xs font-semibold border border-gray-200 rounded-lg bg-white text-gray-600 outline-none appearance-none"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
      {label && <option value="">{label}</option>}
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function Pagination({ page, total, onPage }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(total, page + 2));
  return (
    <div className="flex items-center gap-1">
      <PBtn label="Previous" disabled={page <= 1} onClick={() => onPage(p => p - 1)} />
      {pages.map(n => <PBtn key={n} label={String(n).padStart(2, "0")} active={n === page} onClick={() => onPage(n)} />)}
      <PBtn label="Next" disabled={page >= total} onClick={() => onPage(p => p + 1)} />
    </div>
  );
}

function PBtn({ label, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition"
      style={active
        ? { background: "#1e293b", color: "#fff", borderColor: "#1e293b" }
        : { background: "#fff", color: disabled ? "#d1d5db" : "#374151", borderColor: "#e5e7eb", cursor: disabled ? "not-allowed" : "pointer" }}>
      {label}
    </button>
  );
}
