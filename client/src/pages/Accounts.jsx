import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Copy,
  Check,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import VaultLayout from "../layouts/VaultLayout";
import VaultDepositModal from "../components/VaultDepositModal";
import VaultWithdrawModal from "../components/VaultWithdrawModal";
import VaultTransferModal from "../components/VaultTransferModal";
import { getAccounts } from "../services/accountService";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const refreshAccounts = async () => {
    try {
      setLoading(true);
      const res = await getAccounts();
      const list = Array.isArray(res) ? res : res.accounts || [];
      setAccounts(list);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAccounts()
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res.accounts || [];
          setAccounts(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to fetch accounts", err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const accountCountText = `${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`;

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Accounts" }]}>
      {/* --------------------------------------------------------------------
          PAGE HEADER (Page 1 Screenshot)
          -------------------------------------------------------------------- */}
      <div className="vault-view-header">
        <div className="vault-view-header-row">
          <div>
            <div className="vault-view-kicker">YOUR SPACE</div>
            <h1 className="vault-view-title">Accounts</h1>
            <p className="vault-view-subtitle">Accounts available to your profile.</p>
          </div>
          <div className="vault-badge-counter">{accountCountText}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "var(--vault-text-muted)" }}>
          Loading your accounts...
        </div>
      ) : accounts.length === 0 ? (
        /* Empty State matching Page 1 screenshot */
        <div className="vault-empty-card" style={{ padding: "64px 24px" }}>
          <div className="vault-empty-icon">
            <CreditCard />
          </div>
          <h3 className="vault-empty-title">No accounts available</h3>
          <p className="vault-empty-desc">Accounts available for review will appear here.</p>
          <Link to="/account-request" className="vault-btn-secondary">
            Request an account for review
          </Link>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
            <Link to="/account-request" className="vault-btn-primary">
              <PlusCircle size={15} />
              <span>Request new account</span>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {accounts.map((acc) => {
              const balanceRupees = ((acc.balancePaise || 0) / 100).toFixed(2);
              const isFrozen = acc.status === "FROZEN";
              const isClosed = acc.status === "CLOSED";

              return (
                <div key={acc._id} className="vault-account-card" style={{ padding: "22px" }}>
                  <div className="vault-account-header">
                    <span className="vault-account-type">{acc.accountType || acc.type} ACCOUNT</span>
                    <button
                      type="button"
                      className="vault-copy-pill"
                      title="Copy Account ID"
                      onClick={() => handleCopyId(acc._id)}
                    >
                      {copiedId === acc._id ? (
                        <Check size={11} color="var(--vault-success)" />
                      ) : (
                        <Copy size={11} />
                      )}
                      <span>ID: {acc._id.slice(-8)}</span>
                    </button>
                  </div>

                  <div className="vault-account-balance" style={{ fontSize: "28px", margin: "14px 0" }}>
                    ₹{balanceRupees}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span className={`vault-pill ${acc.status.toLowerCase()}`}>
                      ● {acc.status}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--vault-text-muted)" }}>
                      Currency: INR (Paise)
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--vault-surface-border-subtle)",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="vault-btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "11.5px" }}
                      disabled={isFrozen || isClosed}
                      onClick={() => setIsDepositOpen(true)}
                    >
                      <ArrowDownLeft size={13} />
                      <span>Deposit</span>
                    </button>

                    <button
                      type="button"
                      className="vault-btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "11.5px" }}
                      disabled={isFrozen || isClosed}
                      onClick={() => setIsWithdrawOpen(true)}
                    >
                      <ArrowUpRight size={13} />
                      <span>Withdraw</span>
                    </button>

                    <button
                      type="button"
                      className="vault-btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "11.5px" }}
                      disabled={isFrozen || isClosed}
                      onClick={() => setIsTransferOpen(true)}
                    >
                      <ArrowRightLeft size={13} />
                      <span>Transfer</span>
                    </button>

                    <Link
                      to={`/statements?account=${acc._id}`}
                      className="vault-btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "11.5px", marginLeft: "auto" }}
                    >
                      <FileText size={13} />
                      <span>Statements</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Modals */}
      <VaultDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        accounts={accounts}
        onSuccess={refreshAccounts}
      />
      <VaultWithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        accounts={accounts}
        onSuccess={refreshAccounts}
      />
      <VaultTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        onSuccess={refreshAccounts}
      />
    </VaultLayout>
  );
}
