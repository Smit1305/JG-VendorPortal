import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    HiChevronDown,
    HiChevronRight,
    HiFolder,
    HiFolderOpen,
    HiPencil,
    HiPlus,
    HiTrash,
    HiX,
} from "react-icons/hi";
import Layout from "../../components/Layout.jsx";
import { adminApi } from "../../services/api.js";

const selCls = "w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 py-2 pr-9 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer";

function StyledSelect({ value, onChange, children, required }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={selCls} required={required}>{children}</select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

const LEVEL_LABELS = {
  0: "Master Category",
  1: "Category",
  2: "Subcategory",
  3: "Product Name",
};

const LEVEL_COLORS = {
  0: "bg-purple-100 text-purple-800",
  1: "bg-blue-100 text-blue-800",
  2: "bg-green-100 text-green-800",
  3: "bg-orange-100 text-orange-800",
};

const emptyForm = { name: "", label: 0, parent_id: "", is_active: true };

export default function Categories() {
  const [tree, setTree] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState({ open: false, mode: "add", data: null });
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [saving, setSaving] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategoryTree();
      const data = res?.data || res || [];
      const arr = Array.isArray(data) ? data : [];
      setTree(arr);
      setFlatList(flattenTree(arr));
    } catch (err) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const flattenTree = (nodes, depth = 0, result = []) => {
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, depth + 1, result);
      }
    }
    return result;
  };

  const getParentOptions = (label) => {
    if (label === 0) return [];
    return flatList.filter((c) => c.label === label - 1);
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = (parentLabel = activeTab) => {
    setForm({ ...emptyForm, label: parentLabel });
    setModal({ open: true, mode: "add", data: null });
  };

  const openEditModal = (item) => {
    setForm({ name: item.name, label: item.label, parent_id: item.parent_id || "", is_active: item.is_active !== false });
    setModal({ open: true, mode: "edit", data: item });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        label: Number(form.label),
        parent_id: form.parent_id || null,
        is_active: form.is_active,
      };
      if (modal.mode === "add") {
        await adminApi.createCategory(payload);
        toast.success("Category created successfully");
      } else {
        await adminApi.updateCategory(modal.data.id, payload);
        toast.success("Category updated successfully");
      }
      setModal({ open: false, mode: "add", data: null });
      fetchTree();
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await adminApi.deleteCategory(deleteConfirm.item.id);
      toast.success("Category deleted");
      setDeleteConfirm({ open: false, item: null });
      fetchTree();
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  const renderTreeNode = (node) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg group">
          <button
            onClick={() => hasChildren && toggleExpand(node.id)}
            className={`p-0.5 ${hasChildren ? "text-gray-500 hover:text-gray-700" : "text-transparent"}`}
            disabled={!hasChildren}
          >
            {isExpanded ? <HiChevronDown className="h-4 w-4" /> : <HiChevronRight className="h-4 w-4" />}
          </button>
          {isExpanded ? (
            <HiFolderOpen className="h-4 w-4 text-yellow-500" />
          ) : (
            <HiFolder className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm text-gray-800 flex-1">{node.name}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${LEVEL_COLORS[node.label] || "bg-gray-100 text-gray-600"}`}>
            {LEVEL_LABELS[node.label] || `Level ${node.label}`}
          </span>
          <div className="hidden group-hover:flex items-center gap-1">
            {node.label < 3 && (
              <button
                onClick={() => {
                  setForm({ ...emptyForm, label: node.label + 1, parent_id: node.id });
                  setModal({ open: true, mode: "add", data: null });
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title={`Add ${LEVEL_LABELS[node.label + 1]}`}
              >
                <HiPlus className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => openEditModal(node)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
              <HiPencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeleteConfirm({ open: true, item: node })}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <HiTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-6 border-l border-gray-200 pl-2">{node.children.map(renderTreeNode)}</div>
        )}
      </div>
    );
  };

  const filteredByTab = flatList.filter((c) => c.label === activeTab);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
          <button
            onClick={() => openAddModal(activeTab)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <HiPlus className="h-4 w-4" /> Add {LEVEL_LABELS[activeTab]}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-6">
            {Object.entries(LEVEL_LABELS).map(([level, label]) => (
              <button
                key={level}
                onClick={() => setActiveTab(Number(level))}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === Number(level)
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setActiveTab(-1)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === -1
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tree View
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : activeTab === -1 ? (
          /* Tree View */
          <div className="bg-white rounded-lg shadow p-4">
            {tree.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No categories found</p>
            ) : (
              tree.map(renderTreeNode)
            )}
          </div>
        ) : (
          /* Tab Table View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Master Category table — no parent column, shows child count */}
            {activeTab === 0 ? (
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categories</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredByTab.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No Master Categories found. Click "Add Master Category" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredByTab.map((cat, idx) => {
                      const directChildren = flatList.filter((c) => c.parent_id === cat.id);
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <HiFolder className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {directChildren.length} {directChildren.length === 1 ? "category" : "categories"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              cat.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {cat.is_active !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setForm({ ...emptyForm, label: 1, parent_id: cat.id });
                                  setModal({ open: true, mode: "add", data: null });
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Add Category under this"
                              >
                                <HiPlus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(cat)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <HiPencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ open: true, item: cat })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* Other levels table — shows parent column */
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Children</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredByTab.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No {LEVEL_LABELS[activeTab]} entries found
                      </td>
                    </tr>
                  ) : (
                    filteredByTab.map((cat, idx) => {
                      const parent = flatList.find((c) => c.id === cat.parent_id);
                      const directChildren = flatList.filter((c) => c.parent_id === cat.id);
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{cat.name}</td>
                          <td className="px-6 py-4">
                            {parent ? (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                <HiFolder className="h-3.5 w-3.5 text-gray-400" />
                                {parent.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {directChildren.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {directChildren.length}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              cat.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {cat.is_active !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              {cat.label < 3 && (
                                <button
                                  onClick={() => {
                                    setForm({ ...emptyForm, label: cat.label + 1, parent_id: cat.id });
                                    setModal({ open: true, mode: "add", data: null });
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title={`Add ${LEVEL_LABELS[cat.label + 1]}`}
                                >
                                  <HiPlus className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(cat)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <HiPencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ open: true, item: cat })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <HiTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {modal.mode === "add" ? `Add ${LEVEL_LABELS[form.label]}` : `Edit ${LEVEL_LABELS[form.label]}`}
              </h3>
              <button
                onClick={() => setModal({ open: false, mode: "add", data: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <StyledSelect value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: Number(e.target.value), parent_id: "" }))}>
                  {Object.entries(LEVEL_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </StyledSelect>
              </div>
              {form.label > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                  <StyledSelect value={form.parent_id} onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))} required>
                    <option value="">Select parent...</option>
                    {getParentOptions(form.label).map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </StyledSelect>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: "add", data: null })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : modal.mode === "add" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Delete Category</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <span className="font-semibold">{deleteConfirm.item?.name}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, item: null })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
