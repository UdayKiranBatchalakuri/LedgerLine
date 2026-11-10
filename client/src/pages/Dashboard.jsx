import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  ShieldCheck,
  Copy,
  Check,
  CreditCard,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import VaultLayout from "../layouts/VaultLayout";
import VaultDepositModal from "../components/VaultDepositModal";
import VaultWithdrawModal from "../components/VaultWithdrawModal";
import VaultTransferModal from "../components/VaultTransferModal";
import VaultProofModal from "../components/VaultProofModal";
import { getAccounts } from "../services/accountService";
import { getTransactions } from "../services/transactionService";

function formatTxDate(dateStr) {
  if (!dateStr) return "Just now";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [activeProofTxn, setActiveProofTxn] = useState(null);

  const reloadData = async () => {
    try {
      setLoading(true);
      const accRes = await getAccounts();
      const accList = Array.isArray(accRes) ? accRes : accRes.accounts || [];
      setAccounts(accList);

      if (accList.length > 0) {
        const primaryAccount = accList[0];
        const txRes = await getTransactions(primaryAccount._id, { page: 1, limit: 5 });
        setTransactions(txRes.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to reload dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const accRes = await getAccounts();
        const accList = Array.isArray(accRes) ? accRes : accRes.accounts || [];
        if (!isMounted) return;
        setAccounts(accList);

        if (accList.length > 0) {
          const primaryAccount = accList[0];
          const txRes = await getTransactions(primaryAccount._id, { page: 1, limit: 5 });
          if (!isMounted) return;
          setTransactions(txRes.transactions || []);
        }
      } catch (err) {
        if (isMounted) console.error("Failed to load dashboard data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE").length;
  const totalBalancePaise = accounts.reduce((sum, a) => sum + (Number(a.balancePaise) || 0), 0);
  const totalBalanceRupees = (totalBalancePaise / 100).toFixed(2);

  const firstName = user?.name ? user.name.split(" ")[0].toLowerCase() : "uday";

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Overview" }]}>
      {/* --------------------------------------------------------------------
          HERO BANNER (Page 4 Screenshot)
          -------------------------------------------------------------------- */}
      <section className="vault-hero-card">
        <div className="vault-hero-left">
          <div className="vault-hero-kicker">
            <span className="vault-pill-dot"></span>
            <span>YOUR FINANCIAL OVERVIEW</span>
          </div>

          <h1 className="vault-hero-headline">
            Good to see you, <em>{firstName}</em>
          </h1>

          <p className="vault-hero-subtext">
            Everything in its place. Here's your account overview.
          </p>

          <div className="vault-hero-tags">
            <span className="vault-hero-pill">
              <span className="vault-pill-dot"></span>
              <span>Account holder</span>
            </span>
            <span className="vault-hero-pill">Private workspace</span>
          </div>
        </div>

        <div className="vault-dial-widget">
          <div className="vault-dial-outer">
            <div className="vault-dial-inner">
              <span className="vault-dial-letter">L</span>
            </div>
          </div>
          <span className="vault-dial-pagination">01 / 02</span>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          ACCOUNT OVERVIEW METRICS SECTION
          -------------------------------------------------------------------- */}
      <div className="vault-section-header">
        <span className="vault-section-title">Account overview</span>
        <Link to="/accounts" className="vault-section-link">
          <span>All accounts</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="vault-metrics-grid">
        <div className="vault-metric-card">
          <div className="vault-metric-top">
            <div className="vault-metric-icon-box">
              <CreditCard />
            </div>
            <span className="vault-metric-label">Total accounts</span>
          </div>
          <div className="vault-metric-value">
            {totalAccounts < 10 ? `0${totalAccounts}` : totalAccounts}
          </div>
          <span className="vault-metric-subtext">Accounts connected</span>
        </div>

        <div className="vault-metric-card">
          <div className="vault-metric-top">
            <div className="vault-metric-icon-box">
              <ShieldCheck />
            </div>
            <span className="vault-metric-label">Account status</span>
          </div>
          <div className="vault-metric-value" style={{ fontSize: "20px" }}>
            {activeAccounts > 0 ? "Active" : "No accounts"}
          </div>
          <span className="vault-metric-subtext">{activeAccounts} active accounts</span>
        </div>

        <div className="vault-metric-card">
          <div className="vault-metric-top">
            <div className="vault-metric-icon-box">
              <Wallet />
            </div>
            <span className="vault-metric-label">Total Balance</span>
          </div>
          <div className="vault-metric-value" style={{ color: "var(--vault-primary)" }}>
            ₹{totalBalanceRupees}
          </div>
          <span className="vault-metric-subtext">System reserve snapshot</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          TWO-COLUMN SECTION: YOUR ACCOUNTS + QUICK ACTIONS
          -------------------------------------------------------------------- */}
      <div className="vault-two-columns">
        {/* Left Column: Your accounts */}
        <div className="vault-panel">
          <div className="vault-panel-header">
            <div className="vault-panel-title">
              <span>Your accounts</span>
              <ArrowRight size={13} style={{ opacity: 0.6 }} />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--vault-text-muted)", fontSize: "13px" }}>
              Loading account information...
            </div>
          ) : accounts.length === 0 ? (
            <div className="vault-empty-card" style={{ padding: "32px 16px" }}>
              <div className="vault-empty-icon">
                <CreditCard />
              </div>
              <h4 className="vault-empty-title">No accounts yet</h4>
              <p className="vault-empty-desc">
                Customer accounts will be opened after administrator reviews your request.
              </p>
              <Link to="/account-request" className="vault-btn-secondary">
                Request an account
              </Link>
            </div>
          ) : (
            <div>
              {accounts.map((acc) => (
                <div key={acc._id} className="vault-account-card">
                  <div className="vault-account-header">
                    <span className="vault-account-type">{acc.accountType || acc.type} ACCOUNT</span>
                    <button
                      type="button"
                      className="vault-copy-pill"
                      title="Click to copy account ID"
                      onClick={() => handleCopyId(acc._id)}
                    >
                      {copiedId === acc._id ? <Check size={11} color="var(--vault-success)" /> : <Copy size={11} />}
                      <span>ID: {acc._id.slice(-6)}</span>
                    </button>
                  </div>

                  <div className="vault-account-balance">
                    ₹{((acc.balancePaise || 0) / 100).toFixed(2)}
                  </div>

                  <div className="vault-account-footer">
                    <span className={`vault-pill ${acc.status.toLowerCase()}`}>
                      ● {acc.status}
                    </span>
                    <Link
                      to={`/statements?account=${acc._id}`}
                      style={{ color: "var(--vault-text-secondary)", fontSize: "11.5px", fontWeight: 500, textDecoration: "none" }}
                    >
                      View statement →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions */}
        <div className="vault-panel">
          <div className="vault-panel-header">
            <div>
              <div className="vault-panel-eyebrow">ON YOUR TERMS</div>
              <div className="vault-panel-title" style={{ marginTop: "2px" }}>Quick actions</div>
            </div>
          </div>

          <div className="vault-quick-actions-grid">
            {/* Deposit */}
            <button
              type="button"
              className="vault-quick-action-card"
              onClick={() => {
                if (accounts.length === 0) {
                  alert("Please request or create an account first.");
                  return;
                }
                setIsDepositOpen(true);
              }}
            >
              <div className="vault-action-icon-circle">
                <ArrowDownLeft />
              </div>
              <div className="vault-action-title">Deposit</div>
              <div className="vault-action-sub">Add funds</div>
            </button>

            {/* Withdraw */}
            <button
              type="button"
              className="vault-quick-action-card"
              onClick={() => {
                if (accounts.length === 0) {
                  alert("Please request or create an account first.");
                  return;
                }
                setIsWithdrawOpen(true);
              }}
            >
              <div className="vault-action-icon-circle">
                <ArrowUpRight />
              </div>
              <div className="vault-action-title">Withdraw</div>
              <div className="vault-action-sub">Liquidate</div>
            </button>

            {/* Transfer */}
            <button
              type="button"
              className="vault-quick-action-card"
              onClick={() => {
                if (accounts.length === 0) {
                  alert("Please request or create an account first.");
                  return;
                }
                setIsTransferOpen(true);
              }}
            >
              <div className="vault-action-icon-circle">
                <ArrowRightLeft />
              </div>
              <div className="vault-action-title">Transfer</div>
              <div className="vault-action-sub">Between accounts</div>
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          BOTTOM SECTION: TRANSACTION ACTIVITY
          -------------------------------------------------------------------- */}
      <div className="vault-view-kicker">LEDGER</div>
      <div className="vault-section-header" style={{ marginBottom: "16px" }}>
        <h3 className="vault-section-title">Transaction activity</h3>
        <Link to="/statements" className="vault-section-link">
          <span>View all statements</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--vault-text-muted)" }}>
          Loading ledger entries...
        </div>
      ) : accounts.length === 0 || transactions.length === 0 ? (
        <div className="vault-empty-card">
          <div className="vault-empty-icon">
            <Activity />
          </div>
          <h4 className="vault-empty-title">No accounts available</h4>
          <p className="vault-empty-desc">
            Account activity will appear when you have open accounts.
          </p>
        </div>
      ) : (
        <div className="vault-table-wrapper">
          <table className="vault-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Integrity</th>
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
                      {formatTxDate(tx.createdAt)}
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
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>₹{balanceAfterFormatted}</td>
                    <td>
                      <button
                        type="button"
                        className="vault-btn-secondary"
                        style={{ padding: "4px 9px", fontSize: "11px" }}
                        onClick={() => setActiveProofTxn(tx)}
                      >
                        <ShieldCheck size={13} />
                        <span>Proof</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modals */}
      <VaultDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        accounts={accounts}
        onSuccess={reloadData}
      />
      <VaultWithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        accounts={accounts}
        onSuccess={reloadData}
      />
      <VaultTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        onSuccess={reloadData}
      />
      <VaultProofModal
        isOpen={Boolean(activeProofTxn)}
        onClose={() => setActiveProofTxn(null)}
        transaction={activeProofTxn}
      />
    </VaultLayout>
  );
}
