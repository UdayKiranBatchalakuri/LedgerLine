
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Wallet,
  ArrowLeft,
  ArrowLeftRight,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import { getAccounts } from "../services/accountService";
import { transferMoney } from "../services/transactionService";

function Transfer() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [sourceAccountId, setSourceAccountId] = useState(searchParams.get("account") || "");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the sender's accounts
  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAccounts();

        const accountList = Array.isArray(response)
          ? response
          : response.accounts || [];

        const activeAccounts = accountList.filter(
          (account) => account.status === "ACTIVE"
        );

        if (isMounted) {
          setAccounts(activeAccounts);

          const paramAccId = searchParams.get("account");
          if (paramAccId && activeAccounts.some((a) => a._id === paramAccId)) {
            setSourceAccountId(paramAccId);
          } else if (activeAccounts.length > 0) {
            setSourceAccountId(activeAccounts[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load your accounts."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const formatCurrency = (paise) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format((Number(paise) || 0) / 100);

  const selectedAccount = accounts.find(
    (account) => account._id === sourceAccountId
  );

  const handleTransfer = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!sourceAccountId) {
      setError("Please select your source account.");
      return;
    }

    const destinationId = destinationAccountId.trim();

    if (!destinationId) {
      setError("Please enter the recipient account ID.");
      return;
    }

    if (destinationId === sourceAccountId) {
      setError("You cannot transfer money to the same account.");
      return;
    }

    const amountInRupees = Number(amount);

    if (
      !Number.isFinite(amountInRupees) ||
      amountInRupees <= 0
    ) {
      setError("Please enter a valid transfer amount.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("Amount can have a maximum of 2 decimal places.");
      return;
    }

    const amountPaise = Math.round(amountInRupees * 100);

    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0
    ) {
      setError("Please enter a valid transfer amount.");
      return;
    }

    if (
      amountPaise > Number(selectedAccount?.balancePaise || 0)
    ) {
      setError("Insufficient account balance.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await transferMoney({
        sourceAccountId,
        destinationAccountId: destinationId,
        amountPaise,
        description: description.trim(),
        idempotencyKey: crypto.randomUUID(),
      });

      setSuccess(
        result.message || "Transfer completed successfully."
      );

      setAmount("");
      setDescription("");
      setDestinationAccountId("");

      // Refresh sender's account balances
      const response = await getAccounts();

      const accountList = Array.isArray(response)
        ? response
        : response.accounts || [];

      const activeAccounts = accountList.filter(
        (account) => account.status === "ACTIVE"
      );

      setAccounts(activeAccounts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Transfer failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link
          to="/dashboard"
          className="brand-logo dashboard-logo"
          style={{ textDecoration: "none" }}
        >
          <Wallet size={27} />
          <span>LedgerLine</span>
        </Link>

        <div className="dashboard-user">
          <div className="user-details">
            <strong>{user?.name}</strong>
            <span>{user?.role?.replaceAll("_", " ")}</span>
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <Link
          to="/dashboard"
          className="dashboard-action-button"
          style={{
            display: "inline-flex",
            textDecoration: "none",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <div className="dashboard-welcome">
          <div>
            <span className="eyebrow">MONEY MANAGEMENT</span>
            <h1>Transfer Money</h1>
            <p>Send money to another LedgerLine account.</p>
          </div>

          <div className="secure-indicator">
            <ShieldCheck size={19} />
            Secure transaction
          </div>
        </div>

        <div
          className="dashboard-card"
          style={{
            maxWidth: "650px",
            margin: "30px auto",
            padding: "30px",
          }}
        >
          <div className="card-icon">
            <ArrowLeftRight size={25} />
          </div>

          <h2>Transfer Details</h2>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div
              className="success-message"
              role="status"
              style={{ marginBottom: "20px" }}
            >
              {success}
            </div>
          )}

          {loading ? (
            <p>Loading your accounts...</p>
          ) : accounts.length === 0 ? (
            <p>No active source accounts found.</p>
          ) : (
            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="sourceAccountId">
                  From Account
                </label>

                <select
                  id="sourceAccountId"
                  value={sourceAccountId}
                  onChange={(event) =>
                    setSourceAccountId(event.target.value)
                  }
                  required
                  disabled={submitting}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                  }}
                >
                  {accounts.map((account) => (
                    <option
                      key={account._id}
                      value={account._id}
                    >
                      {account.accountType} - {account.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccount && (
                <div style={{ marginBottom: "20px" }}>
                  <p>
                    Available balance:{" "}
                    <strong>
                      {formatCurrency(selectedAccount.balancePaise)}
                    </strong>
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="destinationAccountId">
                  Recipient Account ID
                </label>

                <input
                  id="destinationAccountId"
                  type="text"
                  placeholder="Enter recipient MongoDB account ID"
                  value={destinationAccountId}
                  onChange={(event) =>
                    setDestinationAccountId(event.target.value)
                  }
                  required
                  disabled={submitting}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                  }}
                />

                <small>
                  Enter the recipient's account document ID.
                </small>

                {accounts.filter((a) => a._id !== sourceAccountId).length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Quick select your account:</span>
                    {accounts
                      .filter((a) => a._id !== sourceAccountId)
                      .map((otherAcc) => (
                        <button
                          key={otherAcc._id}
                          type="button"
                          onClick={() => setDestinationAccountId(otherAcc._id)}
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            cursor: "pointer",
                            color: "#0f172a",
                            fontWeight: 500,
                          }}
                        >
                          {otherAcc.accountType} ({otherAcc.accountNumber.slice(-4)})
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="amount">
                  Transfer Amount (₹)
                </label>

                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  required
                  disabled={submitting}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label htmlFor="description">
                  Description (Optional)
                </label>

                <input
                  id="description"
                  type="text"
                  maxLength={200}
                  placeholder="Enter transfer description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  disabled={submitting}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                  }}
                />
              </div>

              <button
                type="submit"
                className="dashboard-action-button"
                disabled={submitting || !sourceAccountId}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  cursor: submitting ? "wait" : "pointer",
                }}
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight size={18} />
                    Confirm Transfer
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default Transfer;
