import { useState } from "react";
import { X, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import { withdrawMoney } from "../services/transactionService";

export default function VaultWithdrawModal({ isOpen, onClose, accounts, onSuccess }) {
  const [accountId, setAccountId] = useState(accounts[0]?._id || "");
  const [rupees, setRupees] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a._id === (accountId || accounts[0]?._id));
  const currentBalanceRupees = currentAccount ? currentAccount.balancePaise / 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const amountNum = parseFloat(rupees);
    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid positive withdrawal amount.");
      return;
    }

    if (amountNum > currentBalanceRupees) {
      setError(`Insufficient balance. Maximum available: ₹${currentBalanceRupees.toFixed(2)}`);
      return;
    }

    const amountPaise = Math.round(amountNum * 100);
    const idempotencyKey = "wd_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

    try {
      setLoading(true);
      await withdrawMoney({
        accountId: accountId || accounts[0]?._id,
        amountPaise,
        description: description || "Vault Liquidation",
        idempotencyKey,
      });

      setSuccess(`Successfully liquidated ₹${amountNum.toFixed(2)}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Withdrawal transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vault-modal-overlay" onClick={onClose}>
      <div className="vault-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="vault-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="vault-action-icon-circle" style={{ width: 28, height: 28 }}>
              <ArrowUpRight size={16} />
            </div>
            <h3 className="vault-modal-title">Withdraw Funds</h3>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--vault-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="vault-modal-body">
            {error && (
              <div style={{ background: "var(--vault-danger-bg)", color: "var(--vault-danger)", border: "1px solid var(--vault-danger-border)", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ background: "var(--vault-success-bg)", color: "var(--vault-success)", border: "1px solid var(--vault-success-border)", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <div className="vault-form-field">
              <label className="vault-label">Source Account</label>
              <select
                className="vault-select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountType || acc.type} Account — ₹{(acc.balancePaise / 100).toFixed(2)} (...{acc.accountNumber ? acc.accountNumber.slice(-6) : acc._id.slice(-6)})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: "11.5px", color: "var(--vault-text-muted)", marginTop: "4px" }}>
                Available balance: <strong>₹{currentBalanceRupees.toFixed(2)}</strong>
              </div>
            </div>

            <div className="vault-form-field">
              <label className="vault-label">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalanceRupees}
                placeholder="0.00"
                className="vault-input"
                value={rupees}
                onChange={(e) => setRupees(e.target.value)}
                required
              />
            </div>

            <div className="vault-form-field">
              <label className="vault-label">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Living expense, ATM cash"
                className="vault-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="vault-modal-footer">
            <button type="button" className="vault-btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="vault-btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
