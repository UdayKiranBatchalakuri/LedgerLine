# LedgerLine — AI Usage & Development Log

## Project Overview

**Project:** LedgerLine  
**Tagline:** Money movement with a ledger you can prove.

### Technology Stack
- Frontend: React + Vite
- Backend: Node.js 24 + Express 5
- Database: MongoDB Atlas + Mongoose
- Authentication: JWT
- Password Hashing: bcryptjs
- Validation: Zod
- Testing: Node.js Test Runner + Supertest
- API Testing: Postman
- Version Control: Git + GitHub

---

# November 6, 2026

## Assignment 1 — Project Foundation

### Completed Work
- Selected MERN stack architecture and created the initial project structure.
- Initialized Node.js backend and configured Express 5.
- Connected MongoDB Atlas and configured environment variables.
- Created `.env.example` and configured `.gitignore`.
- Implemented API health endpoint and initial testing setup.
- Reviewed dependencies and removed unnecessary packages.

### Verification
- Backend started successfully.
- MongoDB Atlas connection succeeded.
- Health endpoint returned HTTP 200.
- Dependency audit reported zero vulnerabilities after cleanup.

### AI Assistance
- Used AI for architecture planning, backend initialization, dependency review and configuration troubleshooting.

---

## Assignment 2 — Authentication Module

### Completed Work
- Created User model with name, email, passwordHash, role and status.
- Implemented registration and login APIs.
- Added Zod validation and bcrypt password hashing with cost factor 12.
- Implemented JWT generation, verification and expiration.
- Created authentication middleware and protected `/api/auth/me` endpoint.
- Added ADMIN, ACCOUNT_HOLDER and AUDITOR roles.
- Prevented public users from assigning privileged roles.

### Issues Encountered
- MongoDB Atlas connectivity failed after changing the development network.
- Investigated Network Access configuration and restored connectivity.

### Verification
- Tested registration, login, duplicate email, invalid credentials and protected routes.
- Verified password hashes were not exposed in responses.
- Tests reported: 10 passed, 0 failed.

### AI Assistance
- Used AI to implement authentication, understand JWT middleware, troubleshoot connectivity and develop automated tests.

---

## Assignment 3 — Account Management

**Status:** Implementation and automated tests completed.

### Completed Work
- Created Account Mongoose model.
- Implemented savings and current account creation.
- Added unique account number generation.
- Implemented account listing and ownership validation.
- Enabled ADMIN and AUDITOR account visibility.
- Prevented clients from supplying account ownership and initial balance.

### Testing
- Account model validation.
- Account creation and listing.
- Account ownership isolation.
- ADMIN and AUDITOR access control.

**Verification:** Regression suite reported 40 passing tests and zero failures after deposit implementation.

---

## Assignment 4 — Deposit Management

**Status:** Implementation and automated tests completed.

### Completed Work
- Created Transaction Mongoose model.
- Implemented authenticated deposit endpoint.
- Used integer paise for monetary calculations.
- Added amount, account ownership and account status validation.
- Implemented MongoDB transaction-based balance and ledger updates.
- Added transaction references and balance snapshots.

### Testing
- Successful deposits and ledger creation.
- Invalid amounts and unauthorized requests.
- Missing and frozen account handling.
- Ledger-write failure rollback.
- Eight simultaneous deposit requests.
- Verified final balance and ledger consistency.

**Verification:** Latest complete test run reported 40 passing tests and zero failures.

### AI Assistance
- Used AI for implementation guidance, debugging, code review and automated test development.

---

# November 7, 2026

## Assignment 5 — Withdrawal Management

**Status:** Implementation and automated tests completed.

### Completed Work
- Implemented authenticated withdrawal endpoint.
- Added withdrawal amount validation using Zod.
- Restricted withdrawals to account owners.
- Checked account existence and ACTIVE status.
- Added sufficient-balance validation to prevent overdrafts.
- Updated account balance and recorded withdrawal transactions.

### Testing
- Successful and invalid withdrawals.
- Insufficient balance rejection.
- Account ownership and authorization checks.
- Frozen and missing account handling.
- Transaction consistency and rollback scenarios.

### AI Assistance
- Used AI to implement withdrawal workflows, troubleshoot balance updates and develop automated tests.

---

## Assignment 6 — Fund Transfer Management

**Status:** Implementation and automated tests completed.

