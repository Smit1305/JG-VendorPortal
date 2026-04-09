import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
    HiOutlineArrowLeft,
    HiOutlinePhotograph,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineX,
} from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";

const MEDIA_BASE = import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "http://localhost:8000";
const imgUrl = (path) => path ? (path.startsWith("http") ? path : `${MEDIA_BASE}/uploads/${path}`) : null;

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  /* ── Form state ── */
  const [form, setForm] = useState({
    name: "",
    description: "",
    regular_price: "",
    sale_price: "",
    height: "",
    width: "",
    weight: "",
    status: "active",
    category_id: "",
  });

  const [galleryFiles, setGalleryFiles] = useState([]);         // new files to upload
  const [galleryPreviews, setGalleryPreviews] = useState([]);   // previews for new files
  const [existingGallery, setExistingGallery] = useState([]);   // images already on server

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState(null);

  const [attributes, setAttributes] = useState([]);

  /* ── Load product + categories ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, catRes] = await Promise.allSettled([
          vendorApi.getProduct(id),
          vendorApi.getCategories(),
        ]);

        if (productRes.status === "fulfilled") {
          const product = productRes.value?.data || productRes.value;
          setForm({
            name: product.name || "",
            description: product.description || "",
            regular_price: product.regular_price ?? "",
            sale_price: product.sale_price ?? "",
            height: product.height ?? "",
            width: product.width ?? "",
            weight: product.weight ?? "",
            status: product.status || "active",
            category_id: product.category_id ?? "",
          });
          setExistingThumbnail(product.thumbnail_image || null);
          setExistingGallery(product.gallery_images || []);
          const attrs = product.attributes;
          const attrArray = attrs && typeof attrs === 'object' && !Array.isArray(attrs)
            ? Object.entries(attrs).map(([label, value]) => ({ label, value: String(value) }))
            : Array.isArray(attrs) ? attrs.map(a => ({ label: a.label || a.key || '', value: String(a.value || '') })) : [];
          setAttributes(attrArray);
        } else {
          toast.error("Failed to load product");
          navigate("/vendor/products");
          return;
        }

        if (catRes.status === "fulfilled") {
          const data = catRes.value?.data || catRes.value;
          setCategories(data?.items || data?.data || data || []);
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Gallery dropzone ── */
  const onDropGallery = useCallback(
    (accepted) => {
      const newFiles = [...galleryFiles, ...accepted];
      setGalleryFiles(newFiles);
      const newPreviews = accepted.map((f) => URL.createObjectURL(f));
      setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    },
    [galleryFiles]
  );

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDrag } = useDropzone({
    onDrop: onDropGallery,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const removeNewGalleryImage = (index) => {
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (index) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Thumbnail ── */
  const handleThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setExistingThumbnail(null);
  };

  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setExistingThumbnail(null);
  };

  /* ── Attributes ── */
  const addAttribute = () => setAttributes((prev) => [...prev, { label: "", value: "" }]);
  const removeAttribute = (index) => setAttributes((prev) => prev.filter((_, i) => i !== index));
  const updateAttribute = (index, field, value) => {
    setAttributes((prev) => prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSubmitting(true);
    try {
      // Build JSON payload for the PUT endpoint
      const validAttrs = attributes.filter((a) => a.label.trim() && a.value.trim());
      const jsonPayload = {
        name: form.name,
        description: form.description || null,
        status: form.status,
        category_id: form.category_id || null,
        attributes: validAttrs.length > 0
          ? Object.fromEntries(validAttrs.map((a) => [a.label, a.value]))
          : null,
      };
      if (form.regular_price !== "") jsonPayload.regular_price = Number(form.regular_price);
      if (form.sale_price !== "") jsonPayload.sale_price = Number(form.sale_price);
      if (form.height !== "") jsonPayload.height = Number(form.height);
      if (form.width !== "") jsonPayload.width = Number(form.width);
      if (form.weight !== "") jsonPayload.weight = Number(form.weight);

      await vendorApi.updateProduct(id, jsonPayload);

      // If there are new image files, upload them separately
      if (thumbnailFile || galleryFiles.length > 0) {
        const imgFormData = new FormData();
        if (thumbnailFile) imgFormData.append("thumbnail", thumbnailFile);
        galleryFiles.forEach((file) => imgFormData.append("gallery", file));
        await vendorApi.uploadProductImages(id, imgFormData);
      }

      toast.success("Product updated successfully");
      navigate("/vendor/products");
    } catch (err) {
      toast.error(err?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Cleanup previews on unmount ── */
  useEffect(() => {
    return () => {
      galleryPreviews.forEach(URL.revokeObjectURL);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading product...
          </div>
        </div>
      </Layout>
    );
  }

  const getImageUrl = (img) => {
    const path = typeof img === "string" ? img : (img?.url || img?.path || img?.image || "");
    return imgUrl(path) || "";
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/vendor/products")}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
          >
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-1 text-sm text-gray-500">Update the product details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ─── Left column (2/3) ─── */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Info */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter product name"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Enter product description..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product Gallery */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Gallery</h2>

                {/* Existing images */}
                {existingGallery.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Existing Images</p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {existingGallery.map((img, i) => (
                        <div key={img?.id || i} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                          <img src={getImageUrl(img)} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingGalleryImage(i)}
                            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <HiOutlineX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dropzone for new images */}
                <div
                  {...getGalleryRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isGalleryDrag
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getGalleryInputProps()} />
                  <HiOutlinePhotograph className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    Drag & drop images here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG, WEBP</p>
                </div>
                {galleryPreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">New Images</p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {galleryPreviews.map((url, i) => (
                        <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                          <img src={url} alt={`New ${i + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewGalleryImage(i)}
                            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <HiOutlineX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Dimensions */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Pricing & Dimensions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Regular Price ({"\u20B9"})</label>
                    <input
                      type="number"
                      name="regular_price"
                      value={form.regular_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Sale Price ({"\u20B9"})</label>
                    <input
                      type="number"
                      name="sale_price"
                      value={form.sale_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Height</label>
                    <input
                      type="number"
                      name="height"
                      value={form.height}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Height"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Width</label>
                    <input
                      type="number"
                      name="width"
                      value={form.width}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Width"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Weight</label>
                    <input
                      type="number"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Weight"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product Attributes */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Product Attributes</h2>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    Add Row
                  </button>
                </div>
                {attributes.length === 0 ? (
                  <p className="text-sm text-gray-500">No attributes. Click "Add Row" to add product attributes.</p>
                ) : (
                  <div className="space-y-3">
                    {attributes.map((attr, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Label (e.g. Color)"
                          value={attr.label}
                          onChange={(e) => updateAttribute(i, "label", e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. Red)"
                          value={attr.value}
                          onChange={(e) => updateAttribute(i, "value", e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(i)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Right column (1/3) ─── */}
            <div className="space-y-6">
              {/* Product Thumbnail */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Thumbnail</h2>
                {thumbnailPreview || existingThumbnail ? (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={thumbnailPreview || imgUrl(existingThumbnail)}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <HiOutlineX className="h-4 w-4" />
                    </button>
                    <label className="absolute bottom-2 left-2 cursor-pointer rounded-lg bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 opacity-0 backdrop-blur transition-opacity hover:bg-white group-hover:opacity-100">
                      Change
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                    </label>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400">
                    <HiOutlinePhotograph className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm font-medium text-gray-700">Upload Thumbnail</span>
                    <span className="mt-1 text-xs text-gray-500">Click to browse</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                  </label>
                )}
              </div>

              {/* Product Status */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Status</h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${
                      form.status === "active" ? "bg-green-500" : form.status === "draft" ? "bg-yellow-500" : "bg-gray-400"
                    }`}
                  />
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Product Category */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Category</h2>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate("/vendor/products")}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
