
require("dotenv").config();

const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const request = require("supertest");

const app = require("../server");
const User = require("../models/User");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

test("LedgerLine transaction history API tests", async (t) => {
  const createdUserIds = [];
  const createdAccountIds = [];

  try {
    assert.ok(process.env.MONGODB_TEST_URI, "MONGODB_TEST_URI is missing");
    assert.ok(process.env.JWT_SECRET, "JWT_SECRET is missing");

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    const makeUser = async (role = "ACCOUNT_HOLDER") => {
      const user = await User.create({
        name: "Transaction History Test User",
        email: `history-${randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
        role,
        status: "ACTIVE"
      });

      createdUserIds.push(user._id);
      return user;
    };

    const makeAccount = async (owner, overrides = {}) => {
      const account = await Account.create({
        owner: owner._id,
        accountNumber: `LL${randomUUID().replaceAll("-", "").slice(0, 10)}`,
        accountType: "SAVINGS",
        balancePaise: 100000,
        currency: "INR",
        status: "ACTIVE",
        ...overrides
      });

      createdAccountIds.push(account._id);
      return account;
    };

    const tokenFor = (user) =>
      jwt.sign(
        { sub: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

    const holder = await makeUser();
    const anotherHolder = await makeUser();
    const admin = await makeUser("ADMIN");
    const auditor = await makeUser("AUDITOR");

    const holderAccount = await makeAccount(holder);
    const anotherAccount = await makeAccount(anotherHolder);

    const holderToken = tokenFor(holder);
    const anotherHolderToken = tokenFor(anotherHolder);
    const adminToken = tokenFor(admin);
    const auditorToken = tokenFor(auditor);

    const createTransaction = async (
      account,
      owner,
      type,
      amountPaise,
      balanceAfterPaise
    ) => {
      return Transaction.create({
        account: account._id,
        owner: owner._id,
        type,
        amountPaise,
        balanceAfterPaise,
        reference: `HISTORY-${randomUUID()}`
      });
    };

    const deposit = await createTransaction(
      holderAccount,
      holder,
      "DEPOSIT",
      50000,
      150000
    );

    await createTransaction(
      holderAccount,
      holder,
      "WITHDRAWAL",
      20000,
      130000
    );

    await createTransaction(
      anotherAccount,
      anotherHolder,
      "DEPOSIT",
      30000,
      130000
    );

    // ============================================
    // ACCOUNT TRANSACTION HISTORY
    // ============================================

    await t.test(
      "should return transaction history for the account owner",
      async () => {
        const response = await request(app)
          .get(`/api/transactions/account/${holderAccount._id}`)
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.transactions.length, 2);
        assert.equal(
          response.body.pagination.totalTransactions,
          2
        );
      }
    );

    // ============================================
    // PAGINATION
    // ============================================

    await t.test(
      "should support transaction history pagination",
      async () => {
        const response = await request(app)
          .get(
            `/api/transactions/account/${holderAccount._id}?page=1&limit=1`
          )
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.transactions.length, 1);
        assert.equal(response.body.pagination.page, 1);
        assert.equal(response.body.pagination.limit, 1);
        assert.equal(response.body.pagination.totalPages, 2);
        assert.equal(response.body.pagination.hasNextPage, true);
      }
    );

    // ============================================
    // TYPE FILTER
    // ============================================

    await t.test(
      "should filter transactions by type",
      async () => {
        const response = await request(app)
          .get(
            `/api/transactions/account/${holderAccount._id}?type=DEPOSIT`
          )
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.transactions.length, 1);
        assert.equal(response.body.transactions[0].type, "DEPOSIT");
      }
    );

    // ============================================
    // INVALID TYPE
    // ============================================

    await t.test(
      "should reject an invalid transaction type",
      async () => {
        const response = await request(app)
          .get(
            `/api/transactions/account/${holderAccount._id}?type=INVALID`
          )
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 400);
      }
    );

    // ============================================
    // DATE FILTER
    // ============================================

    await t.test(
      "should support transaction date filtering",
      async () => {
        const date = deposit.createdAt.toISOString().slice(0, 10);

        const response = await request(app)
          .get(
            `/api/transactions/account/${holderAccount._id}?startDate=${date}&endDate=${date}`
          )
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 200);

        assert.ok(
          response.body.transactions.every((transaction) =>
            transaction.createdAt.startsWith(date)
          )
        );
      }
    );

    // ============================================
    // ACCOUNT OWNERSHIP
    // ============================================

    await t.test(
      "should prevent users from viewing another user's account history",
      async () => {
        const response = await request(app)
          .get(`/api/transactions/account/${anotherAccount._id}`)
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // TRANSACTION DETAILS
    // ============================================

    await t.test(
      "should return transaction details by ID",
      async () => {
        const response = await request(app)
          .get(`/api/transactions/${deposit._id}`)
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 200);
        assert.equal(
          response.body.transaction._id,
          deposit._id.toString()
        );
      }
    );

    // ============================================
    // TRANSACTION OWNERSHIP
    // ============================================

    await t.test(
      "should prevent users from viewing another user's transaction",
      async () => {
        const otherTransaction = await Transaction.findOne({
          account: anotherAccount._id
        });

        const response = await request(app)
          .get(`/api/transactions/${otherTransaction._id}`)
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // ADMIN ACCESS
    // ============================================

    await t.test(
      "should allow ADMIN to view account transaction history",
      async () => {
        const response = await request(app)
          .get(`/api/transactions/account/${anotherAccount._id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.transactions.length, 1);
      }
    );

    // ============================================
    // AUDITOR ACCESS
    // ============================================

    await t.test(
      "should allow AUDITOR to view account transaction history",
      async () => {
        const response = await request(app)
          .get(`/api/transactions/account/${anotherAccount._id}`)
          .set("Authorization", `Bearer ${auditorToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.transactions.length, 1);
      }
    );

    // ============================================
    // AUTHENTICATION
    // ============================================

    await t.test(
      "should reject unauthenticated transaction history requests",
      async () => {
        const response = await request(app)
          .get(`/api/transactions/account/${holderAccount._id}`);

        assert.equal(response.status, 401);
      }
    );

    // ============================================
    // INVALID ACCOUNT ID
    // ============================================

    await t.test(
      "should reject an invalid account ID",
      async () => {
        const response = await request(app)
          .get("/api/transactions/account/invalid-id")
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 400);
      }
    );

    // ============================================
    // MISSING TRANSACTION
    // ============================================

    await t.test(
      "should return 404 for a missing transaction",
      async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .get(`/api/transactions/${missingId}`)
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // INVALID TRANSACTION ID
    // ============================================

    await t.test(
      "should reject an invalid transaction ID",
      async () => {
        const response = await request(app)
          .get("/api/transactions/invalid-id")
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.status, 400);
      }
    );

  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        if (createdAccountIds.length > 0) {
          await Transaction.deleteMany({
            account: { $in: createdAccountIds }
          });

          await Account.deleteMany({
            _id: { $in: createdAccountIds }
          });
        }

        if (createdUserIds.length > 0) {
          await User.deleteMany({
            _id: { $in: createdUserIds }
          });
        }
      }
    } finally {
      await mongoose.disconnect();
    }
  }
});
