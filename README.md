# LedgerLine

### Money movement with a ledger you can prove.

LedgerLine is a secure financial account and transaction management application built using the MERN stack. It focuses on reliable money movement, account management, transaction traceability, role-based authorization, and auditable financial records.

The project is being developed as part of the **Snovasys Fresher Hiring Challenge 2026**.

---

## Table of Contents

0. [Live Deployment & Evaluation Credentials](#0-live-deployment--evaluation-credentials)
1. [Project Overview](#1-project-overview)
2. [Project Objectives](#2-project-objectives)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Core Features](#5-core-features)
6. [User Roles](#6-user-roles)
7. [Financial Integrity](#7-financial-integrity)
8. [Security](#8-security)
9. [Project Structure](#9-project-structure)
10. [API Documentation](#10-api-documentation)
11. [Database Models](#11-database-models)
12. [Installation and Setup](#12-installation-and-setup)
13. [Environment Configuration](#13-environment-configuration)
14. [Running the Application](#14-running-the-application)
15. [Testing](#15-testing)
16. [Development Roadmap](#16-development-roadmap)
17. [Development Practices](#17-development-practices)
18. [Future Improvements](#18-future-improvements)
19. [Author](#19-author)

---

## 0. Live Deployment & Evaluation Credentials

### 🌐 Live Production Deployments

The application is deployed live in production across cloud infrastructure:

| Component | Platform | Live URL / Endpoint | Status |
|---|---|---|---|
| **Web Frontend (Client)** | **Vercel** | [https://ledger-line-dusky.vercel.app](https://ledger-line-dusky.vercel.app) | 🟢 Active (SPA Routing Enabled) |
| **Backend REST API** | **Render** | [https://ledgerline-api-2j8d.onrender.com/api](https://ledgerline-api-2j8d.onrender.com/api) | 🟢 Active (Node.js 24) |
| **API Health Check** | **Render** | [https://ledgerline-api-2j8d.onrender.com/api/health](https://ledgerline-api-2j8d.onrender.com/api/health) | 🟢 Returns HTTP 200 OK |
| **Database Cluster** | **MongoDB Atlas** | `mongodb+srv://.../ledgerline` | 🟢 Global Access (`0.0.0.0/0` Whitelisted) |
| **Source Repository** | **GitHub** | [https://github.com/UdayKiranBatchalakuri/LedgerLine](https://github.com/UdayKiranBatchalakuri/LedgerLine) | 🟢 Public Repository |

> **Note on Cold Starts:** Render free tier instances spin down after 15 minutes of inactivity. If the first API request takes ~30 seconds, please allow a moment for the instance to warm up.

---

### 🔑 Pre-Seeded Evaluation Credentials

For evaluators and judges reviewing this submission, the live production database is pre-configured with distinct role credentials across all three RBAC tiers:

| Role | Email | Password | Access Portal | Allowed Actions |
|---|---|---|---|---|
| **ADMIN** | `admin@ledgerline.com` *(or `kiranuday719@gmail.com`)* | `Admin@123` | `/dashboard` → `/admin/*` | Full management: Freeze/reactivate accounts, close empty accounts, suspend/reactivate users, change user roles, inspect audit trail diffs. |
| **AUDITOR** | `auditor@ledgerline.com` | `Auditor@123` | `/dashboard` → `/auditor` | **Strictly read-only**: View platform reserves, inspect all accounts, forensic transaction proof modal (SHA-256 hash & balance snapshots), view audit trail. Zero write capability. |
| **ACCOUNT_HOLDER** | `holder@ledgerline.com` | `Holder@123` | `/dashboard` | Self-service banking: Create Savings/Current accounts, 1-click copy account ID, deposit, withdraw (overdraft blocked), atomic transfers, view personal ledger & proofs. |

### Switching Any Account's Role
To switch any account's role instantly without database tampering, run from `server/`:
```bash
node scripts/setRole.js "<email_or_name>" <ADMIN | AUDITOR | ACCOUNT_HOLDER>
```
Example:
```bash
node scripts/setRole.js "kiranuday719@gmail.com" AUDITOR
```
*(After updating, log out and log back in to generate a fresh JWT with updated claims.)*

---

---

## 1. Project Overview

Financial applications must do more than update account balances. Every financial operation must be properly authorized, accurately processed, traceable, and verifiable.

LedgerLine aims to address these requirements through a backend-driven financial management system.

The application supports:

- Secure user registration and authentication.
- Financial account creation and management.
- Account ownership and access control.
- Deposits and withdrawals.
- Account-to-account fund transfers.
- Transaction history and transaction details.
- Administrative user and account management.
- Role-based authorization.
- Administrative audit logging.
- Automated testing of financial operations.

**Core principle:**

Every successful movement of money should be explainable and verifiable through corresponding transaction records.

---

## 2. Project Objectives

The primary objectives of LedgerLine are:

1. Build a secure authentication and authorization system.
2. Implement reliable financial account management.
3. Maintain accurate account balances.
4. Prevent unauthorized withdrawals and overdrafts.
5. Process transfers atomically.
6. Maintain traceable financial transaction records.
7. Provide transaction history and filtering.
8. Implement administrative and auditor access.
9. Maintain an administrative audit trail.
10. Demonstrate backend engineering, database management, and automated testing.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js 24 |
| API Framework | Express 5 |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Token (JWT) |
| Password Hashing | bcryptjs |
| Input Validation | Zod |
| API Security | Helmet, CORS |
| Testing | Node.js Test Runner |
| API Testing | Supertest, Postman |
| Version Control | Git and GitHub |

---

## 4. System Architecture

LedgerLine follows a client-server architecture.

```text
                   USER
                     |
                     v
             REACT + VITE CLIENT
                     |
                     v
              EXPRESS REST API
                     |
        -----------------------------
        |        |         |        |
        v        v         v        v
       AUTH    ACCOUNT  TRANSACTION ADMIN
        |        |         |        |
        -----------------------------
                     |
                     v
                MIDDLEWARE
                     |
                     v
               CONTROLLERS
                     |
                     v
                MONGOOSE
                     |
                     v
                MONGODB
```

### Backend Request Flow

1. The client sends an HTTP request.
2. Express receives the request.
3. Authentication middleware verifies the JWT when required.
4. Authorization middleware checks user permissions.
5. Controllers validate and process the request.
6. Mongoose communicates with MongoDB.
7. The API returns an appropriate response.

### Financial Transaction Flow

```text
       CLIENT REQUEST
              |
              v
       AUTHENTICATION
              |
              v
       INPUT VALIDATION
              |
              v
      ACCOUNT VALIDATION
              |
              v
       DATABASE SESSION
              |
              v
       BALANCE UPDATE
              |
              v
     TRANSACTION RECORD
              |
              v
       COMMIT OR ROLLBACK
              |
              v
       API RESPONSE
```

MongoDB transactions are used to coordinate financial balance updates and corresponding transaction record creation.

---

## 5. Core Features

### 5.1 Authentication and User Management

- User registration.
- User login.
- Password hashing using bcryptjs.
- JWT generation and verification.
- Protected API endpoints.
- User status validation.
- Role-based authorization.
- Prevention of public privilege escalation.

### 5.2 Account Management

- Savings and current account creation.
- Unique account number generation.
- Account listing.
- Account ownership validation.
- Account status management.
- Restricted account access.

### 5.3 Deposit Management

- Authenticated deposits.
- Positive amount validation.
- Integer paise monetary representation.
- Account ownership validation.
- Account status validation.
- Atomic balance and transaction record updates.
- Transaction references and balance snapshots.

### 5.4 Withdrawal Management

- Authenticated withdrawals.
- Positive amount validation.
- Account ownership validation.
- Sufficient balance verification.
- Overdraft prevention.
- Frozen account restrictions.
- Transaction rollback on ledger-write failure.

### 5.5 Fund Transfer Management

- Account-to-account transfers.
- Source and destination validation.
- Same-account transfer prevention.
- Account ownership verification.
- Sufficient balance verification.
- Frozen account restrictions.
- Paired outgoing and incoming transaction records.
- Shared transfer identifiers.
- Transaction rollback on failure.

### 5.6 Transaction History

- Account transaction history.
- Individual transaction details.
- Pagination.
- Transaction type filtering.
- Date filtering.
- Account ownership authorization.
- ADMIN and AUDITOR visibility.

### 5.7 Administrative Management

- User listing.
- Pagination and filtering.
- User suspension.
- User reactivation.
- User role modification.
- Account freezing.
- Account reactivation.
- Account closure.
- Safeguards against self-modification.
- Protection against removing the last active administrator.

### 5.8 Administrative Audit Trail

- Administrative action recording.
- Actor identification.
- Target entity identification.
- Change tracking.
- Audit log listing.
- Individual audit log retrieval.
- Pagination and filtering.
- ADMIN and AUDITOR access restrictions.

---

## 6. User Roles

LedgerLine supports three application roles.

| Role | Responsibilities |
|---|---|
| ADMIN | Manage users, accounts and administrative operations |
| ACCOUNT_HOLDER | Manage owned accounts and perform permitted financial transactions |
| AUDITOR | Read administrative and financial information for auditing |

### Role-Based Access

| Operation | ADMIN | ACCOUNT_HOLDER | AUDITOR |
|---|---|---|---|
| User registration | Public registration | Public registration | Public registration |
| View own profile | Yes | Yes | Yes |
| Create financial account | According to account API authorization | According to account API authorization | According to account API authorization |
| Deposit | No | Yes, subject to ownership | No |
| Withdrawal | No | Yes, subject to ownership | No |
| Transfer | No | Yes, subject to ownership | No |
| View transactions | Yes | Own accounts only | Yes |
| Administrative user listing | Yes | No | Yes |
| Change user status | Yes | No | No |
| Change user role | Yes | No | No |
| Change account status | Yes | No | No |
| View audit logs | Yes | No | Yes |

Actual access is enforced by backend middleware and controller-level ownership checks.

---

## 7. Financial Integrity

Financial integrity is a central design principle of LedgerLine.

### 7.1 Integer-Based Monetary Representation

Amounts are represented using integer paise rather than floating-point currency calculations.

This helps avoid floating-point precision problems.

### 7.2 Overdraft Prevention

Withdrawal and transfer operations validate the available balance before applying a debit.

### 7.3 Atomic Financial Operations

MongoDB transactions coordinate related database changes.

For example, a withdrawal must update the account balance and create its transaction record together.

If the transaction record cannot be created, the balance update must roll back.

### 7.4 Paired Transfer Records

A successful transfer creates:

- An outgoing transaction record for the source account.
- An incoming transaction record for the destination account.
- A shared transfer identifier linking both records.

### 7.5 Transaction Traceability

Transaction records include relevant references and balance snapshots to support financial history and verification.

### 7.6 Remaining Integrity Improvements

The following require additional implementation or verification before being claimed as complete:

- Idempotency protection for repeated financial requests.
- Concurrency-safe enforcement of the last-active-administrator invariant.
- Additional database failure and retry testing.

---

## 8. Security

LedgerLine uses multiple security controls.

| Security Area | Implementation |
|---|---|
| Password security | bcryptjs hashing |
| Authentication | JWT |
| Authorization | Role-based middleware |
| Input validation | Zod |
| Account access | Ownership validation |
| User status | Database-backed status checks |
| API protection | Helmet and CORS |
| Financial consistency | MongoDB transactions |
| Administrative accountability | Audit logging |
| Secret management | Environment variables |
| Version control security | `.gitignore` |

### Security Principles

- Never store plain-text passwords.
- Never trust client-supplied user roles.
- Never trust client-supplied account ownership.
- Never allow unauthorized account access.
- Never permit overdrafts.
- Keep financial balance and transaction record changes consistent.
- Never expose database credentials or JWT secrets.
- Restrict administrative operations according to user roles.

See [THREATS.md](THREATS.md) for the threat model and security verification details.

---

## 9. Project Structure

```text
LedgerLine/
|
|-- server/
|   |
|   |-- config/
|   |   |-- db.js
|   |
|   |-- models/
|   |   |-- User.js
|   |   |-- Account.js
|   |   |-- Transaction.js
|   |   |-- AuditLog.js
|   |
|   |-- controllers/
|   |   |-- authController.js
|   |   |-- accountController.js
|   |   |-- transactionController.js
|   |   |-- adminController.js
|   |   |-- auditController.js
|   |
|   |-- routes/
|   |   |-- authRoutes.js
|   |   |-- accountRoutes.js
|   |   |-- transactionRoutes.js
|   |   |-- adminRoutes.js
|   |   |-- auditRoutes.js
|   |
|   |-- middleware/
|   |   |-- authMiddleware.js
|   |   |-- authorizeRoles.js
|   |
|   |-- tests/
|   |   |-- auth.test.js
|   |   |-- health.test.js
|   |   |-- withdrawal.test.js
|   |   |-- transfer.test.js
|   |   |-- transactionHistory.test.js
|   |   |-- admin.test.js
|   |   |-- audit.test.js
|   |
|   |-- utils/
|   |-- docs/
|   |-- server.js
|   |-- package.json
|   |-- package-lock.json
|   |-- .env.example
|
|-- client/
|   |
|   |-- src/
|       |-- components/
|       |-- pages/
|       |-- layouts/
|       |-- context/
|       |-- services/
|       |-- hooks/
|       |-- utils/
|
|-- .gitignore
|-- README.md
|-- PROMPTS.md
|-- THREATS.md
```

The project structure may expand as development continues.

---

## 10. API Documentation

Base URL:

```text
http://localhost:5000
```

All protected endpoints require a valid JWT in the Authorization header.

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

### 10.1 Health Check

| Method | Endpoint | Description | Allowed Callers | Effect on the Money |
|---|---|---|---|---|
| GET | `/api/health` | Check backend availability and liveness | Public (Unauthenticated) | **Zero effect.** Read-only status verification. |

### 10.2 Authentication

| Method | Endpoint | Description | Allowed Callers | Effect on the Money |
|---|---|---|---|---|
| POST | `/api/auth/register` | Register an identity | Public (Unauthenticated) | **Zero effect.** Creates identity record with `status: ACTIVE` and default `role: ACCOUNT_HOLDER`. |
| POST | `/api/auth/login` | Login with email and password | Public (Unauthenticated) | **Zero effect.** Validates bcrypt hash and issues signed 24h JWT. |
| GET | `/api/auth/me` | Fetch active authenticated profile | Any authenticated user | **Zero effect.** Returns user details from trusted JWT claims. |

### 10.3 Account Management

| Method | Endpoint | Description | Allowed Callers | Effect on the Money |
|---|---|---|---|---|
| POST | `/api/accounts` | Open a new Savings/Current account | `ACCOUNT_HOLDER` | **Zero effect on system reserves.** Initializes a new account with `balancePaise: 0`. Client cannot supply initial balance. |
| GET | `/api/accounts` | Retrieve bank accounts | `ACCOUNT_HOLDER` (own accounts), `ADMIN`/`AUDITOR` (all platform accounts) | **Zero effect.** Read-only inspection of balances, account types, and lifecycle states. |

### 10.4 Transactions & Money Movement

| Method | Endpoint | Description | Allowed Callers | Effect on the Money (Conservation Invariant) |
|---|---|---|---|---|
| POST | `/api/transactions/deposit` | External capital injection | `ACCOUNT_HOLDER` (account owner only) | **Inflow**: Atomically increases account balance by `+amountPaise`. Increases total system reserves by exact deposit amount. Recorded in append-only ledger. |
| POST | `/api/transactions/withdraw` | External capital liquidation | `ACCOUNT_HOLDER` (account owner only) | **Outflow**: Verifies `balance >= amountPaise` (strictly zero-floor overdraft block). Atomically decrements account balance by `-amountPaise`. Decreases system reserves by exact withdrawal amount. |
| POST | `/api/transactions/transfer` | Internal account-to-account transfer | `ACCOUNT_HOLDER` (source account owner only) | **Zero Net Change**: Within a single atomic ACID transaction, decrements source by `-amountPaise` and increments destination by `+amountPaise`. **$\Delta \text{System Reserves} = 0$** (money strictly conserved). |
| GET | `/api/transactions/account/:accountId` | Per-account statement & ledger entries | Account Owner, `ADMIN`, `AUDITOR` | **Zero effect.** Read-only per-account statement displaying every debit, credit, resulting running balance (`balanceAfterPaise`), timestamp, and initiator. |
| GET | `/api/transactions/:transactionId` | Forensic transaction detail & proof | Participant Account Owner, `ADMIN`, `AUDITOR` | **Zero effect.** Read-only verification of transaction integrity and SHA-256 digital fingerprint. |

### 10.5 Administration

| Method | Endpoint | Description | Allowed Callers | Effect on the Money |
|---|---|---|---|---|
| GET | `/api/admin/users` | List platform users with status/role filters | `ADMIN`, `AUDITOR` | **Zero effect.** Read-only user directory. |
| PATCH | `/api/admin/users/:userId/status` | Suspend or reactivate user | `ADMIN` only | **Indirect Protection**: Suspended users are immediately blocked from initiating transactions. Zero balance alteration. |
| PATCH | `/api/admin/users/:userId/role` | Reassign user authorization role | `ADMIN` only | **Zero effect on money.** Self-demotion guard prevents admin lockout. |
| PATCH | `/api/admin/accounts/:accountId/status` | Freeze, activate, or close account | `ADMIN` only | **Financial Safeguard**: Frozen accounts reject all deposits, withdrawals, and transfers. **Closing an account with `balancePaise > 0` is strictly rejected** to prevent stranded reserves. |

### 10.6 Audit Trail

| Method | Endpoint | Description | Allowed Callers | Effect on the Money |
|---|---|---|---|---|
| GET | `/api/audit-logs` | List administrative audit trail records | `ADMIN`, `AUDITOR` | **Zero effect.** Read-only inspection of tamper-evident administrative state modifications. |
| GET | `/api/audit-logs/:auditLogId` | Inspect audit log state diff | `ADMIN`, `AUDITOR` | **Zero effect.** Read-only inspection of `previousValue` and `newValue` snapshots. |

---

## 11. Database Models

LedgerLine uses MongoDB with Mongoose models.

### User

Responsible for user identity, authentication and authorization.

Main information:

- Name
- Email
- Password hash
- Role
- Account status

### Account

Responsible for financial account information.

Main information:

- Account number
- Account holder
- Account type
- Balance
- Account status

### Transaction

Responsible for financial transaction records.

Main information:

- Account reference
- Transaction type
- Amount
- Balance snapshots
- Transaction reference
- Transfer identifier
- Transfer direction

### AuditLog

Responsible for administrative activity records.

Main information:

- Actor
- Action
- Target type
- Target identifier
- Previous value
- New value
- Creation timestamp

---

## 12. Installation and Setup

### Prerequisites

Install the following:

- Node.js 24 or compatible version.
- npm.
- MongoDB Atlas account.
- Git.
- Postman.
- VS Code or another code editor.

### Step 1: Clone the Repository

```bash
git clone https://github.com/UdayKiranBatchalakuri/LedgerLine.git

cd LedgerLine
```

### Step 2: Install Backend Dependencies

```bash
cd server

npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file inside the `server` directory.

Use `.env.example` as a reference.

### Step 4: Start the Backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### Step 5: Frontend Setup

When frontend implementation is complete, install and start the client using its own `package.json` scripts.

Typical development commands:

```bash
cd client

npm install

npm run dev
```

Refer to the actual client scripts before running these commands.

---

## 13. Environment Configuration

Example backend environment configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

Replace placeholder values with your own configuration.

**Important:**

- Never commit `.env`.
- Never publish MongoDB credentials.
- Never expose JWT secrets.
- Keep `.env.example` limited to placeholder values.

---

## 14. Running the Application

### Backend Development

```bash
cd server

npm run dev
```

### Backend Start

```bash
npm start
```

### Backend Testing

```bash
npm test
```

### Frontend Development

```bash
cd client

npm run dev
```

The backend and frontend are developed independently and communicate through REST APIs.

---

## 15. Testing

LedgerLine uses the Node.js built-in test runner and Supertest.

Automated tests cover:

- Health endpoint.
- User registration and authentication.
- Account creation and access control.
- Deposit processing.
- Withdrawal processing.
- Fund transfers.
- Transaction history and details.
- Administrative operations.
- Audit trail functionality.
- Authorization and validation.
- Transaction rollback scenarios.
- Concurrent financial operations.

### Latest Reported Test Results

| Metric | Result |
|---|---:|
| Tests reported | 134 |
| Passed | 134 |
| Failed | 0 |
| Success Rate | 100% |

Run the test suite:

```bash
cd server

npm test
```

Test results describe the latest reported execution verified across unit tests, API tests, atomic rollbacks, concurrency stress tests, and cryptographic idempotency validation.

---

## 16. Development Roadmap

| Phase | Module | Status |
|---|---|---|
| 1 | Project Foundation & Architecture | Completed |
| 2 | Authentication & RBAC (`ADMIN`, `AUDITOR`, `ACCOUNT_HOLDER`) | Completed |
| 3 | Account Management & Verification | Completed |
| 4 | Deposit Management & Ledger Posting | Completed |
| 5 | Withdrawal Management & Overdraft Prevention | Completed |
| 6 | Fund Transfer Management & Conservation Invariants | Completed |
| 7 | Transaction History & Forensic Proof Endpoints | Completed |
| 8 | Admin and Auditor Functionality (User & Account Lifecycle) | Completed |
| 9 | Administrative Audit Trail & State Diff Logging | Completed |
| 10 | Idempotency Keys (SHA-256 Hashing) & Concurrency Races | Completed |
| 11 | Frontend Integration (React 19, Dynamic Portals, Global 401 Session Handling) | Completed |
| 12 | End-to-End Verification (134/134 Tests Passing, Clean Vite Build) | Completed |
| 13 | Deployment & Setup Scripts | Completed |
| 14 | Final Documentation & Security Threat Models | Completed |

Update the roadmap only when implementation and verification support the change.

---

## 17. Development Practices

The project follows these practices:

- Develop features incrementally.
- Keep controllers and routes organized by responsibility.
- Validate all incoming requests.
- Enforce authorization on the backend.
- Use database transactions for related financial changes.
- Write automated tests for new features.
- Verify financial balance consistency.
- Review changes before committing.
- Use meaningful Git commit messages.
- Push genuine development progress regularly.
- Document AI-assisted development transparently.
- Never commit secrets or local dependencies.

### Development Documentation

| File | Purpose |
|---|---|
| `README.md` | Project overview and technical documentation |
| `PROMPTS.md` | AI usage and development history |
| `THREATS.md` | Threat model and security verification |

---

## 18. Future Improvements

Potential improvements for future development include:

- Multi-currency support (EUR, USD, GBP) with real-time FX conversion rates.
- Two-factor authentication (TOTP 2FA) for high-value financial transfers.
- Scheduled and recurring transfers (standing orders).
- Real-time event streaming and webhook notifications (Kafka / RabbitMQ).
- Native iOS and Android mobile applications using React Native.
- Comprehensive CSV / PDF downloadable account statements.
- Granular daily withdrawal velocity limits per account tier.

---

## 19. Project Information
---

### LedgerLine

**Money movement with a ledger you can prove.**

**Project:** LedgerLine
**Challenge:** Snovasys Fresher Hiring Challenge 2026
**Repository:** [GitHub — LedgerLine](https://github.com/UdayKiranBatchalakuri/LedgerLine)