### Completed Work
- Implemented authenticated account-to-account transfers.
- Added source and destination account validation.
- Prevented transfers between the same account.
- Added balance, ownership and account status checks.
- Implemented MongoDB transaction-based transfer processing.
- Created paired outgoing and incoming ledger records.
- Added transfer identifiers and direction metadata.

### Testing
- Successful fund transfers.
- Insufficient balance rejection.
- Invalid amount and account handling.
- Ownership restrictions.
- Same-account transfer rejection.
- Paired ledger verification and rollback scenarios.

### AI Assistance
- Used AI to understand atomic transfers, implement validation, review ledger consistency and develop automated tests.

---

## Assignment 7 — Transaction History and Details

**Status:** Implementation, automated tests and Postman verification completed.

### Completed Work
- Implemented transaction history API.
- Implemented individual transaction detail API.
- Added pagination and transaction filtering.
- Added date validation and account ownership checks.
- Enabled ADMIN and AUDITOR transaction visibility.
- Restricted account holders to their own transaction records.

### Important APIs
- `GET /api/transactions/account/:accountId`
- `GET /api/transactions/:transactionId`

### Testing and Verification
- Tested transaction history and individual details.
- Verified pagination and filtering.
- Tested authorization and ownership restrictions.
- Verified successful API responses using Postman.
- Checked transaction amount, type, balance snapshots and transfer metadata.

### AI Assistance
- Used AI for API implementation, pagination, debugging, Postman verification and automated testing.

---

# November 8, 2026

## Assignment 8 — Admin and Auditor Functionality

**Status:** Implementation and automated tests completed.

### Completed Work

**User Administration**
- Implemented administrative user listing.
- Added pagination and role/status filtering.
- Implemented user suspension, reactivation and role changes.

**Account Administration**
- Implemented account status management.
- Added account freezing, reactivation and closure.
- Prevented closure of accounts with positive balances.
- Prevented reactivation of closed accounts.

**Access Control**
- Created `authorizeRoles` middleware.
- Restricted administrative modifications to ADMIN.
- Enabled read-only administrative data access for AUDITOR.
- Restricted ACCOUNT_HOLDER from administrative operations.
- Added safeguards for self-modification and last active administrator management.

### Testing
- User listing and filtering.
- Role-based access restrictions.
- User suspension and role modification.
- Account freezing and reactivation.
- Positive-balance account closure rejection.
- Invalid IDs and status handling.

### Verification
- Reported regression run: 111 passed, 0 failed.

### AI Assistance
- Used AI to implement administrative controllers, role-based access, safeguards and automated tests.

---

## Assignment 9 — Administrative Audit Trail

**Status:** Implementation and audit-related tests completed.

### Completed Work
- Created AuditLog Mongoose model.
- Added administrator, action, target entity and change details.
- Implemented audit logging for user and account administration.
- Added audit log listing and individual detail APIs.
- Implemented pagination and filtering.
- Restricted audit log access to ADMIN and AUDITOR.
- Prevented ACCOUNT_HOLDER access.
- Avoided duplicate audit records for unchanged administrative requests.

### Audit Events
- USER_SUSPENDED
- USER_REACTIVATED
- USER_ROLE_CHANGED
- ACCOUNT_FROZEN
- ACCOUNT_ACTIVATED
- ACCOUNT_CLOSED

### Testing
- Audit record creation for administrative actions.
- ADMIN and AUDITOR retrieval permissions.
- ACCOUNT_HOLDER access rejection.
- Pagination and filtering.
- Invalid and missing audit record handling.
- Unauthenticated access rejection.
- Failed operation and duplicate audit record checks.

### Issues Encountered
- ACCOUNT_HOLDER access test initially returned HTTP 200 instead of HTTP 403.
- Identified that an earlier test had changed the same user's role to AUDITOR.
- Created a separate ACCOUNT_HOLDER test user and token.
- Re-ran the audit-related tests.

### Verification
- Latest reported audit-related test execution: 131 passed, 0 failed.
- Separate full-suite `npm test` verification remains to be confirmed.

### AI Assistance
- Used AI to design the audit model, integrate administrative logging, implement retrieval APIs, troubleshoot test failures and review access control.

---

# November 9, 2026

## Assignment 10 — Full-Stack Integration, Multi-Role Portals & End-to-End Hardening

**Status:** Implementation, automated regression suite (134/134 passing), and production build completed.

