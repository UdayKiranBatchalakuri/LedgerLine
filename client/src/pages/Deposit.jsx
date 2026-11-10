
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Wallet,
  ArrowLeft,
  ArrowDownLeft,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import { getAccounts } from "../services/accountService";
import { depositMoney } from "../services/transactionService";

function Deposit() {
  const { user, logout } = useAuth();
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

  // Load the user's accounts
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
            setAccountId(paramAccId);
          } else if (activeAccounts.length > 0) {
            setAccountId(activeAccounts[0]._id);
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
    (account) => account._id === accountId
  );

  // Submit deposit
  const handleDeposit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const amountInRupees = Number(amount);

    if (!accountId) {
      setError("Please select an account.");
      return;
    }

    if (
      !Number.isFinite(amountInRupees) ||
      amountInRupees <= 0
    ) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(amount.trim())
    ) {
      setError("Amount can have a maximum of 2 decimal places.");
      return;
    }

    const amountPaise = Math.round(amountInRupees * 100);

    if (
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0
    ) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    try {
      setSubmitting(true);

      const idempotencyKey = crypto.randomUUID();

      await depositMoney({
        accountId,
        amountPaise,
        description: description.trim(),
        idempotencyKey,
      });

      setSuccess(
        `Deposit of ${formatCurrency(amountPaise)} completed successfully.`
      );

      setAmount("");
      setDescription("");

      // Refresh account balances
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
          "Deposit failed. Please try again."
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
            <h1>Deposit Money</h1>
            <p>Add money to your LedgerLine account.</p>
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
            <ArrowDownLeft size={25} />
          </div>

          <h2>Deposit Details</h2>

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
            <p>
              No active accounts found. Please contact the
              administrator.
            </p>
          ) : (
            <form onSubmit={handleDeposit}>
              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="accountId">
                  Select Account
                </label>

                <select
                  id="accountId"
                  value={accountId}
                  onChange={(event) =>
                    setAccountId(event.target.value)
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
                    Current balance:{" "}
                    <strong>
                      {formatCurrency(selectedAccount.balancePaise)}
                    </strong>
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label htmlFor="amount">
                  Deposit Amount (₹)
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
                  placeholder="Enter deposit description"
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
                disabled={submitting || !accountId}
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
                    <ArrowDownLeft size={18} />
                    Confirm Deposit
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

export default Deposit;
