import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import VaultLayout from "../layouts/VaultLayout";
import { createAccount, getAccounts } from "../services/accountService";

function formatRequestDate(dateStr) {
  if (!dateStr) return "Just now";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountRequest() {
  const [accountType, setAccountType] = useState("SAVINGS");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(true);

  const refreshRequests = async () => {
    try {
      setFetching(true);
      const res = await getAccounts();
      const list = Array.isArray(res) ? res : res.accounts || [];
      setRequests(list);
    } catch (err) {
      console.error("Failed to load account requests", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    let active = true;
    getAccounts()
      .then((res) => {
        if (active) {
          const list = Array.isArray(res) ? res : res.accounts || [];
          setRequests(list);
          setFetching(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load requests", err);
          setFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      await createAccount({ type: accountType });
      setMessage(`Your ${accountType === "SAVINGS" ? "Personal" : "Business"} account has been approved and activated in the ledger.`);
      await refreshRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit account request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VaultLayout breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Account request" }]}>
      {/* --------------------------------------------------------------------
          PAGE HEADER (Page 3 Screenshot)
          -------------------------------------------------------------------- */}
      <div className="vault-view-header">
        <div className="vault-view-header-row">
          <div>
            <div className="vault-view-kicker">ONBOARDING</div>
            <h1 className="vault-view-title">Account request</h1>
            <p className="vault-view-subtitle">Customer accounts are opened after administrator review.</p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          FORM CARD (Page 3 Screenshot)
          -------------------------------------------------------------------- */}
      <div className="vault-form-box">
        {message && (
          <div
            style={{
              background: "var(--vault-success-bg)",
              color: "var(--vault-success)",
              border: "1px solid var(--vault-success-border)",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "var(--vault-danger-bg)",
              color: "var(--vault-danger)",
              border: "1px solid var(--vault-danger-border)",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="vault-form-field" style={{ marginBottom: "22px" }}>
            <label className="vault-label">Requested account type</label>
            <select
              className="vault-select"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="SAVINGS">Personal</option>
              <option value="CURRENT">Business</option>
            </select>
          </div>

          <button
            type="submit"
            className="vault-btn-primary"
            style={{ width: "100%", padding: "12px", borderRadius: "10px", fontSize: "14px" }}
            disabled={loading}
          >
            {loading ? "Submitting request..." : "Submit request"}
          </button>
        </form>
      </div>

      {/* --------------------------------------------------------------------
          YOUR REQUESTS TABLE (Page 3 Screenshot)
          -------------------------------------------------------------------- */}
      <div className="vault-section-header" style={{ marginTop: "32px", marginBottom: "16px" }}>
        <h3 className="vault-section-title">Your requests</h3>
      </div>

      {fetching ? (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--vault-text-muted)" }}>
          Loading your request history...
        </div>
      ) : requests.length === 0 ? (
        <div className="vault-empty-card" style={{ padding: "36px 20px" }}>
          <Clock size={24} color="var(--vault-text-muted)" style={{ marginBottom: "10px" }} />
          <h4 className="vault-empty-title">No account requests yet</h4>
          <p className="vault-empty-desc">
            Submitted account requests and approved accounts will be listed here.
          </p>
        </div>
      ) : (
        <div className="vault-table-wrapper">
          <table className="vault-table">
            <thead>
              <tr>
                <th>Account Type</th>
                <th>Status</th>
                <th>Requested Date</th>
                <th>Review Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td style={{ fontWeight: 600 }}>
                    {(req.accountType || req.type) === "SAVINGS" ? "PERSONAL" : "BUSINESS"} account
                  </td>
                  <td>
                    <span className={`vault-pill ${req.status.toLowerCase()}`}>
                      ● {req.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--vault-text-secondary)", fontSize: "12px" }}>
                    {formatRequestDate(req.createdAt)}
                  </td>
                  <td style={{ color: "var(--vault-text-secondary)", fontSize: "12.5px" }}>
                    Reviewed by administrator
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VaultLayout>
  );
}
