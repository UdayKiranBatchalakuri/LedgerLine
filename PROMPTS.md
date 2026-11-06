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
- Testing: Node.js built-in test runner + Supertest
- API Testing: Postman
- Version Control: Git + GitHub

---

# November 6, 2026

## Assignment 1 — Project Foundation

### Completed Work
- Selected MERN stack architecture.
- Created the initial project structure.
- Initialized Node.js backend.
- Configured Express 5.
- Connected MongoDB Atlas.
- Configured environment variables.
- Created `.env.example`.
- Configured `.gitignore` to exclude secrets and dependencies.
- Implemented API health endpoint.
- Configured Node.js built-in testing.
- Reviewed dependencies and removed unnecessary packages following an npm audit.

### AI Assistance
- Used AI to plan project architecture and folder structure.
- Used AI to troubleshoot backend initialization.
- Used AI to review dependencies and environment configuration.

### Verification
- Backend started successfully.
- MongoDB Atlas connection succeeded.
- Health endpoint returned HTTP 200.
- Health endpoint automated test passed.
- Dependency audit previously reported zero vulnerabilities after dependency cleanup.

---

## Assignment 2 — Authentication Module

### Completed Work

**User Model**
- Created User Mongoose model.
- Added name, email, passwordHash, role, and status fields.
- Configured ADMIN, ACCOUNT_HOLDER, and AUDITOR roles.
- Set ACCOUNT_HOLDER as the default registration role.
- Configured unique email constraint.

**Registration**
- Implemented registration API.
- Added Zod validation.
- Implemented bcrypt password hashing with cost factor 12.
- Added duplicate email handling.
- Prevented public users from assigning privileged roles.

**Login**
- Implemented login API.
- Added password verification using bcrypt.
- Implemented JWT generation and expiration.

**Authentication Middleware**
- Implemented Bearer token extraction.
- Added JWT signature and expiration verification.
- Loads authenticated user from MongoDB.
- Checks current user status.
- Implemented protected `/api/auth/me` endpoint.

**Testing**
- Created automated authentication tests using Supertest and Node.js test runner.
- Manually tested registration, login, and protected routes using Postman.

### AI Assistance
- Used AI to understand authentication architecture.
- Used AI to implement and review registration and login.
- Used AI to understand JWT middleware and protected routes.
- Used AI to troubleshoot MongoDB Atlas connectivity.
- Used AI to develop automated authentication tests.

### Issues Encountered
- MongoDB Atlas connection failed after changing the development network.
- Investigated Atlas Network Access configuration.
- Temporarily used a broad IP allowlist rule during troubleshooting.
- Restored connectivity and successfully executed the test suite.

### Verification
Command: `npm test`

- Tests reported: 10
- Passed: 10
- Failed: 0

Verified:
- Invalid registration rejected.
- Successful registration.
- Duplicate email rejected.
- Public role escalation prevented.
- Successful login.
- Incorrect password rejected.
- Missing JWT rejected.
- Invalid JWT rejected.
- Valid JWT accepted.
- Password hash not exposed in registration response.
- Health endpoint returned HTTP 200.

---

## Development Integrity

- AI-assisted work is documented transparently.
- Implementation and testing claims reflect actual results.
- Git commits represent meaningful development work.
- Secrets and `.env` files must never be committed.
