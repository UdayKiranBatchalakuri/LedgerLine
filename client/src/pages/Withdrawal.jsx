import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import VaultLayout from "../layouts/VaultLayout";
import { getAccounts } from "../services/accountService";
import { withdrawMoney } from "../services/transactionService";

export default function Withdrawal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(searchParams.get("account") || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getAccounts();
        const accountList = Array.isArray(response) ? response : response.accounts || [];
        const activeAccounts = accountList.filter((account) => account.status === "ACTIVE");

        if (isMounted) {
          setAccounts(activeAccounts);
          const paramAccId = searchParams.get("account");
          if (paramAccId && activeAccounts.some((a) => a._id === paramAccId)) {
            setAccountId(paramAccId);
          } else if (activeAccounts.length > 0) {
            setAccountId(activeAccounts[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load accounts.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAccounts();
    return () => { isMounted = false; };
  }, [searchParams]);

  const selectedAccount = accounts.find((a) => a._id === accountId);
  const maxAvailableRupees = selectedAccount ? selectedAccount.balancePaise / 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsedRupees = parseFloat(amount);
    if (!parsedRupees || parsedRupees <= 0) {
      setError("Please enter a valid positive withdrawal amount.");
      return;
    }

    if (parsedRupees > maxAvailableRupees) {
      setError(`Insufficient balance. Maximum available: ₹${maxAvailableRupees.toFixed(2)}`);
      return;
    }

    const amountPaise = Math.round(parsedRupees * 100);
    const idempotencyKey = "wd_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

    try {
      setSubmitting(true);
      await withdrawMoney({
        accountId,
        amountPaise,
        description: description || "Vault Liquidation",
        idempotencyKey,
      });

      setSuccess(`Successfully liquidated ₹${parsedRupees.toFixed(2)}.`);
      setTimeout(() => navigate("/dashboard"), 1400);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Withdrawal transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Withdrawal" }]}>
      <div className="vault-view-header">
        <div className="vault-view-kicker">FINANCIAL MOVEMENT</div>
        <h1 className="vault-view-title">Withdraw funds</h1>
        <p className="vault-view-subtitle">Liquidate funds from your account with guaranteed balance checks.</p>
      </div>

      <div className="vault-form-box" style={{ maxWidth: "600px" }}>
        {error && (
          <div style={{ background: "var(--vault-danger-bg)", color: "var(--vault-danger)", border: "1px solid var(--vault-danger-border)", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: "var(--vault-success-bg)", color: "var(--vault-success)", border: "1px solid var(--vault-success-border)", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--vault-text-muted)" }}>
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="vault-empty-card" style={{ padding: "30px 16px" }}>
            <h4 className="vault-empty-title">No Active Accounts</h4>
            <p className="vault-empty-desc">You need at least one active account to withdraw funds.</p>
            <Link to="/account-request" className="vault-btn-primary">
              Request an account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="vault-form-field">
              <label className="vault-label">Source Account</label>
              <select
                className="vault-select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountType || acc.type} Account (₹{((acc.balancePaise || 0) / 100).toFixed(2)}) — ...{acc.accountNumber ? acc.accountNumber.slice(-6) : acc._id.slice(-6)}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <div style={{ fontSize: "11.5px", color: "var(--vault-text-muted)", marginTop: "4px" }}>
                  Available balance: <strong>₹{maxAvailableRupees.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div className="vault-form-field">
              <label className="vault-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAvailableRupees}
                placeholder="0.00"
                className="vault-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="vault-form-field" style={{ marginBottom: "26px" }}>
              <label className="vault-label">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Living expense, ATM cash"
                className="vault-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Link to="/dashboard" className="vault-btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="vault-btn-primary" disabled={submitting}>
                {submitting ? "Processing..." : "Complete Withdrawal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </VaultLayout>
  );
}
