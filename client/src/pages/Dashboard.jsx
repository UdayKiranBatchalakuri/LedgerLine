
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  LogOut,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Receipt,
  Copy,
  Check,
} from "lucide-react";

import { useAuth } from "../context/useAuth";
import {
  getAccounts,
  createAccount,
} from "../services/accountService";
import { getTransactions } from "../services/transactionService";

// Fetch all transaction pages for an account
async function fetchAllTransactions(accountId) {
  let page = 1;
  let totalPages = 1;
  const transactions = [];

  while (page <= totalPages) {
    const response = await getTransactions(accountId, {
      page,
      limit: 10,
    });

    transactions.push(...(response.transactions || []));

    totalPages = response.pagination?.totalPages || 1;
    page++;
  }

  return transactions;
}

// Get accounts and calculate their transaction summary
async function loadDashboardData() {
  const accountResponse = await getAccounts();

  const accounts = Array.isArray(accountResponse)
    ? accountResponse
    : accountResponse.accounts || [];

  const activeAccounts = accounts.filter(
    (account) => account.status === "ACTIVE"
  );

  const transactionsByAccount = await Promise.all(
    activeAccounts.map((account) =>
      fetchAllTransactions(account._id)
    )
  );

  const allTransactions = transactionsByAccount.flat();

  const summary = allTransactions.reduce(
    (result, transaction) => {
      const amount = Number(transaction.amountPaise) || 0;

      switch (transaction.type) {
        case "DEPOSIT":
          result.depositsPaise += amount;
          break;

        case "WITHDRAWAL":
          result.withdrawalsPaise += amount;
          break;

        case "TRANSFER":
          if (transaction.transferDirection === "OUTGOING") {
            result.transfersPaise += amount;
          }
          break;

        default:
          break;
      }

      return result;
    },
    {
      depositsPaise: 0,
      withdrawalsPaise: 0,
      transfersPaise: 0,
    }
  );

  return { accounts, summary };
}

