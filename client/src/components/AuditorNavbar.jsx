import { NavLink } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  FileText,
  CreditCard,
  Receipt,
  Users,
  LogOut,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

function AuditorNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="auditor-header">
      <div className="auditor-header-inner">
        <div className="auditor-brand">
          <div className="brand-logo">
            <Wallet size={24} />
            <span>LedgerLine</span>
          </div>
          <span className="auditor-badge">
            <ShieldCheck size={13} />
            AUDITOR
          </span>
          <span className="auditor-mode-tag">
            <Eye size={12} />
            Read-Only
          </span>
        </div>

        <nav className="auditor-nav" aria-label="Auditor Navigation">
          <NavLink
            to="/auditor"
            end
            className={({ isActive }) =>
              isActive ? "auditor-nav-link active" : "auditor-nav-link"
            }
          >
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/auditor/audit-logs"
            className={({ isActive }) =>
              isActive ? "auditor-nav-link active" : "auditor-nav-link"
            }
          >
            <FileText size={16} />
            <span>Audit Trail</span>
          </NavLink>

          <NavLink
            to="/auditor/accounts"
            className={({ isActive }) =>
              isActive ? "auditor-nav-link active" : "auditor-nav-link"
            }
          >
            <CreditCard size={16} />
            <span>Bank Accounts</span>
          </NavLink>

          <NavLink
            to="/auditor/transactions"
            className={({ isActive }) =>
              isActive ? "auditor-nav-link active" : "auditor-nav-link"
            }
          >
            <Receipt size={16} />
            <span>Transactions</span>
          </NavLink>

          <NavLink
            to="/auditor/users"
            className={({ isActive }) =>
              isActive ? "auditor-nav-link active" : "auditor-nav-link"
            }
          >
            <Users size={16} />
            <span>Users</span>
          </NavLink>
        </nav>

        <div className="auditor-user-section">
          <div className="auditor-user-info">
            <strong>{user?.name || "Auditor"}</strong>
            <span>{user?.email}</span>
          </div>

          <button
            type="button"
            className="auditor-logout-btn"
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

export default AuditorNavbar;
