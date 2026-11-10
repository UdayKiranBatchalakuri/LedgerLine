import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Filter,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import VaultLayout from "../layouts/VaultLayout";
import VaultProofModal from "../components/VaultProofModal";
import { getAccounts } from "../services/accountService";
import { getTransactions } from "../services/transactionService";

function formatStatementDate(dateStr) {
  if (!dateStr) return "Just now";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Statements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountParam = searchParams.get("account");

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalTransactions: 0 });
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeProofTxn, setActiveProofTxn] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Load accounts
  useEffect(() => {
    let isMounted = true;
    getAccounts()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res.accounts || [];
        setAccounts(list);

        if (list.length > 0) {
          const target = accountParam && list.some((a) => a._id === accountParam)
            ? accountParam
            : list[0]._id;
          setSelectedAccountId(target);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load accounts for statements", err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accountParam]);

  // Load transactions on filter or account change
  useEffect(() => {
    if (!selectedAccountId) return;
    let isMounted = true;

    getTransactions(selectedAccountId, { page: 1, limit: 10, type: filterType })
      .then((res) => {
        if (isMounted) {
          setTransactions(res.transactions || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, totalTransactions: 0 });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load transactions", err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedAccountId, filterType]);

  const handlePageChange = useCallback(async (newPage) => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const res = await getTransactions(selectedAccountId, { page: newPage, limit: 10, type: filterType });
      setTransactions(res.transactions || []);
      setPagination(res.pagination || { page: newPage, totalPages: 1, totalTransactions: 0 });
    } catch (err) {
      console.error("Failed to change page", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, filterType]);

  const handleAccountChange = (accId) => {
    setSelectedAccountId(accId);
    setSearchParams({ account: accId });
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentAccount = accounts.find((a) => a._id === selectedAccountId);

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Statements" }]}>
      <div className="vault-view-header">
        <div className="vault-view-header-row">
          <div>
            <div className="vault-view-kicker">LEDGER</div>
            <h1 className="vault-view-title">Account statements</h1>
            <p className="vault-view-subtitle">
              Posted entries and resolved retrieval in the order supplied by the ledger.
            </p>
          </div>
          {currentAccount && (
            <div className="vault-badge-counter">
              Balance: ₹{((currentAccount.balancePaise || 0) / 100).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {accounts.length === 0 && !loading ? (
        <div className="vault-empty-card" style={{ padding: "64px 24px" }}>
          <div className="vault-empty-icon">
            <Activity />
          </div>
          <h3 className="vault-empty-title">No accounts available</h3>
          <p className="vault-empty-desc">Statements available for accounts in view.</p>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--vault-text-secondary)" }}>
                Account:
              </span>
              <select
                className="vault-select"
                style={{ width: "auto", minWidth: "240px", padding: "6px 12px" }}
                value={selectedAccountId}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountType || acc.type} (₹{((acc.balancePaise || 0) / 100).toFixed(2)}) — ...{acc.accountNumber ? acc.accountNumber.slice(-6) : acc._id.slice(-6)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={14} color="var(--vault-text-muted)" />
              <select
                className="vault-select"
                style={{ width: "auto", padding: "6px 12px" }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Transactions</option>
                <option value="DEPOSIT">Deposits Only</option>
                <option value="WITHDRAWAL">Withdrawals Only</option>
                <option value="TRANSFER">Transfers Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--vault-text-muted)" }}>
              Retrieving statement entries from the ledger...
            </div>
          ) : transactions.length === 0 ? (
            <div className="vault-empty-card" style={{ padding: "48px 24px" }}>
              <div className="vault-empty-icon">
                <FileText />
              </div>
              <h4 className="vault-empty-title">No transactions posted yet</h4>
              <p className="vault-empty-desc">
                Transactions on this account will be posted here as they are processed.
              </p>
            </div>
          ) : (
            <div className="vault-table-wrapper">
              <table className="vault-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Cryptographic Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isCredit =
                      tx.type === "DEPOSIT" ||
                      (tx.type === "TRANSFER" && tx.transferDirection === "INCOMING");
                    const amountFormatted = ((tx.amountPaise || 0) / 100).toFixed(2);
                    const balanceAfterFormatted = ((tx.balanceAfterPaise || 0) / 100).toFixed(2);

                    return (
                      <tr key={tx._id}>
                        <td style={{ color: "var(--vault-text-secondary)", fontSize: "12px" }}>
                          {formatStatementDate(tx.createdAt)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="vault-copy-pill"
                            title="Click to copy Transaction ID"
                            onClick={() => handleCopyId(tx._id)}
                          >
                            {copiedId === tx._id ? (
                              <Check size={11} color="var(--vault-success)" />
                            ) : (
                              <Copy size={11} />
                            )}
                            <span>{tx._id.slice(-6)}</span>
                          </button>
                        </td>
                        <td>
                          <span className={`vault-pill ${isCredit ? "active" : "pending"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{tx.description || "Ledger entry"}</td>
                        <td className={isCredit ? "vault-credit" : "vault-debit"}>
                          {isCredit ? `+ ₹${amountFormatted}` : `- ₹${amountFormatted}`}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          ₹{balanceAfterFormatted}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="vault-btn-secondary"
                            style={{ padding: "4px 9px", fontSize: "11px" }}
                            onClick={() => setActiveProofTxn(tx)}
                          >
                            <ShieldCheck size={13} />
                            <span>Verify Proof</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {pagination.totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderTop: "1px solid var(--vault-surface-border-subtle)",
                    fontSize: "12px",
                    color: "var(--vault-text-secondary)",
                  }}
                >
                  <span>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.totalTransactions} total entries)
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="vault-btn-secondary"
                      style={{ padding: "4px 8px" }}
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className="vault-btn-secondary"
                      style={{ padding: "4px 8px" }}
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <VaultProofModal
        isOpen={Boolean(activeProofTxn)}
        onClose={() => setActiveProofTxn(null)}
        transaction={activeProofTxn}
      />
    </VaultLayout>
  );
}