### Completed Work
- Implemented dedicated frontend portals for all three user roles:
  - `ADMIN` (`/admin`): Navy-themed control panel with user suspension/reactivation, role modification, account freeze/activation/close safeguards, and compliance audit trail inspection.
  - `AUDITOR` (`/auditor`): Amber-themed read-only compliance portal with platform reserve telemetry, system-wide transaction ledger inspection, and tamper-evident audit logs with zero write capabilities.
  - `ACCOUNT_HOLDER` (`/dashboard`): Consumer banking portal with real-time INR balances, 1-click Copy Document ID helper, quick-action navigation, deposit/withdrawal/transfer flows, and cryptographic transaction proof inspection modal.
- Configured dynamic post-login routing and role-based route guards in `App.jsx`.
- Added global Axios response interceptor in `api.js` for automatic HTTP 401 token expiry handling.
- Implemented out-of-band role promotion CLI script (`server/scripts/setRole.js`).
- Executed the full automated test suite: **134 passing tests, 0 failures**.
- Built clean client production bundle with Vite (`0 lint errors, 0 warnings`).

---

## AI Error Catching & Money Integrity Verification

As required by the challenge standard, below are the specific dated instances where AI tool suggestions were scrutinized, identified as flawed or dangerous to money movement, and corrected with sound engineering.

