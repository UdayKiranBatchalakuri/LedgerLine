# PROMPTS.md — AI Usage Log

**Project:** LedgerLine  
**Challenge:** Snovasys Fresher Hiring Challenge 2026

This document records how AI tools were used during development, including suggestions, mistakes, corrections, and human verification.

## November 6, 2026 — Day 1

### 1. Project Structure
- **Task:** Create the MERN project structure.
- **AI assistance:** Suggested separate frontend, backend, configuration, services, and testing directories.
- **My decision:** Reviewed and created the structure.

### 2. Technology Selection
- **Task:** Finalize the MERN architecture.
- **AI assistance:** Suggested React, Express, Node.js, and MongoDB Atlas.
- **My decision:** Selected MERN and prioritized secure backend financial operations.

### 3. Dependency Security
- **Task:** Initialize backend dependencies.
- **Issue:** Initial development dependencies produced 20 npm audit vulnerabilities.
- **Correction:** Removed Jest and Nodemon and used Node.js built-in testing and watch functionality.
- **Verification:** `npm audit` reported 0 vulnerabilities.

### 4. Express API
- **Task:** Create the Express server and health endpoint.
- **AI assistance:** Suggested middleware configuration and endpoint implementation.
- **My verification:** Health endpoint returned HTTP 200.

### 5. Automated Testing
- **Task:** Test the health endpoint.
- **AI assistance:** Suggested Node.js `node:test` and Supertest.
- **Verification:** 1 test passed, 0 failed.

### 6. Git Security
- **Task:** Review files before the first commit.
- **AI assistance:** Suggested `.gitignore` checks.
- **Verification:** `server/.env` and `server/node_modules` were confirmed ignored.

## Future Development Entries

For every significant AI-assisted task, record:
- Actual prompt or clearly labelled summary.
- AI suggestion.
- Mistake or limitation discovered.
- Human correction.
- Test evidence.
- Related Git commit hash.

**Integrity note:** Only genuine development activities and verification results are recorded here.