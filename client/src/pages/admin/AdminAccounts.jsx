import { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  XCircle,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AdminNavbar from "../../components/AdminNavbar";
import ConfirmModal from "../../components/ConfirmModal";
import {
  getAdminAccounts,
  updateAccountStatus,
} from "../../services/adminService";

const ACCOUNT_STATUSES = ["ACTIVE", "FROZEN", "CLOSED"];
const ACCOUNT_TYPES = ["SAVINGS", "CURRENT"];

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: null,
    confirmText: "",
    confirmVariant: "danger",
    onConfirm: null,
  });

  const loadAccounts = async () => {
    const data = await getAdminAccounts();
    return Array.isArray(data.accounts) ? data.accounts : [];
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const list = await loadAccounts();
        if (isMounted) {
          setAccounts(list);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load bank accounts."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMessage("");
    try {
      const list = await loadAccounts();
      setAccounts(list);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load bank accounts."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Status Change Dialog Handler
  const promptAccountAction = (account, targetStatus) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (targetStatus === "CLOSED") {
      const hasBalance = account.balancePaise > 0;

      setConfirmModal({
        isOpen: true,
        title: "Close Bank Account",
        message: (
          <div>
            <p>
              Are you sure you want to permanently close account{" "}
              <strong>{account.accountNumber}</strong>?
            </p>
            {hasBalance ? (
              <div
                className="admin-alert error"
                style={{ marginTop: "12px", padding: "10px" }}
              >
                <AlertTriangle size={18} />
                <div className="alert-content">
                  <strong>Positive Balance Detected</strong>
                  <p>
                    Current balance is{" "}
                    <strong>{formatCurrency(account.balancePaise)}</strong>.
                    Banking rules prohibit closing accounts with positive balances.
                    Funds must be withdrawn or transferred first.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted text-xs" style={{ marginTop: "8px" }}>
                This account has zero balance. Closing is permanent and cannot be
                undone or reactivated.
              </p>
            )}
          </div>
        ),
        confirmText: "Close Account",
        confirmVariant: "danger",
        onConfirm: async () => {
          try {
            setActionLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const result = await updateAccountStatus(account._id, "CLOSED");
            setSuccessMessage(
              result.message || `Account ${account.accountNumber} closed.`
            );
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            const list = await loadAccounts();
            setAccounts(list);
          } catch (err) {
            setErrorMessage(
              err.response?.data?.message || "Failed to close account."
            );
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } finally {
            setActionLoading(false);
          }
        },
      });
      return;
    }

    if (targetStatus === "FROZEN") {
      setConfirmModal({
        isOpen: true,
        title: "Freeze Account",
        message: (
          <p>
            Freeze account <strong>{account.accountNumber}</strong>? Freezing
            prohibits all deposits, withdrawals, and transfers until reactivated.
          </p>
        ),
        confirmText: "Freeze Account",
        confirmVariant: "warning",
        onConfirm: async () => {
          try {
            setActionLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const result = await updateAccountStatus(account._id, "FROZEN");
            setSuccessMessage(
              result.message || `Account ${account.accountNumber} frozen.`
            );
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            const list = await loadAccounts();
            setAccounts(list);
          } catch (err) {
            setErrorMessage(
              err.response?.data?.message || "Failed to freeze account."
            );
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } finally {
            setActionLoading(false);
          }
        },
      });
      return;
    }

    if (targetStatus === "ACTIVE") {
      setConfirmModal({
        isOpen: true,
        title: "Reactivate Account",
        message: (
          <p>
            Reactivate account <strong>{account.accountNumber}</strong> to restore
            standard transaction privileges?
          </p>
        ),
        confirmText: "Reactivate Account",
        confirmVariant: "primary",
        onConfirm: async () => {
          try {
            setActionLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const result = await updateAccountStatus(account._id, "ACTIVE");
            setSuccessMessage(
              result.message || `Account ${account.accountNumber} reactivated.`
            );
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            const list = await loadAccounts();
            setAccounts(list);
          } catch (err) {
            setErrorMessage(
              err.response?.data?.message || "Failed to activate account."
            );
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } finally {
            setActionLoading(false);
          }
        },
      });
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    if (statusFilter && acc.status !== statusFilter) return false;
    if (typeFilter && acc.accountType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = acc.accountNumber?.toLowerCase().includes(q);
      const matchOwner =
        typeof acc.owner === "string"
          ? acc.owner.toLowerCase().includes(q)
          : acc.owner?._id?.toLowerCase().includes(q);
      return matchNum || matchOwner;
    }
    return true;
  });

  return (
    <div className="admin-page-wrapper">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-page-header">
            <div>
              <span className="eyebrow">FINANCIAL REPOSITORIES</span>
              <h1>Account Management</h1>
              <p>
                Inspect bank accounts, monitor balances, freeze suspicious activity,
                or permanently retire eligible zero-balance accounts.
              </p>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "spin-icon" : ""}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Operation Rejected</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="admin-alert success" role="status">
              <CheckCircle2 size={20} />
              <div className="alert-content">
                <strong>Success</strong>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <div className="filter-input-wrap">
              <Search size={18} className="filter-icon" />
              <input
                type="text"
                placeholder="Search by account number or owner ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
            </div>

            <div className="filter-select-group">
              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by account status"
                >
                  <option value="">All Statuses</option>
                  {ACCOUNT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by account type"
                >
                  <option value="">All Types</option>
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="admin-card-section">
            {loading ? (
              <div className="admin-loading-state">
                <RefreshCw size={36} className="spin-icon" />
                <p>Loading accounts...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="admin-empty-state">
                <CreditCard size={36} />
                <h3>No bank accounts found</h3>
                <p>Try clearing filters or search terms.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Account Number</th>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Owner Identifier</th>
                      <th>Created</th>
                      <th className="text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((acc) => {
                      const isClosed = acc.status === "CLOSED";
                      const isFrozen = acc.status === "FROZEN";
                      const isActive = acc.status === "ACTIVE";

                      return (
                        <tr key={acc._id} className={isClosed ? "row-muted" : ""}>
                          <td>
                            <div className="account-number-cell">
                              <CreditCard size={16} className="text-muted" />
                              <strong>{acc.accountNumber}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="pill-tag neutral">
                              {acc.accountType}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono font-semibold">
                              {formatCurrency(acc.balancePaise)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`pill-tag ${
                                isActive
                                  ? "success"
                                  : isFrozen
                                  ? "warning"
                                  : "danger"
                              }`}
                            >
                              {isActive && <Unlock size={11} />}
                              {isFrozen && <Lock size={11} />}
                              {isClosed && <XCircle size={11} />}
                              {acc.status}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-xs text-muted" title={acc.owner}>
                              {typeof acc.owner === "string"
                                ? `${acc.owner.slice(0, 10)}...`
                                : acc.owner?._id || "—"}
                            </span>
                          </td>
                          <td className="text-nowrap text-muted text-xs">
                            {new Date(acc.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="text-right">
                            <div className="table-actions">
                              {/* Freeze Button */}
                              {isActive && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-warning"
                                  onClick={() =>
                                    promptAccountAction(acc, "FROZEN")
                                  }
                                  disabled={actionLoading}
                                  title="Freeze account"
                                >
                                  <Lock size={12} />
                                  <span>Freeze</span>
                                </button>
                              )}

                              {/* Reactivate Button */}
                              {isFrozen && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-primary"
                                  onClick={() =>
                                    promptAccountAction(acc, "ACTIVE")
                                  }
                                  disabled={actionLoading}
                                  title="Reactivate account"
                                >
                                  <Unlock size={12} />
                                  <span>Activate</span>
                                </button>
                              )}

                              {/* Close Account Button */}
                              {!isClosed && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-danger"
                                  onClick={() =>
                                    promptAccountAction(acc, "CLOSED")
                                  }
                                  disabled={actionLoading}
                                  title={
                                    acc.balancePaise > 0
                                      ? "Cannot close account with positive balance"
                                      : "Permanently close zero-balance account"
                                  }
                                >
                                  <XCircle size={12} />
                                  <span>Close</span>
                                </button>
                              )}

                              {isClosed && (
                                <span className="text-muted text-xs">
                                  Closed & Archived
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        loading={actionLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}

export default AdminAccounts;
