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

## Development Integrity

- AI-assisted work is documented transparently.
- Implementation and testing claims reflect actual results.
- Failed tests and their resolutions are documented.
- Git commits represent genuine and meaningful development work.
- Secrets and `.env` files must never be committed.
- Security and financial integrity claims must be supported by implementation and testing.
