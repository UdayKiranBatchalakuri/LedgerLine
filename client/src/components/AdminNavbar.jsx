import { NavLink } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

function AdminNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <div className="admin-brand">
          <div className="brand-logo">
            <Wallet size={24} />
            <span>LedgerLine</span>
          </div>
          <span className="admin-badge">
            <Shield size={13} />
            ADMIN
          </span>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <Users size={17} />
            <span>User Management</span>
          </NavLink>

          <NavLink
            to="/admin/accounts"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <CreditCard size={17} />
            <span>Account Management</span>
          </NavLink>

          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <FileText size={17} />
            <span>Audit Logs</span>
          </NavLink>
        </nav>

        <div className="admin-user-section">
          <div className="admin-user-info">
            <strong>{user?.name || "Administrator"}</strong>
            <span>{user?.email}</span>
          </div>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
