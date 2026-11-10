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

test("LedgerLine withdrawal API tests", async (t) => {
  const createdUserIds = [];
  const createdAccountIds = [];

  try {
    assert.ok(process.env.MONGODB_TEST_URI, "MONGODB_TEST_URI is missing");
    assert.ok(process.env.JWT_SECRET, "JWT_SECRET is missing");

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    const makeUser = async (role = "ACCOUNT_HOLDER") => {
      const user = await User.create({
        name: "Withdrawal Test User",
        email: `withdrawal-${randomUUID()}@example.com`,
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
        balancePaise: 10000,
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

    const account = await makeAccount(holder);
    const anotherAccount = await makeAccount(anotherHolder);
    const frozenAccount = await makeAccount(holder, {
      status: "FROZEN"
    });

    const holderToken = tokenFor(holder);
    const adminToken = tokenFor(admin);

    // ============================================
    // SUCCESSFUL WITHDRAWAL
    // ============================================

    await t.test(
      "should complete a valid withdrawal and create a ledger entry",
      async () => {
        const initialBalance = account.balancePaise;

        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: account._id.toString(),
            amountPaise: 3000,
            description: "Test withdrawal"
          });

        assert.equal(response.status, 201);
        assert.equal(response.body.success, true);
        assert.equal(
          response.body.balancePaise,
          initialBalance - 3000
        );

        const updatedAccount = await Account.findById(account._id);

        assert.equal(
          updatedAccount.balancePaise,
          initialBalance - 3000
        );

        const transaction = await Transaction.findOne({
          account: account._id,
          type: "WITHDRAWAL"
        });

        assert.ok(transaction);
        assert.equal(transaction.amountPaise, 3000);
        assert.equal(
          transaction.balanceAfterPaise,
          initialBalance - 3000
        );
        assert.equal(transaction.description, "Test withdrawal");
      }
    );

    // ============================================
    // AUTHENTICATION
    // ============================================

    await t.test(
      "should reject a withdrawal without authentication",
      async () => {
        const response = await request(app)
          .post("/api/transactions/withdraw")
          .send({
            accountId: account._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 401);
      }
    );

    // ============================================
    // AMOUNT VALIDATION
    // ============================================

    await t.test(
      "should reject zero, negative, decimal and unsafe amounts",
      async () => {
        for (const amountPaise of [
          0,
          -100,
          10.5,
          Number.MAX_SAFE_INTEGER + 1
        ]) {
          const response = await request(app)
            .post("/api/transactions/withdraw")
            .set("Authorization", `Bearer ${holderToken}`)
            .set("Idempotency-Key", randomUUID())
            .send({
              accountId: account._id.toString(),
              amountPaise
            });

          assert.equal(response.status, 400);
        }
      }
    );

    // ============================================
    // ACCOUNT ID VALIDATION
    // ============================================

    await t.test(
      "should reject an invalid account ID",
      async () => {
        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: "invalid-id",
            amountPaise: 1000
          });

        assert.equal(response.status, 400);
      }
    );

    // ============================================
    // OWNERSHIP VALIDATION
    // ============================================

    await t.test(
      "should reject withdrawals from another user's account",
      async () => {
        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: anotherAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // FROZEN ACCOUNT
    // ============================================

    await t.test(
      "should reject withdrawals from a frozen account",
      async () => {
        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: frozenAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 409);
      }
    );

    // ============================================
    // ROLE VALIDATION
    // ============================================

    await t.test(
      "should reject withdrawals by an ADMIN",
      async () => {
        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${adminToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: account._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 403);
      }
    );

    // ============================================
    // MISSING ACCOUNT
    // ============================================

    await t.test(
      "should reject an account that does not exist",
      async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: missingId.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // DESCRIPTION VALIDATION
    // ============================================

    await t.test(
      "should reject descriptions longer than 200 characters",
      async () => {
        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: account._id.toString(),
            amountPaise: 1000,
            description: "x".repeat(201)
          });

        assert.equal(response.status, 400);
      }
    );

    // ============================================
    // INSUFFICIENT BALANCE
    // ============================================

    await t.test(
      "should prevent overdrafts and preserve the balance",
      async () => {
        const insufficientAccount = await makeAccount(holder, {
          balancePaise: 2000
        });

        const before = insufficientAccount.balancePaise;

        const response = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            accountId: insufficientAccount._id.toString(),
            amountPaise: 3000
          });

        assert.equal(response.status, 409);

        const after = await Account.findById(
          insufficientAccount._id
        );

        assert.equal(after.balancePaise, before);

        const transactionCount = await Transaction.countDocuments({
          account: insufficientAccount._id
        });

        assert.equal(transactionCount, 0);
      }
    );

    // ============================================
    // TRANSACTION ROLLBACK
    // ============================================

    await t.test(
      "should roll back the balance if ledger creation fails",
      async () => {
        const rollbackAccount = await makeAccount(holder);
        const beforeBalance = rollbackAccount.balancePaise;

        const originalCreate = Transaction.create;

        try {
          Transaction.create = async () => {
            throw new Error("Simulated ledger write failure");
          };

          const response = await request(app)
            .post("/api/transactions/withdraw")
            .set("Authorization", `Bearer ${holderToken}`)
            .set("Idempotency-Key", randomUUID())
            .send({
              accountId: rollbackAccount._id.toString(),
              amountPaise: 2500
            });

          assert.equal(response.status, 500);

          const afterAccount = await Account.findById(
            rollbackAccount._id
          );

          assert.equal(
            afterAccount.balancePaise,
            beforeBalance
          );

          const transactionCount = await Transaction.countDocuments({
            account: rollbackAccount._id
          });

          assert.equal(transactionCount, 0);
        } finally {
          Transaction.create = originalCreate;
        }
      }
    );

    // ============================================
    // CONCURRENT WITHDRAWALS
    // ============================================

    await t.test(
      "should prevent overdrafts during concurrent withdrawals",
      async () => {
        const concurrentAccount = await makeAccount(holder, {
          balancePaise: 10000
        });

        const startingBalance = concurrentAccount.balancePaise;
        const withdrawalAmount = 1500;
        const numberOfWithdrawals = 8;

        const responses = await Promise.all(
          Array.from({ length: numberOfWithdrawals }, () =>
            request(app)
              .post("/api/transactions/withdraw")
              .set("Authorization", `Bearer ${holderToken}`)
              .set("Idempotency-Key", randomUUID())
              .send({
                accountId: concurrentAccount._id.toString(),
                amountPaise: withdrawalAmount,
                description: "Concurrent withdrawal test"
              })
          )
        );

        const successfulResponses = responses.filter(
          (response) => response.status === 201
        );

        const rejectedResponses = responses.filter(
          (response) => response.status === 409
        );

        assert.equal(successfulResponses.length, 6);
        assert.equal(rejectedResponses.length, 2);

        const finalAccount = await Account.findById(
          concurrentAccount._id
        );

        assert.equal(
          finalAccount.balancePaise,
          startingBalance - 6 * withdrawalAmount
        );

        assert.ok(finalAccount.balancePaise >= 0);

        const transactions = await Transaction.find({
          account: concurrentAccount._id,
          type: "WITHDRAWAL"
        });

        assert.equal(transactions.length, 6);

        const expectedBalances = [
          1000,
          2500,
          4000,
          5500,
          7000,
          8500
        ];

        const actualBalances = transactions
          .map((transaction) => transaction.balanceAfterPaise)
          .sort((a, b) => a - b);

        assert.deepEqual(actualBalances, expectedBalances);
      }
    );

    // ============================================
    // IDEMPOTENCY
    // ============================================

    await t.test(
      "should apply a repeated withdrawal idempotency key only once",
      async () => {
        const idempotentAccount = await makeAccount(holder);
        const idempotencyKey = randomUUID();

        const payload = {
          accountId: idempotentAccount._id.toString(),
          amountPaise: 2200,
          description: "Idempotent withdrawal test"
        };

        const firstResponse = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send(payload);

        const secondResponse = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send(payload);

        assert.equal(firstResponse.status, 201);
        assert.equal(secondResponse.status, 200);

        const finalAccount = await Account.findById(
          idempotentAccount._id
        );

        assert.equal(finalAccount.balancePaise, 7800);

        const count = await Transaction.countDocuments({
          account: idempotentAccount._id,
          type: "WITHDRAWAL"
        });

        assert.equal(count, 1);

        // Reusing the same key with a changed amount must be rejected.
        const changedPayloadResponse = await request(app)
          .post("/api/transactions/withdraw")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send({
            ...payload,
            amountPaise: 3300
          });

        assert.equal(changedPayloadResponse.status, 409);

        const unchangedAccount = await Account.findById(
          idempotentAccount._id
        );

        assert.equal(unchangedAccount.balancePaise, 7800);
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