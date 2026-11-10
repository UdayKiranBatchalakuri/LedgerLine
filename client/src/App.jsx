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
import Accounts from "./pages/Accounts";
import Statements from "./pages/Statements";
import AccountRequest from "./pages/AccountRequest";
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

  // Navigate all authenticated users to the modern Overview dashboard
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RoleBasedHomeRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Navigate to="/dashboard" replace />} />

          {/* ADMIN ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/overview" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* AUDITOR ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["AUDITOR"]} />}>
            <Route path="/auditor" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auditor/overview" element={<AuditorDashboard />} />
            <Route path="/auditor/audit-logs" element={<AuditorAuditLogs />} />
            <Route path="/auditor/accounts" element={<AuditorAccounts />} />
            <Route path="/auditor/transactions" element={<AuditorTransactions />} />
            <Route path="/auditor/users" element={<AuditorUsers />} />
          </Route>

          {/* FINANCIAL WRITE OPERATIONS */}
          <Route element={<ProtectedRoute />}>
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdrawal" element={<Withdrawal />} />
            <Route path="/transfer" element={<Transfer />} />
          </Route>

          {/* CORE PORTAL VIEWS */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/account-request" element={<AccountRequest />} />
            <Route path="/transactions" element={<Statements />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
