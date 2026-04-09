import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const api = axios.create({ baseURL: API_BASE });

const TOKEN_KEY = "vp_access_token";
const REFRESH_KEY = "vp_refresh_token";
const ROLE_KEY = "vp_role";

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r.data,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (refresh) {
          // Use raw axios (not the intercepted `api`) to avoid infinite loop
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refresh });
          // Response shape: { success, data: { access_token, refresh_token, role } }
          const tokens = res.data?.data || res.data;
          const newAccess = tokens.access_token;
          const newRefresh = tokens.refresh_token;
          if (!newAccess) throw new Error("No access token in refresh response");
          localStorage.setItem(TOKEN_KEY, newAccess);
          if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
          orig.headers.Authorization = `Bearer ${newAccess}`;
          return api(orig);
        }
      } catch {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject({ message: "Session expired. Please log in again." });
      }
    }

    // Extract meaningful error message from FastAPI responses
    const responseData = err.response?.data;
    if (responseData) {
      // FastAPI 422 validation error format: { detail: [{ msg, loc, type }] }
      if (Array.isArray(responseData.detail)) {
        const firstError = responseData.detail[0];
        const field = firstError.loc?.slice(1).join(".") || "";
        const msg = firstError.msg?.replace("Value error, ", "") || "Validation error";
        return Promise.reject({ message: field ? `${field}: ${msg}` : msg, detail: responseData.detail });
      }
      // FastAPI string detail
      if (typeof responseData.detail === "string") {
        return Promise.reject({ message: responseData.detail });
      }
      // Our custom error format: { success: false, message: "..." }
      if (responseData.message) {
        return Promise.reject({ message: responseData.message });
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

/* ─── Auth ─── */
export const authApi = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
  logout: () => {
    const t = localStorage.getItem(TOKEN_KEY);
    const r = localStorage.getItem(REFRESH_KEY);
    return api.post("/auth/logout", { access_token: t, refresh_token: r }).finally(() => {
      localStorage.clear();
    });
  },
  setSession: (data) => {
    // Handle both { data: { access_token, ... } } and flat { access_token, ... }
    const session = data?.data || data;
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(REFRESH_KEY, session.refresh_token);
    localStorage.setItem(ROLE_KEY, session.role);
    // Store user info for navbar display
    const u = session.user;
    if (u) {
      localStorage.setItem("vp_user_name", u.name || "");
      localStorage.setItem("vp_user_email", u.email || "");
      localStorage.setItem("vp_user_photo", u.profile_photo || "");
      localStorage.setItem("vp_company_status", u.company_status || "");
      localStorage.setItem("vp_verification_status", u.verification_status || "");
      localStorage.setItem("vp_doc_verify_status", u.document_verify_status || "");
    }
    window.dispatchEvent(new Event("storage"));
  },
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRole: () => localStorage.getItem(ROLE_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

/* ─── Admin ─── */
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  // Admin profile
  getProfile: () => api.get("/admin/profile"),
  updateProfile: (payload) => api.put("/admin/profile", payload),
  changePassword: (payload) => api.put("/admin/profile/password", payload),
  uploadProfilePhoto: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/admin/profile/photo", fd); },
  // Users
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUserStatus: (id, payload) => api.patch(`/admin/users/${id}/status`, payload),
  // Vendors
  getVendors: (params) => api.get("/admin/vendors", { params }),
  getVendorDetail: (id) => api.get(`/admin/vendors/${id}`),
  updateVendorStatus: (id, payload) => api.patch(`/admin/vendors/${id}/status`, payload),
  getCategories: (params) => api.get("/admin/categories", { params }),
  getCategoryTree: () => api.get("/admin/categories/tree"),
  createCategory: (payload) => api.post("/admin/categories", payload),
  updateCategory: (id, payload) => api.put(`/admin/categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getDocumentTypes: () => api.get("/admin/document-types"),
  createDocumentType: (payload) => api.post("/admin/document-types", payload),
  updateDocumentType: (id, payload) => api.put(`/admin/document-types/${id}`, payload),
  deleteDocumentType: (id) => api.delete(`/admin/document-types/${id}`),
  getCompanyProfile: () => api.get("/admin/company"),
  updateCompanyProfile: (payload) => api.put("/admin/company", payload),
  uploadCompanyLogo: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/admin/company/logo", fd); },
  uploadCompanyRegistrationImage: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/admin/company/registration-image", fd); },
  uploadCompanyPanImage: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/admin/company/pan-image", fd); },
  updateUserStatusById: (id, payload) => api.patch(`/admin/users/${id}/status`, payload),
  uploadVendorDocument: (vendorId, docType, file, docNumber) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    if (docNumber) fd.append("doc_number", docNumber);
    return api.post(`/admin/vendors/${vendorId}/documents/upload`, fd);
  },
  deleteVendorDocument: (vendorId, docType) => api.delete(`/admin/vendors/${vendorId}/documents/${docType}`),
  deleteVendorDocumentEntry: (vendorId, docType, fileIndex) => api.delete(`/admin/vendors/${vendorId}/documents/${docType}/${fileIndex}`),
  // Admin notifications
  getNotifications: () => api.get("/admin/notifications"),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("/admin/notifications/read-all"),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),
};

/* ─── Vendor ─── */
export const vendorApi = {
  getDashboard: () => api.get("/vendor/dashboard"),
  getProfile: () => api.get("/vendor/profile"),
  updateProfile: (payload) => api.put("/vendor/profile", payload),
  changePassword: (payload) => api.put("/vendor/profile/password", payload),
  uploadProfilePhoto: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/vendor/profile/photo", fd); },
  completeOnboarding: (payload) => api.put("/vendor/profile/onboarding", payload),
  getDocumentTypes: () => api.get("/vendor/document-types"),
  getCategoryTree: () => api.get("/vendor/categories/tree"),
  getCategories: () => api.get("/vendor/categories"),
  getDocuments: () => api.get("/vendor/documents"),
  viewDocument: (docType, index = null) =>
    index !== null
      ? api.get(`/vendor/documents/view/${docType}/${index}`)
      : api.get(`/vendor/documents/view/${docType}`),
  uploadDocuments: (payload) => api.post("/vendor/documents", payload),
  uploadDocumentFile: (docType, file, docNumber) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    if (docNumber) fd.append("doc_number", docNumber);
    return api.post("/vendor/documents/upload", fd);
  },
  deleteDocument: (docType) => api.delete(`/vendor/documents/${docType}`),
  deleteDocumentEntry: (docType, fileIndex) => api.delete(`/vendor/documents/${docType}/${fileIndex}`),
  updateBusinessDetails: (payload) => api.put("/vendor/documents/business", payload),
  uploadBusinessFile: (field, file) => { const fd = new FormData(); fd.append("file", file); fd.append("field", field); return api.post("/vendor/documents/business/upload", fd); },
  getProducts: (params) => api.get("/vendor/products", { params }),
  getProduct: (id) => api.get(`/vendor/products/${id}`),
  createProduct: (fd) => api.post("/vendor/products", fd),
  updateProduct: (id, fd) => api.put(`/vendor/products/${id}`, fd),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),
  uploadProductImage: (id, file, type) => { const fd = new FormData(); fd.append("file", file); fd.append("type", type); return api.post(`/vendor/products/${id}/images`, fd); },
  uploadProductImages: (id, fd) => api.post(`/vendor/products/${id}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } }),
  importProducts: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/vendor/products/import", fd); },
  getServiceProvider: () => api.get("/vendor/service-provider"),
  createServiceProvider: (payload) => api.post("/vendor/service-provider", payload),
  updateServiceProvider: (payload) => api.put("/vendor/service-provider", payload),
  getSPDocuments: () => api.get("/vendor/service-provider/documents"),
  uploadSPDocument: (fd) => api.post("/vendor/service-provider/documents", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteSPDocument: (docType) => api.delete(`/vendor/service-provider/documents/${docType}`),
  // Orders
  getOrders: (params) => api.get("/vendor/orders", { params }),
  getOrder: (id) => api.get(`/vendor/orders/${id}`),
  createOrder: (payload) => api.post("/vendor/orders", payload),
  updateOrder: (id, payload) => api.put(`/vendor/orders/${id}`, payload),
  deleteOrder: (id) => api.delete(`/vendor/orders/${id}`),
  // RFQs
  getRFQs: (params) => api.get("/vendor/rfqs", { params }),
  getRFQ: (id) => api.get(`/vendor/rfqs/${id}`),
  createRFQ: (payload) => api.post("/vendor/rfqs", payload),
  deleteRFQ: (id) => api.delete(`/vendor/rfqs/${id}`),
  submitQuote: (rfqId, payload) => api.post(`/vendor/rfqs/${rfqId}/quote`, payload),
  // Logistics
  getLogistics: () => api.get("/vendor/logistics"),
  getShipment: (id) => api.get(`/vendor/logistics/${id}`),
  createShipment: (payload) => api.post("/vendor/logistics", payload),
  updateShipment: (id, payload) => api.put(`/vendor/logistics/${id}`, payload),
  // Returns
  getReturns: () => api.get("/vendor/returns"),
  getReturn: (id) => api.get(`/vendor/returns/${id}`),
  createReturn: (payload) => api.post("/vendor/returns", payload),
  // Payments
  getPayments: (params) => api.get("/vendor/payments", { params }),
  getPayment: (id) => api.get(`/vendor/payments/${id}`),
  createPayment: (payload) => api.post("/vendor/payments", payload),
  updatePayment: (id, payload) => api.put(`/vendor/payments/${id}`, payload),
  // Loans
  getLoans: () => api.get("/vendor/loans"),
  applyLoan: (payload) => api.post("/vendor/loans", payload),
  // Commercials
  getCommercials: () => api.get("/vendor/commercials"),
  updateBankDetails: (payload) => api.put("/vendor/commercials/bank", payload),
  // Support
  getSupportTickets: (params) => api.get("/vendor/support", { params }),
  createSupportTicket: (payload) => api.post("/vendor/support", payload),
  replyToTicket: (ticketId, payload) => api.post(`/vendor/support/${ticketId}/reply`, payload),
  // Notifications
  getNotifications: () => api.get("/vendor/notifications"),
  markNotificationRead: (id) => api.patch(`/vendor/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch("/vendor/notifications/read-all"),
  deleteNotification: (id) => api.delete(`/vendor/notifications/${id}`),
  // Rewards
  getRewards: () => api.get("/vendor/rewards"),
  redeemReward: (rewardId) => api.post(`/vendor/rewards/redeem/${rewardId}`),
  // Assistance
  requestAssistance: (payload) => api.post("/vendor/assistance", payload),
  // Chatbot
  chat: (payload) => api.post("/vendor/chatbot/chat", payload),
};

/* ─── Public ─── */
export const publicApi = {
  getCategories: (parent) => api.get(`/categories/${parent}`),
  getSubCategories: (parent) => api.get(`/subcategories/${parent}`),
};

export default api;
