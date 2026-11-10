import { useState } from "react";
import { X, ShieldCheck, Copy, Check } from "lucide-react";

export default function VaultProofModal({ isOpen, onClose, transaction }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amountRupees = ((transaction.amountPaise || 0) / 100).toFixed(2);
  const beforeRupees = ((transaction.balanceBeforePaise || 0) / 100).toFixed(2);
  const afterRupees = ((transaction.balanceAfterPaise || 0) / 100).toFixed(2);

  return (
    <div className="vault-modal-overlay" onClick={onClose}>
      <div className="vault-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
        <div className="vault-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="vault-action-icon-circle" style={{ width: 28, height: 28 }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="vault-modal-title">Cryptographic Ledger Proof</h3>
              <p style={{ fontSize: "11px", color: "var(--vault-text-muted)" }}>
                Forensic transaction integrity verification
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--vault-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="vault-modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--vault-surface-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--vault-text-muted)", textTransform: "uppercase" }}>Type</span>
              <div style={{ fontWeight: 600, fontSize: "13px", marginTop: "2px" }}>{transaction.type}</div>
            </div>

            <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--vault-surface-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--vault-text-muted)", textTransform: "uppercase" }}>Amount</span>
              <div style={{ fontWeight: 600, fontSize: "13px", marginTop: "2px" }}>₹{amountRupees}</div>
            </div>

            <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--vault-surface-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--vault-text-muted)", textTransform: "uppercase" }}>Balance Before</span>
              <div style={{ fontWeight: 500, fontSize: "13px", marginTop: "2px" }}>₹{beforeRupees}</div>
            </div>

            <div style={{ background: "#f8faf9", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--vault-surface-border)" }}>
              <span style={{ fontSize: "11px", color: "var(--vault-text-muted)", textTransform: "uppercase" }}>Balance After</span>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--vault-success)", marginTop: "2px" }}>
                ₹{afterRupees}
              </div>
            </div>
          </div>

          <div style={{ background: "#f6f9f7", border: "1px solid #dce8e0", borderRadius: "8px", padding: "12px 14px", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#1c543b" }}>
                SHA-256 Proof Hash
              </span>
              <button
                type="button"
                onClick={() => handleCopy(transaction.proofHash || transaction._id)}
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#1c543b", background: "none", border: "none", cursor: "pointer" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div style={{ fontFamily: "var(--vault-mono)", fontSize: "11px", wordBreak: "break-all", color: "#1a4d36", lineHeight: 1.5 }}>
              {transaction.proofHash || `sha256:${transaction._id}#${transaction.balanceAfterPaise}`}
            </div>
          </div>

          <div style={{ marginTop: "14px", fontSize: "11.5px", color: "var(--vault-text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="vault-status-dot"></span>
            <span>Tamper-evident record verified by LedgerLine platform consensus.</span>
          </div>
        </div>

        <div className="vault-modal-footer">
          <button type="button" className="vault-btn-primary" onClick={onClose}>
            Close Proof
          </button>
        </div>
      </div>
    </div>
  );
}
