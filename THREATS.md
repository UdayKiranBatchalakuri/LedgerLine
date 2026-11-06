# LedgerLine — Threat Model & Security Verification

## 1. Security Objectives

- Protect user credentials.
- Prevent unauthorized API access.
- Prevent privilege escalation.
- Validate incoming user input.
- Protect sensitive configuration.
- Maintain secure authentication.

---

## 2. Implemented Security Controls

| ID | Threat | Implemented Mitigation |
|---|---|---|
| T01 | Password exposure | bcrypt password hashing |
| T02 | Unauthorized API access | JWT authentication middleware |
| T03 | Privilege escalation | Server-controlled registration role |
| T04 | Invalid or expired JWT | JWT signature and expiration verification |
| T05 | Suspended user access | Database-backed user status check |
| T06 | Duplicate registration | Unique email constraint and duplicate-key handling |
| T07 | Invalid registration/login input | Zod validation |
| T08 | Cross-origin requests | Explicit CORS origin configuration |
| T09 | Sensitive configuration exposure | `.env` and `.gitignore` configuration |

---

## 3. Implemented Security Details

### Password Security
- Passwords are hashed using bcryptjs.
- Hashing cost factor is configured as 12.
- Plain-text passwords are not stored.
- `passwordHash` is excluded from normal User queries.
- Password hashes are not returned in registration responses.

### Authentication Security
- JWT-based authentication is implemented.
- Bearer tokens are extracted from the Authorization header.
- JWT signatures and expiration are verified.
- Protected endpoints require authentication.
- Authenticated users are loaded from MongoDB.
- Suspended users are denied access.

### Registration Security
- Public registration assigns ACCOUNT_HOLDER by default.
- Users cannot assign themselves ADMIN or AUDITOR roles.
- Duplicate email registration is handled.

### API Security
- Zod validation is implemented for registration and login.
- Express JSON request body size is limited to 20 KB.
- Helmet security headers are enabled.
- CORS uses a configured frontend origin.

### Configuration Security
- Sensitive configuration is stored in `.env`.
- `.env` is excluded through `.gitignore`.
- `.env.example` contains placeholder configuration.
- `node_modules` is excluded from Git.

---

## 4. Security Verification Evidence

| Test | Result |
|---|---|
| Invalid registration | Passed |
| Successful registration | Passed |
| Duplicate registration | Passed |
| Public role escalation attempt | Passed |
| Successful login | Passed |
| Incorrect password | Passed |
| Missing JWT | Passed |
| Invalid JWT | Passed |
| Valid JWT | Passed |
| Password hash omitted from response | Passed |
| Health endpoint | Passed |
| `.env` Git ignore check | Passed |
| `node_modules` Git ignore check | Passed |

### Automated Test Results

Command: `npm test`

- Tests reported: 10
- Passed: 10
- Failed: 0

---

## 5. MongoDB Atlas Network Access Incident

During development, MongoDB Atlas connectivity failed after changing networks.

A broad temporary IPv4 allowlist rule (`0.0.0.0/0`) was used during troubleshooting.

**Security precaution:** Remove the unrestricted rule if it is still active. Use restricted IP access for ongoing development.

---

## 6. Security Documentation Integrity

Only security controls implemented and verified in the current application are described as implemented in this document.
