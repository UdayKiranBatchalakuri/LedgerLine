import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Receipt,
  Lock,
  Unlock,
  XCircle,
} from "lucide-react";
import VaultLayout from "../../layouts/VaultLayout";
import { getAdminAccounts } from "../../services/adminService";

const ACCOUNT_STATUSES = ["ACTIVE", "FROZEN", "CLOSED"];
const ACCOUNT_TYPES = ["SAVINGS", "CURRENT"];

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function AuditorAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
            err.response?.data?.message || "Failed to retrieve bank accounts."
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
        err.response?.data?.message || "Failed to refresh accounts."
      );
    } finally {
      setRefreshing(false);
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
    <VaultLayout breadcrumb={[{ label: "Compliance & Audit", href: "/auditor" }, { label: "Bank Accounts Oversight" }]}>
      <div className="auditor-container">
          {/* Header */}
          <div className="auditor-page-header">
            <div>
              <span className="eyebrow amber">LEDGER ACCOUNTS OVERVIEW</span>
              <h1>Bank Accounts Oversight</h1>
              <p>
                Read-only inspection of all registered financial accounts,
                balance reserves, and operational lifecycle statuses.
              </p>
            </div>

            <div className="auditor-header-actions">
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
                <span>Refresh Accounts</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {errorMessage && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Account Retrieval Error</strong>
                <p>{errorMessage}</p>
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
                  aria-label="Filter by status"
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
                  aria-label="Filter by type"
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
                <p>Loading bank accounts...</p>
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
                      <th>Account Type</th>
                      <th>Ledger Balance</th>
                      <th>Status</th>
                      <th>Owner ID</th>
                      <th>Creation Date</th>
                      <th className="text-right">Transaction Inspection</th>
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
                            <Link
                              to={`/auditor/transactions?account=${acc._id}`}
                              className="btn btn-xs btn-secondary"
                              title="Inspect transactions for this account"
                            >
                              <Receipt size={12} />
                              <span>View Ledger</span>
                            </Link>
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
    </VaultLayout>
  );
}

export default AuditorAccounts;
