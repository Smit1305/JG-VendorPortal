import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { vendorApi } from "../../services/api";
import { downloadProductPDF } from "../../utils/pdfExport";
const C = { bg: "#ecfdf5", text: "#059669", light: "#d1fae5" };
const MEDIA_BASE = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:8000";
const imgUrl = (path) => path ? (path.startsWith("http") ? path : `${MEDIA_BASE}/uploads/${path}`) : null;

const STATUS_MAP = {
  active:       { label: "Active",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:     { label: "Inactive",      cls: "bg-gray-100   text-gray-600   border-gray-200" },
  draft:        { label: "Draft",         cls: "bg-amber-50   text-amber-700  border-amber-200" },
  out_of_stock: { label: "Out of Stock",  cls: "bg-rose-50    text-rose-700   border-rose-200" },
};

function Badge({ status }) {
  const s = STATUS_MAP[(status || "").toLowerCase()] || { label: status || "—", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>;
}

function InfoCard({ label, value, accent, mono }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">{label}</p>
      <p className={`text-sm font-semibold ${mono ? "font-mono" : ""}`} style={{ color: accent || "#111827" }}>{value || "—"}</p>
    </div>
  );
}

export default function CatalogueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await vendorApi.getProduct(id);
        const product = res?.data || res;
        if (product) setProduct(product);
        else toast.error("Product not found");
      } catch { toast.error("Failed to load product"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await vendorApi.deleteProduct(id);
      toast.success("Product deleted");
      navigate("/vendor/products");
    } catch (err) { toast.error(err?.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-gray-100 rounded-full" style={{ borderTopColor: C.text }} />
          <p className="text-sm text-gray-400">Loading product…</p>
        </div>
      </div>
    </Layout>
  );

  if (!product) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <button onClick={() => navigate("/vendor/products")} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: C.text }}>Back to Catalogue</button>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="w-full space-y-5">

        {/* Breadcrumb + Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <button onClick={() => navigate("/vendor/products")} className="hover:text-emerald-600 transition font-medium">Manage Catalogue</button>
              <span>/</span>
              <span className="text-gray-600 truncate max-w-48">{product.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/vendor/products")}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Product Details</h1>
                <p className="text-xs text-gray-400 mt-0.5">{product.sku ? `SKU: ${product.sku}` : "Catalogue item"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadProductPDF(product)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Export PDF
            </button>
            <button onClick={() => navigate(`/vendor/edit-product/${product.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition"
              style={{ background: C.text }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Product
            </button>
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-lg transition"
              style={{ background: "#e11d48" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Product Image + Name */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {imgUrl(product.thumbnail_image) ? (
                <div className="w-full h-56 bg-gray-50 border-b border-gray-100">
                  <img src={imgUrl(product.thumbnail_image)} alt={product.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-full h-40 bg-emerald-50 flex items-center justify-center border-b border-gray-100">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>
                  </svg>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                    {product.brand && <p className="text-sm text-gray-400 mt-0.5">{product.brand}</p>}
                  </div>
                  <Badge status={product.status} />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Price</p>
                  <p className="text-xl font-bold text-emerald-700">{product.regular_price ? `₹ ${Number(product.regular_price).toLocaleString("en-IN")}` : "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Sale Price</p>
                  <p className="text-xl font-bold text-gray-800">{product.sale_price ? `₹ ${Number(product.sale_price).toLocaleString("en-IN")}` : "—"}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-800 mb-3">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          {/* Side Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Product Information</h2>
            <div className="space-y-3">
              <InfoCard label="Product ID" value={product.id} mono accent={C.text} />
              <InfoCard label="Category" value={product.category_name || "—"} />
              <InfoCard label="SKU Type" value={product.sku_type || "—"} mono />
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Status</p>
                <Badge status={product.status} />
              </div>
              {product.height || product.width || product.weight ? (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Dimensions</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    {product.height && <span>H: {product.height}</span>}
                    {product.width  && <span>W: {product.width}</span>}
                    {product.weight && <span>Wt: {product.weight}</span>}
                  </div>
                </div>
              ) : null}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Attributes</p>
                  <div className="space-y-1">
                    {Object.entries(product.attributes).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-medium text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Delete Product?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5">
              <span className="font-medium text-gray-700">"{product.name}"</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition disabled:opacity-50" style={{ background: "#e11d48" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
