import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  UserCheck,
  UserX,
  Lock,
} from "lucide-react";
import AdminNavbar from "../../components/AdminNavbar";
import {
  getAdminUsers,
  getAdminAccounts,
  getAuditLogs,
} from "../../services/adminService";

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    frozenAccounts: 0,
    closedAccounts: 0,
    totalBalancePaise: 0,
    totalAuditLogs: 0,
    recentAudits: [],
  });

  const fetchDashboardStats = async () => {
    const [usersData, accountsData, auditData] = await Promise.all([
      getAdminUsers({ page: 1, limit: 100 }),
      getAdminAccounts(),
      getAuditLogs({ page: 1, limit: 5 }),
    ]);

    const users = usersData.users || [];
    const totalUsers = usersData.pagination?.totalUsers ?? users.length;
    const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
    const suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length;

    const accounts = Array.isArray(accountsData.accounts)
      ? accountsData.accounts
      : [];
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
    const frozenAccounts = accounts.filter((a) => a.status === "FROZEN").length;
    const closedAccounts = accounts.filter((a) => a.status === "CLOSED").length;

    const totalBalancePaise = accounts.reduce(
      (sum, a) => sum + (Number(a.balancePaise) || 0),
      0
    );

    const totalAuditLogs =
      auditData.pagination?.totalLogs ?? (auditData.auditLogs?.length || 0);
    const recentAudits = auditData.auditLogs || [];

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalAccounts,
      activeAccounts,
      frozenAccounts,
      closedAccounts,
      totalBalancePaise,
      totalAuditLogs,
      recentAudits,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const nextStats = await fetchDashboardStats();
        if (isMounted) {
          setStats(nextStats);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load administrative overview. Please check connection."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const nextStats = await fetchDashboardStats();
      setStats(nextStats);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to refresh overview data."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="admin-page-wrapper">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-page-header">
            <div>
              <span className="eyebrow">ADMINISTRATION CONTROL PANEL</span>
              <h1>System Overview</h1>
              <p>Real-time platform metrics, user access, and ledger accounting health.</p>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading || refreshing}
              >
                <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
                <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Error loading dashboard</strong>
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleRefresh}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="admin-loading-state">
              <RefreshCw size={36} className="spin-icon" />
              <p>Gathering system telemetry and ledger accounts...</p>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="admin-stats-grid">
                {/* Users Stat Card */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Registered Users</span>
                    <span className="stat-icon-wrap user-icon">
                      <Users size={20} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-subtext">
                    <span className="pill-tag success">
                      <UserCheck size={12} /> {stats.activeUsers} Active
                    </span>
                    {stats.suspendedUsers > 0 && (
                      <span className="pill-tag warning">
                        <UserX size={12} /> {stats.suspendedUsers} Suspended
                      </span>
                    )}
                  </div>
                </div>

                {/* Accounts Stat Card */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Bank Accounts</span>
                    <span className="stat-icon-wrap account-icon">
                      <CreditCard size={20} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.totalAccounts}</div>
                  <div className="stat-subtext">
                    <span className="pill-tag success">
                      {stats.activeAccounts} Active
                    </span>
                    {stats.frozenAccounts > 0 && (
                      <span className="pill-tag warning">
                        <Lock size={12} /> {stats.frozenAccounts} Frozen
                      </span>
                    )}
                    {stats.closedAccounts > 0 && (
                      <span className="pill-tag danger">
                        {stats.closedAccounts} Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Ledger Balance Stat Card */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Total System Balance</span>
                    <span className="stat-icon-wrap balance-icon">
                      <TrendingUp size={20} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {formatCurrency(stats.totalBalancePaise)}
                  </div>
                  <div className="stat-subtext text-muted">
                    Summed balance across all registered accounts
                  </div>
                </div>

                {/* Audit Logs Stat Card */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Audit Trail Entries</span>
                    <span className="stat-icon-wrap audit-icon">
                      <FileText size={20} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.totalAuditLogs}</div>
                  <div className="stat-subtext">
                    <span className="pill-tag neutral">
                      <ShieldCheck size={12} /> Immutable record
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Action Cards */}
              <div className="admin-action-cards">
                <Link to="/admin/users" className="action-card">
                  <div className="action-card-icon user-icon">
                    <Users size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>User Management</h3>
                    <p>
                      Inspect users, filter by role or status, suspend/reactivate accounts, and manage role assignments.
                    </p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={20} />
                  </span>
                </Link>

                <Link to="/admin/accounts" className="action-card">
                  <div className="action-card-icon account-icon">
                    <CreditCard size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>Account Management</h3>
                    <p>
                      Manage system bank accounts, freeze suspicious accounts, reactivate, or close zero-balance accounts.
                    </p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={20} />
                  </span>
                </Link>

                <Link to="/admin/audit-logs" className="action-card">
                  <div className="action-card-icon audit-icon">
                    <FileText size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>Administrative Audit Trail</h3>
                    <p>
                      Review tamper-evident audit logs documenting every administrative action and state change.
                    </p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={20} />
                  </span>
                </Link>
              </div>

              {/* Recent Audit Activity Snapshot */}
              <div className="admin-card-section">
                <div className="section-header-row">
                  <div>
                    <h2>Recent Administrative Activity</h2>
                    <p className="text-muted">The latest operations executed across the administrative boundary.</p>
                  </div>
                  <Link to="/admin/audit-logs" className="btn btn-sm btn-secondary">
                    View All Audit Logs
                  </Link>
                </div>

                {stats.recentAudits.length === 0 ? (
                  <div className="admin-empty-state">
                    <FileText size={32} />
                    <p>No administrative activity has been logged yet.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>Administrator</th>
                          <th>Target Type</th>
                          <th>Changes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentAudits.map((log) => (
                          <tr key={log._id}>
                            <td className="text-nowrap">
                              {new Date(log.createdAt).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <span className={`pill-tag ${log.action.includes("SUSPEND") || log.action.includes("FROZEN") || log.action.includes("CLOSED") ? "warning" : "success"}`}>
                                {log.action.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td>
                              <strong>{log.actor?.name || "System Admin"}</strong>
                              <div className="text-muted text-xs">{log.actor?.email}</div>
                            </td>
                            <td>
                              <span className="pill-tag neutral">{log.targetType}</span>
                            </td>
                            <td>
                              <span className="change-preview">
                                {log.changes?.field}: <code>{log.changes?.previousValue}</code> → <code>{log.changes?.newValue}</code>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