function Dashboard() {
  const { user, logout } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({
    depositsPaise: 0,
    withdrawalsPaise: 0,
    transfersPaise: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
const [showCreateAccount, setShowCreateAccount] = useState(false);
const [accountType, setAccountType] = useState("SAVINGS");
const [creatingAccount, setCreatingAccount] = useState(false);
const [accountMessage, setAccountMessage] = useState("");
const [accountError, setAccountError] = useState("");
const [copiedId, setCopiedId] = useState(null);
  // Initial dashboard loading
  useEffect(() => {
    let isMounted = true;

    const initializeDashboard = async () => {
      try {
        const data = await loadDashboardData();

        if (isMounted) {
          setAccounts(data.accounts);
          setSummary(data.summary);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh dashboard data
  const handleRefresh = async () => {
    if (refreshing || loading) return;

    try {
      setRefreshing(true);
      setError("");
      setSummaryError("");

      const data = await loadDashboardData();

      setAccounts(data.accounts);
      setSummary(data.summary);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to refresh dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  };
  const handleCreateAccount = async (e) => {
  e.preventDefault();

  try {
    setCreatingAccount(true);
    setAccountError("");
    setAccountMessage("");

    await createAccount(accountType);

    const data = await loadDashboardData();

    setAccounts(data.accounts);
    setSummary(data.summary);

    setAccountMessage("Bank account created successfully!");
    setShowCreateAccount(false);
    setAccountType("SAVINGS");
  } catch (err) {
    setAccountError(
      err.response?.data?.message ||
        "Unable to create bank account."
    );
  } finally {
    setCreatingAccount(false);
  }
};


  const handleCopyId = async (id) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Calculate active account balance
  const totalBalancePaise = accounts.reduce(
    (total, account) =>
      account.status === "ACTIVE"
        ? total + (Number(account.balancePaise) || 0)
        : total,
    0
  );

  // Format paise as Indian Rupees
  const formatCurrency = (paise) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(paise / 100);

  return (
    <main className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-logo dashboard-logo">
          <Wallet size={27} />
          <span>LedgerLine</span>
        </div>

        <div className="dashboard-user">
          <div className="user-details">
            <strong>{user?.name}</strong>
            <span>{user?.role?.replaceAll("_", " ")}</span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
            type="button"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        {/* Welcome and Navigation */}
        <div className="dashboard-welcome">
          <div>
            <span className="eyebrow">OVERVIEW</span>
            <h1>Welcome, {user?.name}!</h1>
            <p>Here's your LedgerLine account overview.</p>
          </div>

          <div className="dashboard-actions">
            <div className="secure-indicator">
              <ShieldCheck size={19} />
              Secure session
            </div>

            <Link
              to="/deposit"
              className="dashboard-action-button"
            >
              <PlusCircle size={18} />
              Deposit Money
            </Link>
            <Link
  to="/withdrawal"
  className="dashboard-action-button"
>
  <ArrowUpRight size={18} />
  Withdraw Money
</Link>
<Link
  to="/transfer"
  className="dashboard-action-button"
>
  <ArrowLeftRight size={18} />
  Transfer Money
</Link>

            <Link
              to="/transactions"
              className="dashboard-action-button"
            >
              <Receipt size={18} />
              Transaction History
            </Link>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {summaryError && (
          <div className="error-message" role="alert">
            {summaryError}
          </div>
        )}

        {/* Financial Summary */}
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">
              <Wallet size={23} />
            </div>

            <span>Total balance</span>

            <h2>
              {loading
                ? "Loading..."
                : formatCurrency(totalBalancePaise)}
            </h2>

            <small>Across active accounts</small>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">
              <ArrowDownLeft size={23} />
            </div>

            <span>Total deposits</span>

            <h2>
              {loading
                ? "Loading..."
                : formatCurrency(summary.depositsPaise)}
            </h2>

            <small>All recorded deposits</small>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">
              <ArrowUpRight size={23} />
            </div>

            <span>Total withdrawals</span>

            <h2>
              {loading
                ? "Loading..."
                : formatCurrency(summary.withdrawalsPaise)}
            </h2>

            <small>All recorded withdrawals</small>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">
              <ArrowLeftRight size={23} />
            </div>

            <span>Transfers sent</span>

            <h2>
              {loading
                ? "Loading..."
                : formatCurrency(summary.transfersPaise)}
            </h2>

            <small>Outgoing transfers only</small>
          </div>
        </div>

        {/* Accounts Section */}
        <section className="accounts-section">
          <div className="accounts-heading">
            <div>
              <h2>My accounts</h2>
              <p>Your registered bank accounts.</p>
            </div>
            <button
  className="create-account-button"
  type="button"
  onClick={() => {
    setAccountError("");
    setAccountMessage("");
    setShowCreateAccount(true);
  }}
>
  <PlusCircle size={18} />
  Create Account
</button>

            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh dashboard"
              type="button"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing ? "refresh-spinning" : ""
                }
              />
            </button>
          </div>

          {loading ? (
            <p>Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <p>No accounts found.</p>
          ) : (
            <div className="accounts-grid">
              {accounts.map((account) => (
                <article
                  className="account-card"
                  key={account._id}
                >
                  <div className="account-card-top">
                    <Wallet size={23} />

                    <span
                      className={`account-status ${account.status.toLowerCase()}`}
                    >
                      {account.status}
                    </span>
                  </div>

                  <p className="account-type">
                    {account.accountType} ACCOUNT
                  </p>

                  <h3>
                    {formatCurrency(account.balancePaise)}
                  </h3>

                  <p className="account-number">
                    Account: {account.accountNumber}
                  </p>

                  <div className="account-id-row">
                    <span className="account-id-label" title={account._id}>
                      ID: <code>{account._id}</code>
                    </span>
                    <button
                      type="button"
                      className="copy-id-btn"
                      onClick={() => handleCopyId(account._id)}
                      title="Copy Account ID for transfers"
                    >
                      {copiedId === account._id ? (
                        <>
                          <Check size={13} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy ID
                        </>
                      )}
                    </button>
                  </div>

                  <p className="account-currency">
                    Currency: {account.currency}
                  </p>

                  <div className="account-card-actions">
                    <Link
                      to={`/deposit?account=${account._id}`}
                      className="card-action-link"
                      title="Deposit to this account"
                    >
                      Deposit
                    </Link>
                    <Link
                      to={`/withdrawal?account=${account._id}`}
                      className="card-action-link"
                      title="Withdraw from this account"
                    >
                      Withdraw
                    </Link>
                    <Link
                      to={`/transfer?account=${account._id}`}
                      className="card-action-link"
                      title="Transfer from this account"
                    >
                      Transfer
                    </Link>
                    <Link
                      to={`/transactions?account=${account._id}`}
                      className="card-action-link view-history"
                      title="View account ledger"
                    >
                      History
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        {accountMessage && (
  <div className="success-message" role="status">
    {accountMessage}
  </div>
)}

{accountError && !showCreateAccount && (
  <div className="error-message" role="alert">
    {accountError}
  </div>
)}

{showCreateAccount && (
  <div className="account-modal-overlay">
    <div className="account-modal">
      <h2>Open a Bank Account</h2>
      <p>Select the type of account you want to create.</p>

      <form onSubmit={handleCreateAccount}>
        <label htmlFor="accountType">
          Account Type
        </label>

        <select
          id="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="SAVINGS">Savings Account</option>
          <option value="CURRENT">Current Account</option>
        </select>

        {accountError && (
          <div className="error-message" role="alert">
            {accountError}
          </div>
        )}

        <div className="account-modal-actions">
          <button
            type="button"
            onClick={() => setShowCreateAccount(false)}
            disabled={creatingAccount}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={creatingAccount}
          >
            {creatingAccount
              ? "Creating..."
              : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      </section>
    </main>
  );
}

export default Dashboard;
