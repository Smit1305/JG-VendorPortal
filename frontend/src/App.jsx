import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { authApi } from "./services/api.js";

// Auth
import Checklist from "./pages/Checklist.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// Vendor - Registration & Core
import AddProduct from "./pages/AddProduct.jsx";
import DocumentUpload from "./pages/DocumentUpload.jsx";
import EditProduct from "./pages/EditProduct.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import ProductManagement from "./pages/ProductManagement.jsx";
import ServiceProvider from "./pages/ServiceProvider.jsx";
import VendorDashboard from "./pages/VendorDashboard.jsx";
import VendorProfile from "./pages/VendorProfile.jsx";

// Vendor - Extended Pages
import AssistanceService from "./pages/vendor/AssistanceService.jsx";
import CatalogueDetail from "./pages/vendor/CatalogueDetail.jsx";
import LogisticsDetail from "./pages/vendor/LogisticsDetail.jsx";
import LoyaltyRewards from "./pages/vendor/LoyaltyRewards.jsx";
import ManageCommercials from "./pages/vendor/ManageCommercials.jsx";
import ManageLoans from "./pages/vendor/ManageLoans.jsx";
import ManageLogistics from "./pages/vendor/ManageLogistics.jsx";
import ManagePayments from "./pages/vendor/ManagePayments.jsx";
import ManageRFQs from "./pages/vendor/ManageRFQs.jsx";
import ManageReturns from "./pages/vendor/ManageReturns.jsx";
import OrderDetail from "./pages/vendor/OrderDetail.jsx";
import RFQDetail from "./pages/vendor/RFQDetail.jsx";
import ReturnDetail from "./pages/vendor/ReturnDetail.jsx";
import SellerDashboard from "./pages/vendor/SellerDashboard.jsx";
import SupportRequests from "./pages/vendor/SupportRequests.jsx";

// Admin
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminLoans from "./pages/admin/AdminLoans.jsx";
import AdminTickets from "./pages/admin/AdminTickets.jsx";
import AdminProfile from "./pages/admin/AdminProfile.jsx";
import AllUsers from "./pages/admin/AllUsers.jsx";
import AllVendors from "./pages/admin/AllVendors.jsx";
import Categories from "./pages/admin/Categories.jsx";
import CompanyProfile from "./pages/admin/CompanyProfile.jsx";
import DocumentTypes from "./pages/admin/DocumentTypes.jsx";
import PendingVendors from "./pages/admin/PendingVendors.jsx";
import VendorDetail from "./pages/admin/VendorDetail.jsx";

function FallbackRedirect() {
  const role = authApi.getRole();
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "vendor") return <Navigate to="/vendor/main" replace />;
  return <Navigate to="/login" replace />;
}

function RequireAuth({ role, children }) {
  const token = authApi.getToken();
  if (!token) return <Navigate to="/login" replace />;
  if (role && authApi.getRole() !== role) {
    const userRole = authApi.getRole();
    return <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/vendor/main"} replace />;
  }
  return children;
}

function V({ children }) { return <RequireAuth role="vendor">{children}</RequireAuth>; }
function A({ children }) { return <RequireAuth role="admin">{children}</RequireAuth>; }

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Vendor - Checklist (requires auth but no role restriction) */}
        <Route path="/vendor/checklist" element={<RequireAuth><Checklist /></RequireAuth>} />

        {/* Vendor - Core */}
        <Route path="/vendor/main" element={<V><SellerDashboard /></V>} />
        <Route path="/vendor/dashboard" element={<V><VendorDashboard /></V>} />
        <Route path="/vendor/profile" element={<V><VendorProfile /></V>} />
        <Route path="/vendor/documents" element={<V><DocumentUpload /></V>} />
        <Route path="/vendor/products" element={<V><ProductManagement /></V>} />
        <Route path="/vendor/products/:id" element={<V><CatalogueDetail /></V>} />
        <Route path="/vendor/add-product" element={<V><AddProduct /></V>} />
        <Route path="/vendor/edit-product/:id" element={<V><EditProduct /></V>} />
        <Route path="/vendor/service-provider" element={<V><ServiceProvider /></V>} />
        <Route path="/vendor/orders" element={<V><MyOrders /></V>} />
        <Route path="/vendor/orders/:id" element={<V><OrderDetail /></V>} />

        {/* Vendor - Extended */}
        <Route path="/vendor/rfqs" element={<V><ManageRFQs /></V>} />
        <Route path="/vendor/rfqs/:id" element={<V><RFQDetail /></V>} />
        <Route path="/vendor/logistics" element={<V><ManageLogistics /></V>} />
        <Route path="/vendor/logistics/:id" element={<V><LogisticsDetail /></V>} />
        <Route path="/vendor/returns" element={<V><ManageReturns /></V>} />
        <Route path="/vendor/returns/:id" element={<V><ReturnDetail /></V>} />
        <Route path="/vendor/payments" element={<V><ManagePayments /></V>} />
        <Route path="/vendor/loans" element={<V><ManageLoans /></V>} />
        <Route path="/vendor/commercials" element={<V><ManageCommercials /></V>} />
        <Route path="/vendor/assistance" element={<V><AssistanceService /></V>} />
        <Route path="/vendor/support" element={<V><SupportRequests /></V>} />
        <Route path="/vendor/rewards" element={<V><LoyaltyRewards /></V>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<A><AdminDashboard /></A>} />
        <Route path="/admin/vendors" element={<A><AllVendors /></A>} />
        <Route path="/admin/users" element={<A><AllUsers /></A>} />
        <Route path="/admin/pending-vendors" element={<A><PendingVendors /></A>} />
        <Route path="/admin/categories" element={<A><Categories /></A>} />
        <Route path="/admin/document-types" element={<A><DocumentTypes /></A>} />
        <Route path="/admin/company" element={<A><CompanyProfile /></A>} />
        <Route path="/admin/vendors/:id" element={<A><VendorDetail /></A>} />
        <Route path="/admin/profile" element={<A><AdminProfile /></A>} />
        <Route path="/admin/loans" element={<A><AdminLoans /></A>} />
        <Route path="/admin/tickets" element={<A><AdminTickets /></A>} />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<FallbackRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
