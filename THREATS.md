# THREATS.md — Security Threat Analysis

**Project:** LedgerLine  
**Challenge:** Snovasys Fresher Hiring Challenge 2026  
**Date:** November 6, 2026

## Security Threats & Mitigations

### 1. Unauthorized Account Access
**Threat:** Users accessing accounts that do not belong to them.  
**Mitigation:** Server-side authentication and account ownership checks.

### 2. Duplicate Transfers
**Threat:** The same transfer executing multiple times due to retries.  
**Mitigation:** Idempotency keys and unique database constraints.

### 3. Double Spending
**Threat:** Concurrent withdrawals exceeding the available balance.  
**Mitigation:** Atomic balance updates and MongoDB transactions.

### 4. Invalid Transaction Amounts
**Threat:** Negative, zero, or manipulated amounts.  
**Mitigation:** Server-side validation and integer-based money storage (paise).

### 5. Privilege Escalation
**Threat:** Users accessing administrator-only operations.  
**Mitigation:** Role-based access control and permission checks.

### 6. Ledger Tampering
**Threat:** Unauthorized modification or deletion of financial records.  
**Mitigation:** Immutable ledger entries and restricted write access.

### 7. Partial Transactions
**Threat:** Debit succeeds but credit fails during a transfer.  
**Mitigation:** MongoDB transactions with automatic rollback.

### 8. Authentication Attacks
**Threat:** Password theft, brute-force attempts, or invalid tokens.  
**Mitigation:** bcrypt password hashing, JWT validation, and rate limiting.

### 9. Malicious Input
**Threat:** Invalid input manipulating application or database operations.  
**Mitigation:** Zod validation and safe database queries.

### 10. Secret Exposure
**Threat:** Database credentials or JWT secrets leaking through GitHub or logs.  
**Mitigation:** Environment variables and Git ignore rules.

### 11. Denial of Service
**Threat:** Excessive requests affecting application availability.  
**Mitigation:** Rate limiting and request-size restrictions.

## Financial Integrity Rules

- Account balances must never become negative.
- Every transfer must debit and credit equal amounts.
- Duplicate transactions must be prevented.
- Failed transactions must not leave partial changes.
- Every transaction must be traceable.

# **## Initial Verification — November 6, 2026

| Check | Result |
|---|---|
| npm audit | 0 vulnerabilities |
| `.env` Git ignore | Passed |
| `node_modules` Git ignore | Passed |
| Health endpoint | HTTP 200 |
| Automated test | 1 passed |**

## Implementation Status

**Verified:** Initial API, health endpoint, automated test, dependency audit, and Git ignore checks.

**Pending:** Authentication, authorization, idempotency, concurrency protection, ledger integrity, and transaction rollback.

Security controls will be marked verified only after implementation and testing.

**Principle:** Every financial operation must be secure, consistent, and traceable.