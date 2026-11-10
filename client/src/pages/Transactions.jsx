import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Receipt,
  Eye,
  X,
  CreditCard,
  Clock,
  RefreshCw,
  FileCheck,
} from "lucide-react";

import {
  getTransactions,
  getTransactionById,
} from "../services/transactionService";
import { getAccounts } from "../services/accountService";

function formatCurrency(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);
}

function Transactions() {
  const [searchParams] = useSearchParams();
  const urlAccountId = searchParams.get("account") || "";

  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(urlAccountId);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [error, setError] = useState("");

  // Transaction Inspection Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // 1. Load user's accounts
  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      try {
        const data = await getAccounts();
        const list = Array.isArray(data) ? data : data?.accounts || [];

        if (isMounted) {
          setAccounts(list);
          if (list.length > 0 && !accountId) {
            setAccountId(urlAccountId || list[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Unable to load accounts."
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
  }, [urlAccountId, accountId]);

  // 2. Load transactions whenever account, filter or page changes
  useEffect(() => {
    if (!accountId) return;

    let isMounted = true;

    const loadTxns = async () => {
      setLoadingTxns(true);
      setError("");

      try {
        const data = await getTransactions(accountId, {
          page,
          limit: 10,
          type,
        });

        if (isMounted) {
          setTransactions(data.transactions || []);
          setPagination(data.pagination || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Unable to load transactions."
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
  }, [accountId, page, type]);

  const handleOpenDetails = async (txnId) => {
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

  const getTransactionIcon = (transaction) => {
    if (transaction.type === "DEPOSIT") {
      return <ArrowDownLeft size={18} />;
    }

    if (transaction.type === "WITHDRAWAL") {
      return <ArrowUpRight size={18} />;
    }

    return <ArrowLeftRight size={18} />;
  };

  const getTransactionLabel = (transaction) => {
    if (transaction.type === "TRANSFER") {
      return `Transfer (${transaction.transferDirection || "N/A"})`;
    }

    return transaction.type;
  };

  const getAmountPrefix = (transaction) => {
    if (transaction.type === "DEPOSIT") return "+";
    if (
      transaction.type === "TRANSFER" &&
      transaction.transferDirection === "INCOMING"
    ) {
      return "+";
    }

    return "−";
  };

  const isIncoming = (transaction) =>
    transaction.type === "DEPOSIT" ||
    (transaction.type === "TRANSFER" &&
      transaction.transferDirection === "INCOMING");

  const selectedAccount = accounts.find((a) => a._id === accountId);

  return (
    <main className="transactions-page">
      <header className="transactions-header">
        <div>
          <span className="eyebrow">FINANCIAL ACTIVITY</span>
          <h1>Transaction history</h1>
          <p>Review your account transactions and inspect verified ledger proofs.</p>
        </div>

        <Link to="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>
      </header>

      <section className="transactions-panel">
        {loadingAccounts ? (
          <div className="transaction-empty">
            <RefreshCw size={28} className="spin-icon text-muted" />
            <p style={{ marginTop: "12px" }}>Loading your accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="transaction-empty">
            <CreditCard size={36} className="text-muted" />
            <h3>No registered bank accounts</h3>
            <p>You haven't opened any bank accounts yet.</p>
            <div style={{ marginTop: "16px" }}>
              <Link to="/dashboard" className="btn btn-primary">
                Open an Account on Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="transaction-filters">
              <div className="filter-group">
                <label htmlFor="account">Select account</label>
                <select
                  id="account"
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(event.target.value);
                    setPage(1);
                  }}
                >
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.accountNumber} ({account.accountType}) —{" "}
                      {formatCurrency(account.balancePaise)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="type">Transaction type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All transactions</option>
                  <option value="DEPOSIT">Deposits</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                  <option value="TRANSFER">Transfers</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            {loadingTxns ? (
              <div className="transaction-empty">
                <RefreshCw size={28} className="spin-icon text-muted" />
                <p style={{ marginTop: "12px" }}>Loading ledger entries...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="transaction-empty">
                <Receipt size={35} />
                <h3>No transactions recorded</h3>
                <p>
                  No financial movements found for this account matching the selected filter.
                </p>
              </div>
            ) : (
              <>
                <div className="transaction-table-wrapper">
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>Transaction</th>
                        <th>Description</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Balance after</th>
                        <th className="text-right">Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((transaction) => {
                        const incoming = isIncoming(transaction);

                        return (
                          <tr key={transaction._id}>
                            <td>
                              <div className="transaction-type">
                                <span
                                  className={
                                    incoming
                                      ? "transaction-icon incoming"
                                      : "transaction-icon outgoing"
                                  }
                                >
                                  {getTransactionIcon(transaction)}
                                </span>

                                <span>
                                  {getTransactionLabel(transaction)}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="text-muted text-xs">
                                {transaction.description || "—"}
                              </span>
                            </td>

                            <td className="text-nowrap text-xs">
                              {new Date(transaction.createdAt).toLocaleString("en-IN")}
                            </td>

                            <td
                              className={
                                incoming ? "amount-incoming" : "amount-outgoing"
                              }
                            >
                              {getAmountPrefix(transaction)}
                              {formatCurrency(transaction.amountPaise)}
                            </td>

                            <td>
                              <span className="font-mono font-semibold">
                                {formatCurrency(transaction.balanceAfterPaise)}
                              </span>
                            </td>

                            <td className="text-right">
                              <button
                                type="button"
                                className="btn btn-xs btn-secondary"
                                onClick={() => handleOpenDetails(transaction._id)}
                                title="Inspect transaction details and proof"
                              >
                                <Eye size={12} />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <button
                    disabled={!pagination?.hasPreviousPage}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination?.page || page} of{" "}
                    {pagination?.totalPages || 1}
                  </span>

                  <button
                    disabled={!pagination?.hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* Transaction Details Modal */}
      {(selectedTxn || modalLoading) && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-txn-modal-title"
        >
          <div className="modal-container audit-detail-modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FileCheck size={20} className="text-primary" />
                <h3 id="user-txn-modal-title">Transaction Details & Proof</h3>
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
                <p>Retrieving transaction details...</p>
              </div>
            ) : selectedTxn ? (
              <div className="modal-body">
                <div className="audit-detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Transaction Reference</span>
                    <code>{selectedTxn.reference}</code>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Associated Account</span>
                    <span>
                      {selectedAccount ? (
                        <strong>
                          {selectedAccount.accountNumber} ({selectedAccount.accountType})
                        </strong>
                      ) : (
                        <code>{selectedTxn.account}</code>
                      )}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="pill-tag success">
                      {selectedTxn.type}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Timestamp</span>
                    <div className="timestamp-cell">
                      <Clock size={12} className="text-muted" />
                      {new Date(selectedTxn.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Amount Transacted</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                      {formatCurrency(selectedTxn.amountPaise)}
                    </strong>
                    <span className="text-xs text-muted">
                      ({selectedTxn.amountPaise} paise)
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Balance After Transaction</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                      {formatCurrency(selectedTxn.balanceAfterPaise)}
                    </strong>
                    <span className="text-xs text-muted">
                      ({selectedTxn.balanceAfterPaise} paise)
                    </span>
                  </div>

                  {selectedTxn.transferId && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Transfer Metadata</span>
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
                      <span className="detail-label">Idempotency Reference</span>
                      <div className="actor-detail-box" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        <div>
                          <strong>Key:</strong> <code>{selectedTxn.idempotencyKey}</code>
                        </div>
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
    </main>
  );
}

export default Transactions;
