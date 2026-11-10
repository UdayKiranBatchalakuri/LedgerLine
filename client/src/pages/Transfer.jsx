import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import VaultLayout from "../layouts/VaultLayout";
import { getAccounts } from "../services/accountService";
import { transferMoney } from "../services/transactionService";

export default function Transfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [sourceAccountId, setSourceAccountId] = useState(searchParams.get("source") || "");
  const [destinationAccountId, setDestinationAccountId] = useState(searchParams.get("dest") || "");
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
          const paramSourceId = searchParams.get("source");
          if (paramSourceId && activeAccounts.some((a) => a._id === paramSourceId)) {
            setSourceAccountId(paramSourceId);
          } else if (activeAccounts.length > 0) {
            setSourceAccountId(activeAccounts[0]._id);
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

  const selectedSourceAccount = accounts.find((a) => a._id === sourceAccountId);
  const maxAvailableRupees = selectedSourceAccount ? selectedSourceAccount.balancePaise / 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetDest = destinationAccountId.trim();
    if (!targetDest) {
      setError("Please provide a valid destination Account Document ID.");
      return;
    }

    if (targetDest === sourceAccountId) {
      setError("Source and destination accounts cannot be identical.");
      return;
    }

    const parsedRupees = parseFloat(amount);
    if (!parsedRupees || parsedRupees <= 0) {
      setError("Please enter a valid positive transfer amount.");
      return;
    }

    if (parsedRupees > maxAvailableRupees) {
      setError(`Insufficient balance. Maximum available: ₹${maxAvailableRupees.toFixed(2)}`);
      return;
    }

    const amountPaise = Math.round(parsedRupees * 100);
    const idempotencyKey = "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

    try {
      setSubmitting(true);
      await transferMoney({
        sourceAccountId,
        destinationAccountId: targetDest,
        amountPaise,
        description: description || "Vault Peer Transfer",
        idempotencyKey,
      });

      setSuccess(`Successfully transferred ₹${parsedRupees.toFixed(2)}.`);
      setTimeout(() => navigate("/dashboard"), 1400);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Fund transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Transfer" }]}>
      <div className="vault-view-header">
        <div className="vault-view-kicker">FINANCIAL MOVEMENT</div>
        <h1 className="vault-view-title">Transfer funds</h1>
        <p className="vault-view-subtitle">Atomic balance movement with double-entry cryptographic verification.</p>
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
            <p className="vault-empty-desc">You need at least one active account to transfer funds.</p>
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
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountType || acc.type} Account (₹{((acc.balancePaise || 0) / 100).toFixed(2)}) — ...{acc.accountNumber ? acc.accountNumber.slice(-6) : acc._id.slice(-6)}
                  </option>
                ))}
              </select>
              {selectedSourceAccount && (
                <div style={{ fontSize: "11.5px", color: "var(--vault-text-muted)", marginTop: "4px" }}>
                  Available balance: <strong>₹{maxAvailableRupees.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div className="vault-form-field">
              <label className="vault-label">Destination Account Document ID (24 hex characters)</label>
              <input
                type="text"
                placeholder="e.g. 660dfb5b5c90b6cfa4c4091a"
                className="vault-input"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                required
              />
              {accounts.length > 1 && (
                <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: "var(--vault-text-muted)" }}>Your other accounts:</span>
                  {accounts
                    .filter((a) => a._id !== sourceAccountId)
                    .map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => setDestinationAccountId(a._id)}
                        style={{ fontSize: "10.5px", background: "#f0f4f2", color: "var(--vault-primary)", padding: "2px 6px", borderRadius: "4px", border: "1px solid #d8e4de", cursor: "pointer" }}
                      >
                        {a.type} (...{a._id.slice(-6)})
                      </button>
                    ))}
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
                placeholder="e.g. Supplier payment, reimbursement"
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
                {submitting ? "Processing..." : "Complete Transfer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </VaultLayout>
  );
}
