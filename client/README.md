# LedgerLine — Frontend Client Application

The modern React + Vite client portal for LedgerLine, a secure financial account and ledger management system.

## Features & Portals

The frontend implements dynamic post-login routing and dedicated portals for each system role:

- **Account Holder Portal (`/dashboard`)**:
  - Live balance card display (in INR/Paise) with account status badges (ACTIVE, FROZEN, CLOSED).
  - Quick account switcher with a 1-click **Copy Document ID** helper.
  - Interactive monetary workflows: **Deposit**, **Withdrawal** (with client & server overdraft prevention), and **Transfer** (with recipient ID input).
  - Searchable, filterable transaction history table with live status tags (`COMPLETED`, `FAILED`, `PENDING`).
  - **Forensic Cryptographic Proof Modal**: Inspect SHA-256 hash proofs, balances before/after, and audit IDs for any ledger movement.
- **Admin Portal (`/admin`)**:
  - Executive navy-themed management console.
  - System-wide user directory with search and status actions (Suspend/Reactivate).
  - Global account oversight with Freeze, Reactivate, and Close actions (with safeguard preventing closure of accounts holding positive balances).
  - Full administrative audit trail inspection table.
- **Auditor Portal (`/auditor`)**:
  - Strict read-only amber-themed regulatory and compliance console.
  - Total system reserve telemetry and volume metrics.
  - Read-only user directory and account inspection.
  - Full system transaction ledger with proof modal access.
  - Tamper-evident administrative audit trail with zero write controls.

## Tech Stack

- **Framework**: React 19 + Vite 6
- **Routing**: React Router 7 with role-based Route Guards (`ProtectedRoute.jsx`)
- **State & Auth**: React Context API (`AuthContext`) with persistent JWT handling and auto-logout on 401
- **Icons**: Lucide React
- **HTTP Client**: Axios with centralized error handling and bearer token interceptors

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
By default, the client points to `http://localhost:5000/api`. To point to a custom server:
Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

### 5. Lint
```bash
npm run lint
```
