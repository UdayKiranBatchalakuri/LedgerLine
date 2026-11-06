# LedgerLine

### Money movement with a ledger you can prove.

LedgerLine is a secure financial account and transaction management application designed around accuracy, accountability, and verifiable financial records.

Built using the MERN stack, LedgerLine aims to provide reliable account management, secure money movement, transaction traceability, and an auditable financial ledger.

---

## 1. Project Overview

Financial applications must do more than update account balances. Every financial operation should be secure, traceable, consistent, and verifiable.

LedgerLine is designed to address these requirements through:

- Secure user authentication and authorization.
- Account ownership and access control.
- Deposits, withdrawals, and transfers.
- Prevention of overdrafts and duplicate transactions.
- Reliable transaction processing.
- An auditable and immutable financial ledger.
- Account statements and transaction history.

**Core principle:** Every movement of money must be explainable and verifiable through ledger records.

---

## 2. Project Development Status

LedgerLine is being developed incrementally.

### Completed

- Project foundation and backend initialization.
- MongoDB Atlas connectivity.
- User registration and login.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Protected user profile endpoint.
- Registration and login validation using Zod.
- Automated health and authentication tests.

### Planned

- Account management and ownership authorization.
- Deposit and withdrawal operations.
- Money transfers.
- Double-entry ledger implementation.
- Idempotency and concurrency protection.
- Transaction statements and reporting.
- Complete frontend integration.
- Final deployment and security verification.

Features will be marked completed only after implementation and verification.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js 24 |
| API Framework | Express 5 |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | bcryptjs |
| Validation | Zod |
| Testing | Node.js Test Runner + Supertest |
| API Testing | Postman |
| Version Control | Git + GitHub |

---

## 4. System Architecture

The intended application architecture:

```text
              USER
                |
                v
       REACT + VITE CLIENT
                |
                v
        EXPRESS REST API
                |
        -----------------
        |       |       |
        v       v       v
     AUTH   ACCOUNT  TRANSACTION
   MODULE   MODULE     MODULE
        |       |       |
        -----------------
                |
                v
         SERVICE LAYER
                |
                v
         MONGOOSE MODELS
                |
                v
          MONGODB ATLAS
```

Financial transaction processing will use database-level consistency controls and ledger records.

---

## 5. Core Functional Modules

### 5.1 Authentication and User Management

- User registration.
- Secure password hashing.
- User login.
- JWT authentication.
- Protected API endpoints.
- Role-based access control.

Supported user roles:

- `ADMIN`
- `ACCOUNT_HOLDER`
- `AUDITOR`

### 5.2 Account Management

Planned capabilities:

- Create financial accounts.
- Retrieve owned accounts.
- View account details.
- Enforce account ownership.
- Restrict unauthorized access.

### 5.3 Financial Transactions

Planned capabilities:

- Deposit money.
- Withdraw money.
- Transfer money between accounts.
- Validate available balances.
- Prevent overdrafts.
- Protect against duplicate operations.

### 5.4 Financial Ledger

The ledger is the foundation of LedgerLine.

Planned principles:

- Record every financial movement.
- Maintain balanced debit and credit entries.
- Preserve transaction history.
- Prevent unauthorized ledger modifications.
- Support transaction traceability.

### 5.5 Statements and Reporting

Planned capabilities:

- Account transaction history.
- Account statements.
- Transaction references.
- Financial activity summaries.

---

## 6. Financial Integrity Principles

LedgerLine is designed around the following financial rules:

1. Money must never be created or destroyed through an invalid transaction.
2. Accounts must not be allowed to spend more than their available balance.
3. Transfers must debit and credit the correct accounts consistently.
4. Duplicate requests must not execute the same financial operation twice.
5. Every successful transaction must have corresponding ledger records.
6. Ledger history must remain auditable.

These are design requirements; their implementation and verification will be documented as development progresses.

---

## 7. Security Design

Security measures implemented so far:

