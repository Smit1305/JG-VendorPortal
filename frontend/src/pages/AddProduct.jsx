import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Layout from "../components/Layout";
import { vendorApi } from "../services/api";
import toast from "react-hot-toast";
import {
  HiOutlinePhotograph,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowLeft,
} from "react-icons/hi";

export default function AddProduct() {
  const navigate = useNavigate();
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

  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [attributes, setAttributes] = useState([{ label: "", value: "" }]);

  /* ── Load categories ── */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await vendorApi.getCategories();
        const data = res?.data || res;
        setCategories(data?.items || data?.data || data || []);
      } catch {
        /* categories may not be available, allow manual entry */
      }
    };
    fetchCategories();
  }, []);

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ── Gallery dropzone ── */
  const onDropGallery = useCallback((accepted) => {
    const newFiles = [...galleryFiles, ...accepted];
    setGalleryFiles(newFiles);
    const newPreviews = accepted.map((f) => URL.createObjectURL(f));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  }, [galleryFiles]);

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDrag } = useDropzone({
    onDrop: onDropGallery,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const removeGalleryImage = (index) => {
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Thumbnail ── */
  const handleThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
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
      // Step 1: create product with JSON body
      const validAttrs = attributes.filter((a) => a.label.trim() && a.value.trim());
      const payload = {
        name: form.name,
        description: form.description || null,
        regular_price: form.regular_price ? parseFloat(form.regular_price) : null,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        height: form.height ? parseFloat(form.height) : null,
        width: form.width ? parseFloat(form.width) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        status: form.status,
        category_id: form.category_id || null,
        attributes: validAttrs.length > 0
          ? Object.fromEntries(validAttrs.map((a) => [a.label, a.value]))
          : null,
      };

      const res = await vendorApi.createProduct(payload);
      const productId = res?.data?.data?.id || res?.data?.id;

      // Step 2: upload images if any
      if (productId && (thumbnailFile || galleryFiles.length > 0)) {
        const fd = new FormData();
        if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
        galleryFiles.forEach((file) => fd.append("gallery", file));
        await vendorApi.uploadProductImages(productId, fd);
      }

      toast.success("Product created successfully");
      navigate("/vendor/products");
    } catch (err) {
      toast.error(err?.message || "Failed to create product");
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
            <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
            <p className="mt-1 text-sm text-gray-500">Fill in the details to create a new product</p>
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
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {galleryPreviews.map((url, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                        <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(i)}
                          className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <HiOutlineX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
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
                  <p className="text-sm text-gray-500">No attributes added yet.</p>
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
                {thumbnailPreview ? (
                  <div className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                    <img src={thumbnailPreview} alt="Thumbnail" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <HiOutlineX className="h-4 w-4" />
                    </button>
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
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
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
              {submitting ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
