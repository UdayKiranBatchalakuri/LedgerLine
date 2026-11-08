# LedgerLine

### Money movement with a ledger you can prove.

LedgerLine is a secure financial account and transaction management application built using the MERN stack. It focuses on reliable money movement, account management, transaction traceability, role-based authorization, and auditable financial records.

The project is being developed as part of the **Snovasys Fresher Hiring Challenge 2026**.

---

## Table of Contents

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

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend status |

### 10.2 Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get authenticated user | Yes |

### 10.3 Transactions

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions/deposit` | Deposit money |
| POST | `/api/transactions/withdraw` | Withdraw money |
| POST | `/api/transactions/transfer` | Transfer funds |
| GET | `/api/transactions/account/:accountId` | Get account transactions |
| GET | `/api/transactions/:transactionId` | Get transaction details |

### 10.4 Administration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/:userId/status` | Update user status |
| PATCH | `/api/admin/users/:userId/role` | Update user role |
| PATCH | `/api/admin/accounts/:accountId/status` | Update account status |

### 10.5 Audit Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit-logs` | List audit logs |
| GET | `/api/audit-logs/:auditLogId` | Get audit log details |

### 10.6 Account Management

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/accounts` | Create a new account | Yes |
| GET | `/api/accounts` | List the authenticated user's accounts | Yes |
Account creation and retrieval routes are implemented separately.

Refer to `server/routes/accountRoutes.js` for their exact paths and HTTP methods.

Only verified route definitions should be treated as available API endpoints.

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
| Tests reported | 131 |
| Passed | 131 |
| Failed | 0 |

Run the test suite:

```bash
cd server

npm test
```

Test results describe the latest reported execution and should be updated after subsequent changes.

---

## 16. Development Roadmap

| Phase | Module | Status |
|---|---|---|
| 1 | Project Foundation | Completed |
| 2 | Authentication | Completed |
| 3 | Account Management | Completed |
| 4 | Deposit Management | Completed |
| 5 | Withdrawal Management | Completed |
| 6 | Fund Transfer Management | Completed |
| 7 | Transaction History | Completed |
| 8 | Admin and Auditor Functionality | Completed |
| 9 | Administrative Audit Trail | Completed |
| 10 | Idempotency and additional concurrency verification | Remaining |
| 11 | Frontend integration | Remaining |
| 12 | End-to-end verification | Remaining |
| 13 | Deployment | Remaining |
| 14 | Final documentation and release | Remaining |

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

- Idempotency keys for financial operations.
- Stronger concurrency-safe administrative invariants.
- Complete frontend integration.
- Dashboard and financial activity summaries.
- Downloadable account statements.
- Enhanced transaction search.
- More extensive end-to-end tests.
- Production deployment.
- Monitoring and operational logging.
- Additional security hardening.

These are future improvements and should not be considered implemented until verified.

---

## 19. Project Information
---

### LedgerLine

**Money movement with a ledger you can prove.**

**Project:** LedgerLine
**Challenge:** Snovasys Fresher Hiring Challenge 2026
**Repository:** [GitHub — LedgerLine](https://github.com/UdayKiranBatchalakuri/LedgerLine)
