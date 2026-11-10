import { useState } from "react";
import { X, ArrowRightLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { transferMoney } from "../services/transactionService";

export default function VaultTransferModal({ isOpen, onClose, accounts, onSuccess }) {
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?._id || "");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [rupees, setRupees] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a._id === (sourceAccountId || accounts[0]?._id));
  const currentBalanceRupees = currentAccount ? currentAccount.balancePaise / 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const targetDest = destinationAccountId.trim();
    if (!targetDest) {
      setError("Please provide a valid 24-character destination Account Document ID.");
      return;
    }

    if (targetDest === (sourceAccountId || accounts[0]?._id)) {
      setError("Source and destination accounts cannot be identical.");
      return;
    }

    const amountNum = parseFloat(rupees);
    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid positive transfer amount.");
      return;
    }

    if (amountNum > currentBalanceRupees) {
      setError(`Insufficient balance. Maximum transferable: ₹${currentBalanceRupees.toFixed(2)}`);
      return;
    }

    const amountPaise = Math.round(amountNum * 100);
    const idempotencyKey = "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

    try {
      setLoading(true);
      await transferMoney({
        sourceAccountId: sourceAccountId || accounts[0]?._id,
        destinationAccountId: targetDest,
        amountPaise,
        description: description || "Vault Peer Transfer",
        idempotencyKey,
      });

      setSuccess(`Transferred ₹${amountNum.toFixed(2)} atomically`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Fund transfer failed.");
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
              <ArrowRightLeft size={16} />
            </div>
            <h3 className="vault-modal-title">Transfer Funds</h3>
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
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
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
              <label className="vault-label">Destination Account ID (24 hex characters)</label>
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
                  <span style={{ fontSize: "10.5px", color: "var(--vault-text-muted)" }}>Your other accounts:</span>
                  {accounts
                    .filter((a) => a._id !== (sourceAccountId || accounts[0]?._id))
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
                placeholder="e.g. Settlement, monthly rent"
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
              {loading ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
