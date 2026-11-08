# LedgerLine — Threat Model & Security Verification

## 1. Security Objectives
- Protect user credentials and sensitive information.
- Prevent unauthorized API access.
- Prevent privilege escalation.
- Validate incoming requests.
- Protect financial transactions and ledger records.
- Maintain account balance consistency.
- Secure administrative operations and audit records.

---

## 2. Technology and Security Controls
- Authentication: JWT
- Password hashing: bcryptjs
- Validation: Zod
- Database: MongoDB Atlas
- API protection: Helmet and CORS
- Authorization: Role-based middleware
- Financial consistency: MongoDB transactions
- Testing: Node.js Test Runner and Supertest

---

## 3. Authentication Security

| Threat | Implemented Mitigation |
|---|---|
| Password exposure | bcrypt hashing with cost factor 12 |
| Unauthorized API access | JWT authentication middleware |
| Invalid or expired JWT | Signature and expiration verification |
| Privilege escalation | Server-controlled registration role |
| Suspended user access | Database-backed status validation |
| Duplicate registration | Unique email constraint |
| Invalid input | Zod validation |
| Password hash exposure | Restricted User model fields |

### Verification
- Registration and login tested.
- Invalid credentials rejected.
- Missing and invalid tokens rejected.
- Public role escalation prevented.
- Password hashes excluded from API responses.
- Protected routes verified.

---

## 4. API and Configuration Security
- Express JSON request body limited to 20 KB.
- Helmet security headers enabled.
- CORS configured for the frontend origin.
- Environment variables stored in `.env`.
- `.env` excluded through `.gitignore`.
- `.env.example` contains placeholder values.
- `node_modules` excluded from Git.

---

## 5. Account Management Security

| Threat | Implemented Mitigation |
|---|---|
| Unauthorized account access | Ownership validation |
| Client-supplied ownership | Backend-assigned owner |
| Client-supplied balance | Backend-controlled balance |
| Duplicate account numbers | Unique account number constraint |
| Unauthorized visibility | ADMIN/AUDITOR restrictions |

### Verification
- Account creation and listing.
- Ownership isolation.
- Role-based access.
- Invalid account handling.

---

## 6. Deposit Management Security

| Threat | Implemented Mitigation |
|---|---|
| Invalid deposit amount | Positive safe-integer validation in paise |
| Unauthorized deposit | JWT and ownership checks |
| Frozen account deposit | ACTIVE status validation |
| Balance inconsistency | MongoDB transaction |
| Ledger insertion failure | Transaction rollback |
| Concurrent deposits | Atomic balance increment |
| Balance overflow | Safe-integer validation |

### Verification
- Successful deposit and ledger creation.
- Invalid amount and unauthorized requests.
- Frozen account rejection.
- Ledger rollback simulation.
- Eight simultaneous deposits.
- Final balance and ledger consistency.

---

## 7. Withdrawal Management Security

| Threat | Implemented Mitigation |
|---|---|
| Unauthorized withdrawal | JWT and ownership validation |
| Invalid amount | Positive amount validation |
| Account overdraft | Sufficient-balance validation |
| Frozen account withdrawal | ACTIVE status check |
| Ledger inconsistency | MongoDB transaction |
| Missing account | Account existence validation |

### Verification
- Successful withdrawal.
- Insufficient balance rejection.
- Invalid amount handling.
- Ownership and authorization.
- Transaction rollback scenarios.

---

## 8. Fund Transfer Security

| Threat | Implemented Mitigation |
|---|---|
| Unauthorized transfer | Authentication and ownership checks |
| Same-account transfer | Source/destination validation |
| Insufficient funds | Source balance validation |
| Frozen account transfer | Account status checks |
| Missing account | Account existence validation |
| Partial transfer | MongoDB transaction |
| Missing ledger entry | Paired transaction records |

### Verification
- Successful fund transfers.
- Insufficient balance rejection.
- Same-account transfer rejection.
- Paired outgoing and incoming records.
- Transaction rollback scenarios.

---

## 9. Transaction History Security
- Implemented authenticated transaction history retrieval.
- Added individual transaction detail retrieval.
- Added pagination and filtering.
- Enforced account ownership checks.
- Restricted account-holder access to owned transactions.
- Enabled ADMIN and AUDITOR visibility.

### Verification
- Transaction history retrieval.
- Transaction detail retrieval.
- Pagination and filtering.
- Authorization checks.
- Postman API verification.

---

## 10. Administrative Security

| Threat | Implemented Mitigation |
|---|---|
| Unauthorized user management | ADMIN-only authorization |
| Unauthorized account changes | ADMIN-only authorization |
| Self-suspension | Self-modification checks |
| Self-role modification | Self-modification checks |
| Removing last administrator | Active-admin safeguard |
| Closing funded account | Positive-balance validation |
| Reopening closed account | Closed-status validation |
| Password hash exposure | Restricted response fields |

### Verification
- User listing and filtering.
- User suspension and reactivation.
- Role modification.
- Account freezing and reactivation.
- Positive-balance closure rejection.
- ADMIN, AUDITOR and ACCOUNT_HOLDER permissions.

---

## 11. Administrative Audit Trail
- Created AuditLog Mongoose model.
- Recorded administrative actors and actions.
- Stored target entity and change details.
- Implemented audit log listing and detail APIs.
- Added pagination and filtering.
- Restricted retrieval to ADMIN and AUDITOR.
- Prevented ACCOUNT_HOLDER access.

### Recorded Events
- USER_SUSPENDED
- USER_REACTIVATED
- USER_ROLE_CHANGED
- ACCOUNT_FROZEN
- ACCOUNT_ACTIVATED
- ACCOUNT_CLOSED

### Verification
- Audit record creation.
- Role-based retrieval.
- Pagination and filtering.
- Invalid ID handling.
- Failed operation audit checks.
- Duplicate audit record checks.

---

## 12. Security Test Evidence

| Test Group | Reported Result |
|---|---|
| Authentication | Passed |
| Account management | Passed |
| Deposit management | Passed |
| Withdrawal management | Passed |
| Fund transfers | Passed |
| Transaction history | Passed |
| Administration | Passed |
| Audit trail | Passed |
| Environment ignore checks | Passed |

### Reported Test Results
- Authentication: 10 passed, 0 failed.
- Earlier regression run: 111 passed, 0 failed.
- Latest audit-related execution: 131 passed, 0 failed.

---

## 13. MongoDB Atlas Network Incident
- Atlas connectivity failed after a development network change.
- A temporary `0.0.0.0/0` allowlist rule was used during troubleshooting.
- Database connectivity was restored.
- Restricted IP access is recommended.

---

## 14. Security Documentation Integrity
- Only implemented controls are documented as implemented.
- Test results reflect reported execution output.
- Failed tests and resolutions are documented.
- Git commits represent genuine development work.
- Secrets and `.env` files must never be committed.
- AI-assisted implementation and debugging are documented transparently.
