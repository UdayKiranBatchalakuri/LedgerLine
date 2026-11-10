import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  CreditCard,
  FileText,
  PlusCircle,
  ShieldCheck,
  Check,
  ChevronDown,
  LogOut,
  Users,
  ShieldAlert,
  ArrowRightLeft,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function VaultLayout({ children, breadcrumb = [] }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentPath = location.pathname;

  let crumbs = breadcrumb;
  if (!crumbs || crumbs.length === 0) {
    if (currentPath === "/dashboard" || currentPath === "/") {
      crumbs = [{ label: "Workspace", href: "/dashboard" }, { label: "Overview" }];
    } else if (currentPath === "/accounts") {
      crumbs = [{ label: "Workspace", href: "/dashboard" }, { label: "Accounts" }];
    } else if (currentPath === "/statements" || currentPath === "/transactions") {
      crumbs = [{ label: "Workspace", href: "/dashboard" }, { label: "Statements" }];
    } else if (currentPath === "/account-request") {
      crumbs = [{ label: "Workspace", href: "/dashboard" }, { label: "Account request" }];
    } else {
      crumbs = [{ label: "Workspace", href: "/dashboard" }, { label: "Overview" }];
    }
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "AUDITOR"
      ? "Auditor"
      : "Account holder";

  return (
    <div className="vault-shell">
      {/* --------------------------------------------------------------------
          LEFT SIDEBAR (Dark Forest Green)
          -------------------------------------------------------------------- */}
      <aside className="vault-sidebar">
        <div className="vault-sidebar-header">
          <div className="vault-brand-emblem">L</div>
          <div>
            <span className="vault-brand-title">LedgerLine</span>
          </div>
        </div>

        <div className="vault-sidebar-section-title">WORKSPACE</div>

        <nav className="vault-sidebar-nav">
          <Link
            to="/dashboard"
            className={`vault-sidebar-link ${currentPath === "/dashboard" || currentPath === "/" ? "active" : ""}`}
          >
            <LayoutGrid />
            <span>Overview</span>
          </Link>

          <Link
            to="/accounts"
            className={`vault-sidebar-link ${currentPath === "/accounts" ? "active" : ""}`}
          >
            <CreditCard />
            <span>Accounts</span>
          </Link>

          <Link
            to="/statements"
            className={`vault-sidebar-link ${currentPath === "/statements" || currentPath === "/transactions" ? "active" : ""}`}
          >
            <FileText />
            <span>Statements</span>
          </Link>

          <Link
            to="/account-request"
            className={`vault-sidebar-link ${currentPath === "/account-request" ? "active" : ""}`}
          >
            <PlusCircle />
            <span>Account request</span>
          </Link>

          {/* Admin links if Admin */}
          {user?.role === "ADMIN" && (
            <>
              <div className="vault-sidebar-section-title" style={{ marginTop: "14px" }}>
                ADMIN CONTROL
              </div>
              <Link
                to="/admin"
                className="vault-sidebar-link"
              >
                <LayoutGrid />
                <span>Admin Portal</span>
              </Link>
              <Link
                to="/admin/users"
                className="vault-sidebar-link"
              >
                <Users />
                <span>User Directory</span>
              </Link>
              <Link
                to="/admin/accounts"
                className="vault-sidebar-link"
              >
                <CreditCard />
                <span>All Accounts</span>
              </Link>
              <Link
                to="/admin/audit-logs"
                className="vault-sidebar-link"
              >
                <ShieldAlert />
                <span>Audit Trail</span>
              </Link>
            </>
          )}

          {/* Auditor links if Auditor */}
          {user?.role === "AUDITOR" && (
            <>
              <div className="vault-sidebar-section-title" style={{ marginTop: "14px" }}>
                COMPLIANCE
              </div>
              <Link
                to="/auditor"
                className="vault-sidebar-link"
              >
                <LayoutGrid />
                <span>Compliance Hub</span>
              </Link>
              <Link
                to="/auditor/transactions"
                className="vault-sidebar-link"
              >
                <ArrowRightLeft />
                <span>System Ledger</span>
              </Link>
              <Link
                to="/auditor/audit-logs"
                className="vault-sidebar-link"
              >
                <ShieldAlert />
                <span>Audit Logs</span>
              </Link>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="vault-sidebar-footer">
          <div className="vault-protected-card">
            <div className="vault-protected-info">
              <span className="vault-protected-title">Protected ledger</span>
              <span className="vault-protected-sub">Secure by design</span>
            </div>
            <div className="vault-protected-badge">
              <Check size={16} />
            </div>
          </div>
          <div className="vault-sidebar-copyright">LEDGERLINE • PRIVATE</div>
        </div>
      </aside>

      {/* --------------------------------------------------------------------
          MAIN WRAPPER
          -------------------------------------------------------------------- */}
      <div className="vault-main-wrapper">
        {/* Top Header */}
        <header className="vault-top-header">
          <div className="vault-breadcrumb-trail">
            {crumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                {idx > 0 && <span style={{ opacity: 0.5 }}>›</span>}
                {crumb.href ? (
                  <Link to={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span className="vault-breadcrumb-current">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>

          <div className="vault-header-actions">
            <div className="vault-system-status">
              <span className="vault-status-dot"></span>
              <span>System operational</span>
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="vault-user-profile-container" ref={profileRef}>
              <button
                type="button"
                className="vault-user-profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="vault-avatar-circle">{userInitial}</div>
                <div className="vault-user-meta">
                  <span className="vault-user-name">{user?.name || "Account Holder"}</span>
                  <span className="vault-user-role">
                    {roleLabel} <ChevronDown size={11} />
                  </span>
                </div>
              </button>

              {profileOpen && (
                <div className="vault-dropdown-menu">
                  <div className="vault-dropdown-header">
                    <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--vault-text-primary)" }}>
                      {user?.name || "User"}
                    </div>
                    <div className="vault-dropdown-email">{user?.email || "user@ledgerline.com"}</div>
                  </div>

                  {user?.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      className="vault-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <ShieldAlert size={14} />
                      <span>Admin Portal</span>
                    </Link>
                  )}

                  {user?.role === "AUDITOR" && (
                    <Link
                      to="/auditor"
                      className="vault-dropdown-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <ShieldCheck size={14} />
                      <span>Auditor Portal</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    className="vault-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="vault-page-content">{children}</main>

        {/* Sub-footer */}
        <footer className="vault-subfooter">
          <div className="vault-subfooter-left">
            <span>LedgerLine</span>
            <span>•</span>
            <span>Financial clarity by design</span>
          </div>
          <div className="vault-subfooter-right">
            <Lock size={12} />
            <span>Security</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