- bcrypt password hashing.
- JWT authentication.
- Protected API routes.
- Server-controlled registration roles.
- Zod input validation.
- Helmet security headers.
- Configured CORS.
- Environment variable protection.
- Git exclusion of secrets and dependencies.

Additional financial authorization and transaction integrity controls will be documented after implementation and testing.

See [THREATS.md](THREATS.md) for security verification evidence.

---

## 8. Project Structure

```text
LedgerLine/
|
|-- server/
|   |-- config/
|   |   |-- db.js
|   |-- models/
|   |   |-- User.js
|   |-- controllers/
|   |   |-- authController.js
|   |-- routes/
|   |   |-- authRoutes.js
|   |-- middleware/
|   |   |-- authMiddleware.js
|   |-- services/
|   |-- utils/
|   |   |-- validators.js
|   |-- tests/
|   |   |-- auth.test.js
|   |   |-- health.test.js
|   |-- docs/
|   |-- server.js
|   |-- package.json
|   |-- package-lock.json
|   |-- .env.example
|
|-- client/
|   |-- src/
|       |-- components/
|       |-- pages/
|       |-- layouts/
|       |-- context/
|       |-- services/
|       |-- hooks/
|       |-- utils/
|       |-- App.jsx
|       |-- main.jsx
|
|-- .gitignore
|-- README.md
|-- PROMPTS.md
|-- THREATS.md
```

The structure will expand as additional modules are implemented.

---

## 9. Installation and Setup

### Prerequisites

- Node.js 24 or compatible version.
- npm.
- MongoDB Atlas account.
- Git.
- Postman.

### Step 1: Clone the repository

```bash
git clone https://github.com/UdayKiranBatchalakuri/LedgerLine.git

cd LedgerLine
```

### Step 2: Install backend dependencies

```bash
cd server

npm install
```

### Step 3: Configure environment variables

Create a `.env` file inside the `server` directory using `.env.example` as a reference.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

Replace placeholder values with your actual configuration.

**Never commit `.env` or expose database credentials and JWT secrets.**

### Step 4: Start the backend

Development mode:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

Backend URL:

```text
http://localhost:5000
```

---

## 10. Implemented API Endpoints

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API status |

### Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Not required |
| POST | `/api/auth/login` | Authenticate a user | Not required |
| GET | `/api/auth/me` | Retrieve authenticated user | Required |

### Registration Example

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Public registration assigns `ACCOUNT_HOLDER` by default.

### Login Example

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Protected Request

Include the JWT token in the Authorization header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Only implemented endpoints are listed as available APIs.

---

## 11. Testing

Run backend automated tests:

```bash
cd server

npm test
```

### Latest Verified Results

| Metric | Result |
|---|---:|
| Tests reported | 10 |
| Passed | 10 |
| Failed | 0 |

The current tests cover:

- Health endpoint.
- User registration.
- Invalid registration.
- Duplicate registration.
- Login.
- Incorrect credentials.
- Missing JWT.
- Invalid JWT.
- Valid JWT.
- Password hash exclusion from registration response.

These results represent the latest recorded test execution, not a guarantee of future executions.

---

## 12. Development Documentation

| File | Purpose |
|---|---|
| `README.md` | Project overview, architecture, setup, and API documentation |
| `PROMPTS.md` | AI usage and development history |
| `THREATS.md` | Threat model and security verification |

---

## 13. Version Control and Development Practices

LedgerLine is maintained using Git and GitHub.

Development practices:

- Commit meaningful completed features.
- Push verified work regularly.
- Keep commit messages descriptive.
- Review changes before committing.
- Never commit secrets or local dependencies.
- Maintain accurate implementation and testing records.

---

## 14. Project Goal

The goal of LedgerLine is to demonstrate secure backend engineering, financial data integrity, reliable API design, database transaction management, automated testing, and maintainable full-stack development.

**LedgerLine - Money movement with a ledger you can prove.**
---

**Project:** Snovasys Fresher Hiring Challenge 2026
**Repository:** [LedgerLine on GitHub](https://github.com/UdayKiranBatchalakuri/LedgerLine)
