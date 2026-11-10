import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/useAuth.js";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Deposit from "./pages/Deposit";
import Withdrawal from "./pages/Withdrawal";
import Transfer from "./pages/Transfer";

// Admin Module Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

// Auditor Module Pages
import AuditorDashboard from "./pages/auditor/AuditorDashboard";
import AuditorAuditLogs from "./pages/auditor/AuditorAuditLogs";
import AuditorAccounts from "./pages/auditor/AuditorAccounts";
import AuditorTransactions from "./pages/auditor/AuditorTransactions";
import AuditorUsers from "./pages/auditor/AuditorUsers";

function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <main className="auth-page">
      <section className="auth-form-panel" style={{ width: "100%", maxWidth: "600px", margin: "auto" }}>
        <div className="auth-form-container" style={{ textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p style={{ marginTop: "12px", lineHeight: "1.6" }}>
            You are signed in as <strong>{user?.name || "User"}</strong> with role{" "}
            <span className="pill-tag warning" style={{ display: "inline-flex", verticalAlign: "middle" }}>
              {user?.role || "UNKNOWN"}
            </span>.
            <br />
            You do not have permission to access this protected resource.
          </p>

          <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
            <a href="/" className="btn btn-secondary">
              Return to Your Dashboard
            </a>
            <button type="button" className="btn btn-primary" onClick={logout}>
              Sign out & Switch Account
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function RoleBasedHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "AUDITOR") {
    return <Navigate to="/auditor" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function DashboardRouteWrapper() {
  const { user } = useAuth();

  // If an administrator accesses /dashboard, redirect them to the Admin Portal
  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // If an auditor accesses /dashboard, redirect them to the Auditor Portal
  if (user?.role === "AUDITOR") {
    return <Navigate to="/auditor" replace />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RoleBasedHomeRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ADMIN ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* AUDITOR ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["AUDITOR"]} />}>
            <Route path="/auditor" element={<AuditorDashboard />} />
            <Route path="/auditor/audit-logs" element={<AuditorAuditLogs />} />
            <Route path="/auditor/accounts" element={<AuditorAccounts />} />
            <Route path="/auditor/transactions" element={<AuditorTransactions />} />
            <Route path="/auditor/users" element={<AuditorUsers />} />
          </Route>

          {/* ACCOUNT HOLDER FINANCIAL WRITE OPERATIONS */}
          <Route element={<ProtectedRoute allowedRoles={["ACCOUNT_HOLDER"]} />}>
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdrawal" element={<Withdrawal />} />
            <Route path="/transfer" element={<Transfer />} />
          </Route>

          {/* ACCOUNT HOLDER DASHBOARD & OWN TRANSACTIONS */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRouteWrapper />} />
            <Route path="/transactions" element={<Transactions />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
