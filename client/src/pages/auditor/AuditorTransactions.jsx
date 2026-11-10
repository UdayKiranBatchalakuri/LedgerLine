import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Eye,
  CreditCard,
  Clock,
  X,
  FileCheck,
} from "lucide-react";
import AuditorNavbar from "../../components/AuditorNavbar";
import { getAdminAccounts } from "../../services/adminService";
import {
  getTransactions,
  getTransactionById,
} from "../../services/transactionService";

const TRANSACTION_TYPES = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"];

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function AuditorTransactions() {
  const [searchParams] = useSearchParams();
  const urlAccountId = searchParams.get("account") || "";

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(urlAccountId);

  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalTransactions: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Transaction Inspection Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // 1. Load all system accounts for dropdown
  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      try {
        const data = await getAdminAccounts();
        const list = Array.isArray(data.accounts) ? data.accounts : [];

        if (isMounted) {
          setAccounts(list);
          if (list.length > 0 && !selectedAccountId) {
            setSelectedAccountId(urlAccountId || list[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load platform accounts list."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingAccounts(false);
        }
      }
    };

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [urlAccountId, selectedAccountId]);

  // 2. Load transactions when selected account, page, or type filter changes
  useEffect(() => {
    if (!selectedAccountId) return;

    let isMounted = true;

    const loadTxns = async () => {
      setLoadingTxns(true);
      try {
        const data = await getTransactions(selectedAccountId, {
          page,
          limit: 10,
          type: typeFilter,
        });

        if (isMounted) {
          setTransactions(data.transactions || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load account ledger transactions."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingTxns(false);
        }
      }
    };

    loadTxns();

    return () => {
      isMounted = false;
    };
  }, [selectedAccountId, page, typeFilter]);

  const handleRefresh = async () => {
    if (!selectedAccountId) return;
    setRefreshing(true);
    setErrorMessage("");
    try {
      const data = await getTransactions(selectedAccountId, {
        page,
        limit: 10,
        type: typeFilter,
      });
      setTransactions(data.transactions || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to refresh transaction ledger."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
  };

  const openTxnDetail = async (txnId) => {
    try {
      setModalLoading(true);
      const data = await getTransactionById(txnId);
      setSelectedTxn(data.transaction);
    } catch {
      const fallback = transactions.find((t) => t._id === txnId);
      setSelectedTxn(fallback || null);
    } finally {
      setModalLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    if (type === "DEPOSIT") return <ArrowDownLeft size={16} />;
    if (type === "WITHDRAWAL") return <ArrowUpRight size={16} />;
    return <ArrowLeftRight size={16} />;
  };

  const isIncoming = (txn) =>
    txn.type === "DEPOSIT" ||
    (txn.type === "TRANSFER" && txn.transferDirection === "INCOMING");

  // Client search query
  const filteredTxns = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const ref = t.reference?.toLowerCase() || "";
    const desc = t.description?.toLowerCase() || "";
    const type = t.type?.toLowerCase() || "";
    return ref.includes(q) || desc.includes(q) || type.includes(q);
  });

  const selectedAccountObj = accounts.find((a) => a._id === selectedAccountId);

  return (
    <div className="auditor-page-wrapper">
      <AuditorNavbar />

      <main className="auditor-main">
        <div className="auditor-container">
          {/* Header */}
          <div className="auditor-page-header">
            <div>
              <span className="eyebrow amber">FORENSIC TRANSACTION LEDGER</span>
              <h1>Transaction Inspection</h1>
              <p>
                Inspect double-entry ledger history, atomic balance snapshots,
                and paired fund transfers across any platform account.
              </p>
            </div>

            <div className="auditor-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loadingTxns || refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "spin-icon" : ""}
                />
                <span>Refresh Ledger</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {errorMessage && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Ledger Retrieval Error</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Account Selector & Filters Bar */}
          <div className="admin-filter-bar">
            {/* Account Selector */}
            <div className="filter-item" style={{ flex: 1, minWidth: "280px" }}>
              <CreditCard size={18} />
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setPage(1);
                }}
                disabled={loadingAccounts}
                style={{ width: "100%", fontWeight: 600 }}
                aria-label="Select Account for Ledger Inspection"
              >
                {loadingAccounts ? (
                  <option value="">Loading accounts...</option>
                ) : accounts.length === 0 ? (
                  <option value="">No bank accounts available</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountNumber} ({acc.accountType}) — Balance:{" "}
                      {formatCurrency(acc.balancePaise)} [{acc.status}]
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="filter-select-group">
              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by transaction type"
                >
                  <option value="">All Types</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-input-wrap" style={{ minWidth: "200px" }}>
                <Search size={16} className="filter-icon" />
                <input
                  type="text"
                  placeholder="Search reference, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-search-input"
                  style={{ height: "42px" }}
                />
              </div>
            </div>
          </div>

          {/* Selected Account Metadata Bar */}
          {selectedAccountObj && (
            <div
              className="admin-alert warning"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <CreditCard size={20} />
                <span>
                  Auditing Account: <strong>{selectedAccountObj.accountNumber}</strong>{" "}
                  ({selectedAccountObj.accountType}) | Status:{" "}
                  <strong>{selectedAccountObj.status}</strong>
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>
                Current Ledger Balance: {formatCurrency(selectedAccountObj.balancePaise)}
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="admin-card-section">
            {loadingTxns ? (
              <div className="admin-loading-state">
                <RefreshCw size={36} className="spin-icon" />
                <p>Retrieving transaction entries from ledger...</p>
              </div>
            ) : filteredTxns.length === 0 ? (
              <div className="admin-empty-state">
                <Receipt size={36} />
                <h3>No transactions recorded</h3>
                <p>There are no transactions matching the current criteria for this account.</p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Reference Code</th>
                        <th>Description</th>
                        <th>Timestamp</th>
                        <th>Amount</th>
                        <th>Balance Snapshot</th>
                        <th className="text-right">Inspection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxns.map((txn) => {
                        const incoming = isIncoming(txn);

                        return (
                          <tr key={txn._id}>
                            <td>
                              <div className="transaction-type">
                                <span
                                  className={`pill-tag ${
                                    incoming ? "success" : "neutral"
                                  }`}
                                >
                                  {getTransactionIcon(txn.type)}
                                  {txn.type}
                                  {txn.transferDirection && (
                                    <span>({txn.transferDirection})</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td>
                              <code className="target-id" title={txn.reference}>
                                {txn.reference?.slice(0, 10)}...
                              </code>
                            </td>
                            <td>
                              <span className="text-muted text-xs">
                                {txn.description || "—"}
                              </span>
                            </td>
                            <td className="text-nowrap text-muted text-xs">
                              <div className="timestamp-cell">
                                <Clock size={12} className="text-muted" />
                                {new Date(txn.createdAt).toLocaleString("en-IN")}
                              </div>
                            </td>
                            <td>
                              <strong
                                className={
                                  incoming ? "amount-incoming" : "amount-outgoing"
                                }
                              >
                                {incoming ? "+" : "−"}
                                {formatCurrency(txn.amountPaise)}
                              </strong>
                            </td>
                            <td>
                              <span className="font-mono font-semibold">
                                {formatCurrency(txn.balanceAfterPaise)}
                              </span>
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                className="btn btn-xs btn-secondary"
                                onClick={() => openTxnDetail(txn._id)}
                                title="Inspect transaction details"
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="admin-pagination">
                  <div className="pagination-info">
                    Showing {filteredTxns.length} of {pagination.totalTransactions} recorded transactions
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPreviousPage || loadingTxns}
                    >
                      Previous
                    </button>
                    <span className="pagination-page-indicator">
                      Page {pagination.page} of {pagination.totalPages || 1}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage || loadingTxns}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {(selectedTxn || modalLoading) && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="txn-modal-title"
        >
          <div className="modal-container audit-detail-modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FileCheck size={20} className="text-primary" />
                <h3 id="txn-modal-title">Transaction Proof & Traceability</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedTxn(null)}
              >
                <X size={18} />
              </button>
            </div>

            {modalLoading ? (
              <div className="admin-loading-state" style={{ padding: "30px" }}>
                <RefreshCw size={24} className="spin-icon" />
                <p>Retrieving transaction proof...</p>
              </div>
            ) : selectedTxn ? (
              <div className="modal-body">
                <div className="audit-detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Transaction ID</span>
                    <code>{selectedTxn._id}</code>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Unique Reference</span>
                    <code>{selectedTxn.reference}</code>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Transaction Type</span>
                    <span className="pill-tag success">
                      {selectedTxn.type}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Transaction Timestamp</span>
                    <span>
                      {new Date(selectedTxn.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Processed Amount</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                      {formatCurrency(selectedTxn.amountPaise)}
                    </strong>
                    <span className="text-xs text-muted">
                      ({selectedTxn.amountPaise} paise)
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Balance After Operation</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                      {formatCurrency(selectedTxn.balanceAfterPaise)}
                    </strong>
                    <span className="text-xs text-muted">
                      ({selectedTxn.balanceAfterPaise} paise)
                    </span>
                  </div>

                  {selectedTxn.transferId && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Paired Transfer Metadata</span>
                      <div className="actor-detail-box">
                        <div>
                          <strong>Transfer ID:</strong> <code>{selectedTxn.transferId}</code>
                        </div>
                        <div>
                          <strong>Direction:</strong>{" "}
                          <span className="pill-tag neutral">
                            {selectedTxn.transferDirection}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTxn.idempotencyKey && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Idempotency Key & Proof</span>
                      <div className="actor-detail-box" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        <div>
                          <strong>Idempotency Key:</strong>{" "}
                          <code>{selectedTxn.idempotencyKey}</code>
                        </div>
                        {selectedTxn.requestHash && (
                          <div style={{ marginTop: "4px" }}>
                            <strong>Request Hash (SHA-256):</strong>{" "}
                            <code style={{ fontSize: "11px" }}>{selectedTxn.requestHash}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="detail-item full-width">
                    <span className="detail-label">Description / Memo</span>
                    <p style={{ margin: 0, color: "#334155" }}>
                      {selectedTxn.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTxn(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditorTransactions;
