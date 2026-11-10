import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  CreditCard,
  Receipt,
  Users,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Lock,
} from "lucide-react";
import VaultLayout from "../../layouts/VaultLayout";
import {
  getAdminAccounts,
  getAdminUsers,
  getAuditLogs,
} from "../../services/adminService";

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function AuditorDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalAuditLogs: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    frozenAccounts: 0,
    closedAccounts: 0,
    totalBalancePaise: 0,
    totalUsers: 0,
    activeUsers: 0,
    recentAudits: [],
  });

  const fetchAuditorStats = async () => {
    const [auditData, accountsData, usersData] = await Promise.all([
      getAuditLogs({ page: 1, limit: 5 }),
      getAdminAccounts(),
      getAdminUsers({ page: 1, limit: 100 }),
    ]);

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

    const users = usersData.users || [];
    const totalUsers = usersData.pagination?.totalUsers ?? users.length;
    const activeUsers = users.filter((u) => u.status === "ACTIVE").length;

    const totalAuditLogs =
      auditData.pagination?.totalLogs ?? (auditData.auditLogs?.length || 0);
    const recentAudits = auditData.auditLogs || [];

    return {
      totalAuditLogs,
      totalAccounts,
      activeAccounts,
      frozenAccounts,
      closedAccounts,
      totalBalancePaise,
      totalUsers,
      activeUsers,
      recentAudits,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const nextStats = await fetchAuditorStats();
        if (isMounted) {
          setStats(nextStats);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load compliance metrics. Please check network connection."
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
      const nextStats = await fetchAuditorStats();
      setStats(nextStats);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to refresh audit metrics."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <VaultLayout breadcrumb={[{ label: "Compliance & Audit", href: "/auditor" }, { label: "Compliance Hub" }]}>
      <div className="auditor-container">
          {/* Header */}
          <div className="auditor-page-header">
            <div>
              <span className="eyebrow amber">INDEPENDENT COMPLIANCE & FORENSICS</span>
              <h1>Auditor Dashboard</h1>
              <p>System-wide ledger transparency, immutable administrative audit trails, and financial traceability.</p>
            </div>

            <div className="auditor-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading || refreshing}
              >
                <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
                <span>{refreshing ? "Refreshing..." : "Refresh Audit Data"}</span>
              </button>
            </div>
          </div>

          {/* Compliance Notice Banner */}
          <div className="compliance-banner">
            <div className="compliance-banner-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="compliance-banner-text">
              <strong>Read-Only Compliance & Audit Session</strong>
              <p>
                As an AUDITOR, you hold read-only oversight across all user profiles, bank accounts,
                and financial transactions. System state modifications and fund movements are disabled.
              </p>
            </div>
            <span className="compliance-badge">
              <Lock size={12} /> Read-Only Enforced
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Audit Telemetry Error</strong>
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
              <p>Compiling platform audit trail and ledger balances...</p>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="admin-stats-grid">
                {/* Audit Logs Stat */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Audit Trail Records</span>
                    <span className="stat-icon-wrap audit-icon">
                      <FileText size={20} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.totalAuditLogs}</div>
                  <div className="stat-subtext">
                    <span className="pill-tag neutral">
                      <ShieldCheck size={12} /> Cryptographically logged
                    </span>
                  </div>
                </div>

                {/* Bank Accounts Stat */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Monitored Accounts</span>
                    <span className="stat-icon-wrap account-icon">
                      <CreditCard size={20} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.totalAccounts}</div>
                  <div className="stat-subtext">
                    <span className="pill-tag success">{stats.activeAccounts} Active</span>
                    {stats.frozenAccounts > 0 && (
                      <span className="pill-tag warning">{stats.frozenAccounts} Frozen</span>
                    )}
                    {stats.closedAccounts > 0 && (
                      <span className="pill-tag danger">{stats.closedAccounts} Closed</span>
                    )}
                  </div>
                </div>

                {/* Total Balance Stat */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Audited System Balance</span>
                    <span className="stat-icon-wrap balance-icon">
                      <TrendingUp size={20} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {formatCurrency(stats.totalBalancePaise)}
                  </div>
                  <div className="stat-subtext text-muted">
                    Total liquid reserves in ledger
                  </div>
                </div>

                {/* Monitored Users Stat */}
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-title">Monitored Users</span>
                    <span className="stat-icon-wrap user-icon">
                      <Users size={20} />
                    </span>
                  </div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-subtext">
                    <span className="pill-tag success">{stats.activeUsers} Active</span>
                  </div>
                </div>
              </div>

              {/* Navigation Action Cards */}
              <div className="admin-action-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <Link to="/auditor/audit-logs" className="action-card">
                  <div className="action-card-icon audit-icon">
                    <FileText size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>Audit Trail</h3>
                    <p>Review tamper-evident logs of administrative state changes.</p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={18} />
                  </span>
                </Link>

                <Link to="/auditor/accounts" className="action-card">
                  <div className="action-card-icon account-icon">
                    <CreditCard size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>Bank Accounts</h3>
                    <p>Inspect all registered accounts, balances, and operational statuses.</p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={18} />
                  </span>
                </Link>

                <Link to="/auditor/transactions" className="action-card">
                  <div className="action-card-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                    <Receipt size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>Transaction Ledger</h3>
                    <p>Inspect ledger transactions across any account in the system.</p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={18} />
                  </span>
                </Link>

                <Link to="/auditor/users" className="action-card">
                  <div className="action-card-icon user-icon">
                    <Users size={24} />
                  </div>
                  <div className="action-card-content">
                    <h3>User Directory</h3>
                    <p>Read-only overview of platform users, email addresses, and roles.</p>
                  </div>
                  <span className="action-card-arrow">
                    <ArrowRight size={18} />
                  </span>
                </Link>
              </div>

              {/* Recent Audit Activity Table */}
              <div className="admin-card-section">
                <div className="section-header-row">
                  <div>
                    <h2>Recent Administrative Activity</h2>
                    <p className="text-muted">The latest recorded operations across the platform.</p>
                  </div>
                  <Link to="/auditor/audit-logs" className="btn btn-sm btn-secondary">
                    View Full Audit Trail
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
                          <th>Target Entity</th>
                          <th>Changes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentAudits.map((log) => (
                          <tr key={log._id}>
                            <td className="text-nowrap text-xs">
                              {new Date(log.createdAt).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <span className={`pill-tag ${log.action.includes("SUSPEND") || log.action.includes("FROZEN") || log.action.includes("CLOSED") ? "warning" : "success"}`}>
                                {log.action.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td>
                              <strong>{log.actor?.name || "Administrator"}</strong>
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
    </VaultLayout>
  );
}

export default AuditorDashboard;
