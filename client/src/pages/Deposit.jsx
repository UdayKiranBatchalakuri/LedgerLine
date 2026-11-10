import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import VaultLayout from "../layouts/VaultLayout";
import { getAccounts } from "../services/accountService";
import { depositMoney } from "../services/transactionService";

export default function Deposit() {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsedRupees = parseFloat(amount);
    if (!parsedRupees || parsedRupees <= 0) {
      setError("Please enter a valid positive deposit amount.");
      return;
    }

    const amountPaise = Math.round(parsedRupees * 100);
    const idempotencyKey = "dep_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

    try {
      setSubmitting(true);
      await depositMoney({
        accountId,
        amountPaise,
        description: description || "Vault Deposit",
        idempotencyKey,
      });

      setSuccess(`Successfully deposited ₹${parsedRupees.toFixed(2)}.`);
      setTimeout(() => navigate("/dashboard"), 1400);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Deposit transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a._id === accountId);

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Deposit" }]}>
      <div className="vault-view-header">
        <div className="vault-view-kicker">FINANCIAL MOVEMENT</div>
        <h1 className="vault-view-title">Deposit funds</h1>
        <p className="vault-view-subtitle">Credit funds securely into an active account ledger.</p>
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
            <p className="vault-empty-desc">You need at least one active account to make a deposit.</p>
            <Link to="/account-request" className="vault-btn-primary">
              Request an account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="vault-form-field">
              <label className="vault-label">Destination Account</label>
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
                  Current balance: ₹{((selectedAccount.balancePaise || 0) / 100).toFixed(2)}
                </div>
              )}
            </div>

            <div className="vault-form-field">
              <label className="vault-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
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
                placeholder="e.g. Consulting payout, initial funding"
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
                {submitting ? "Processing..." : "Complete Deposit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </VaultLayout>
  );
}