### 1. Money Integrity: Idempotency Key Payload Hashing vs. Key-Only Collision
- **What the tool was asked to do:** Implement idempotency key caching for the fund transfer endpoint to prevent double-charging on network retry timeouts.
- **What the tool produced:** A simple key-value lookup checking if `req.headers['idempotency-key']` existed in the database and returning the cached response if present.
- **What was specifically wrong:** Critical financial security flaw. If a client re-used an idempotency key with a *different* amount, a different source account, or a different recipient, the system would return the old cached receipt while silently failing to process the new transaction, creating a discrepancy between client state and actual ledger balances.
- **What was done instead:** Enforced cryptographic SHA-256 request payload hashing. The server computes `crypto.createHash('sha256').update(JSON.stringify({ amountPaise, sourceAccountId, destinationAccountId })).digest('hex')` and stores both `idempotencyKey` and `idempotencyHash`. If an identical key is submitted with mismatched payload parameters, the server rejects it with `HTTP 409 Conflict`.
- **Commit Reference:** [`bb6d264`](https://github.com/udaykiran7422/LedgerLine/commit/bb6d264) (Verified in `server/tests/transfer.test.js`).

### 2. Money Integrity: Enforcing Strict Integer Paise vs. Floating-Point Decimals
- **What the tool was asked to do:** Implement deposit and withdrawal amount calculation and account balance updates.
- **What the tool produced:** Balance arithmetic using JavaScript `parseFloat(amount)` and standard rupee addition (`balance += amount`).
- **What was specifically wrong:** In JavaScript, IEEE-754 floating-point arithmetic suffers from precision leakage (e.g., `0.1 + 0.2 === 0.30000000000000004`). In a high-volume financial ledger, fractional penny rounding errors violate the core invariant: *"The books must always balance"*.
- **What was done instead:** Completely banned floating-point monetary math across both client and server. Converted all financial amounts to integer **Paise** (`1 INR = 100 paise`), validated inputs with `Number.isSafeInteger()`, rejected fractional paise at the Zod schema boundary, and stored strictly integer balances in MongoDB.
- **Commit Reference:** [`ed60da6`](https://github.com/udaykiran7422/LedgerLine/commit/ed60da6) (Verified in `server/tests/account.test.js`).

### 3. Access Control & Authorization: Role Enforcement in Financial Endpoints
- **What the tool was asked to do:** Wire deposit and withdrawal API endpoints to the frontend portals.
- **What the tool produced:** Permitted any authenticated token regardless of role to initiate write operations, relying purely on ownership check `account.owner === user.id`.
- **What was specifically wrong:** Critical privilege boundary failure. Administrators and Auditors should never have arbitrary write access to deposit or withdraw customer funds. Permitting an administrative account to execute deposits/withdrawals violates regulatory separation of duties.
- **What was done instead:** Enforced strict server-side RBAC validation: `if (req.user.role !== "ACCOUNT_HOLDER") return res.status(403).json({ message: "Only account holders can deposit/withdraw money" })`. Administrators are restricted strictly to account lifecycle governance (freeze/activate/close), and Auditors are 100% read-only.
- **Commit Reference:** [`ef828af`](https://github.com/udaykiran7422/LedgerLine/commit/ef828af) (Verified in `server/tests/deposit.test.js` & `server/tests/withdrawal.test.js`).

### 4. Audit Trail Integrity: Preventing Positive-Balance Account Closure
- **What the tool was asked to do:** Implement administrative account status modification (`PATCH /api/admin/accounts/:accountId/status`).
- **What the tool produced:** Allowed setting `status: "CLOSED"` on any account as long as the caller had the `ADMIN` role.
- **What was specifically wrong:** Severe financial violation. If an account with a positive balance (e.g. ₹5,000) is marked `CLOSED`, those customer reserves are permanently stranded and inaccessible, creating an un-reconcilable discrepancy in system reserves.
- **What was done instead:** Implemented an invariant check in `adminController.js`: `if (newStatus === "CLOSED" && account.balancePaise > 0) return res.status(400).json({ message: "Cannot close an account with a positive balance" })`. An audit record is created only when a zero-balance account is closed.
- **Commit Reference:** [`bb6d264`](https://github.com/udaykiran7422/LedgerLine/commit/bb6d264) (Verified in `server/tests/admin.test.js`).

### 5. Frontend Lifecycle: Empty-Accounts Freeze in Transaction History
- **What the tool was asked to do:** Implement the Account Holder Transaction History page (`client/src/pages/Transactions.jsx`).
- **What the tool produced:** A `useEffect` hook that set `loadingTxns = true` whenever `accountId` changed, but only set `accountId` once an account was selected from the fetched account list.
- **What was specifically wrong:** If a brand-new user with zero bank accounts logged into the system, `accounts.length` was 0, so no account was ever selected. This left `loadingTxns` stuck on `true` permanently, displaying an infinite loading spinner and blocking the user from viewing the page.
- **What was done instead:** Added a guard in `Transactions.jsx`: if the fetched account list is empty, both `loadingAccounts` and `loadingTxns` are immediately resolved to `false`, displaying a clean empty state with an onboarding prompt to create their first bank account.
- **Commit Reference:** [`9d2b223`](https://github.com/udaykiran7422/LedgerLine/commit/9d2b223).

### 6. Session Security & Routing: Unhandled 401 Expiration & Hardcoded Role Redirects
- **What the tool was asked to do:** Implement login redirection and Axios client authorization headers.
- **What the tool produced:** A hardcoded `if (role === "ADMIN") navigate("/admin")` redirect that trapped administrative accounts on the legacy overview, alongside missing response error interceptors.
- **What was specifically wrong:** When an administrative account logged in, they were forced into `/admin` and locked out of the primary consumer Overview (`/dashboard`). Furthermore, when a JWT expired, the app remained stuck on stale views with generic errors.
- **What was done instead:** Modernized `App.jsx` and `Login.jsx` to route all authenticated users directly to the unified dark forest green Overview (`/dashboard`), moved admin telemetry to dedicated sidebar sub-routes (`/admin/users`, `/admin/accounts`, `/admin/audit-logs`), and added an Axios 401 interceptor that clears expired tokens and redirects to `/login`.
- **Commit Reference:** [`9d2b223`](https://github.com/udaykiran7422/LedgerLine/commit/9d2b223).

---

# November 10, 2026

## Assignment 11 — Unified Vault Design System & Full RBAC Hardening

### Completed Work
- Replaced fragmented portal designs with the unified LedgerLine Vault design system ([`vault.css`](client/src/vault.css)) matching production fintech standards (Page 1-4 screenshots).
- Implemented persistent dark forest green sidebar (`#0d3326`) with Workspace navigation: Overview, Accounts, Statements, and Account Request.
- Wired live reactive modal dialogs for direct banking operations: [VaultDepositModal.jsx](client/src/components/VaultDepositModal.jsx), [VaultWithdrawModal.jsx](client/src/components/VaultWithdrawModal.jsx), [VaultTransferModal.jsx](client/src/components/VaultTransferModal.jsx), and [VaultProofModal.jsx](client/src/components/VaultProofModal.jsx).
- Consolidated Admin and Auditor routes within [VaultLayout.jsx](client/src/layouts/VaultLayout.jsx).
- Upgraded `README.md` API documentation with caller roles and monetary conservation effects.
- Verified 134/134 passing backend tests and 0-error client production Vite build.

---

## Development Integrity

- AI-assisted work is documented transparently.
- Implementation and testing claims reflect actual results.
- Failed tests and their resolutions are documented.
- Git commits represent genuine and meaningful development work.
- Secrets and `.env` files must never be committed.
- Security and financial integrity claims must be supported by implementation and testing.
