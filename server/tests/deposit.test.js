
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

test("LedgerLine deposit API tests", async (t) => {
  const createdUserIds = [];
  const createdAccountIds = [];

  try {
    assert.ok(process.env.MONGODB_TEST_URI, "MONGODB_TEST_URI is missing");
    assert.ok(process.env.JWT_SECRET, "JWT_SECRET is missing");

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    const makeUser = async (role = "ACCOUNT_HOLDER") => {
      const user = await User.create({
        name: "Deposit Test User",
        email: `deposit-${randomUUID()}@example.com`,
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

    const initialBalance = account.balancePaise;

    await t.test("should complete a valid deposit and create a ledger entry", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: account._id.toString(),
          amountPaise: 5000,
          description: "Test deposit"
        });

      assert.equal(response.status, 201);
      assert.equal(response.body.success, true);
      assert.equal(response.body.balancePaise, initialBalance + 5000);

      const updatedAccount = await Account.findById(account._id);
      assert.equal(updatedAccount.balancePaise, initialBalance + 5000);

      const transaction = await Transaction.findOne({
        account: account._id,
        type: "DEPOSIT"
      });

      assert.ok(transaction);
      assert.equal(transaction.amountPaise, 5000);
      assert.equal(transaction.balanceAfterPaise, initialBalance + 5000);
      assert.equal(transaction.description, "Test deposit");
    });

    await t.test("should reject a deposit without authentication", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .send({
          accountId: account._id.toString(),
          amountPaise: 1000
        });

      assert.equal(response.status, 401);
    });

    await t.test("should reject zero, negative and decimal amounts", async () => {
      for (const amountPaise of [
        0,
        -100,
        10.5,
        Number.MAX_SAFE_INTEGER + 1
      ]) {
        const response = await request(app)
          .post("/api/transactions/deposit")
          .set("Authorization", `Bearer ${holderToken}`)
          .send({
            accountId: account._id.toString(),
            amountPaise
          });

        assert.equal(response.status, 400);
      }
    });

    await t.test("should reject an invalid account ID", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: "invalid-id",
          amountPaise: 1000
        });

      assert.equal(response.status, 400);
    });

    await t.test("should reject deposits into another user's account", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: anotherAccount._id.toString(),
          amountPaise: 1000
        });

      assert.equal(response.status, 404);
    });

    await t.test("should reject deposits into a frozen account", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: frozenAccount._id.toString(),
          amountPaise: 1000
        });

      assert.equal(response.status, 409);
    });

    await t.test("should reject deposits by an ADMIN", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          accountId: account._id.toString(),
          amountPaise: 1000
        });

      assert.equal(response.status, 403);
    });

    await t.test("should reject an account that does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: missingId.toString(),
          amountPaise: 1000
        });

      assert.equal(response.status, 404);
    });

    await t.test("should reject descriptions longer than 200 characters", async () => {
      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: account._id.toString(),
          amountPaise: 1000,
          description: "x".repeat(201)
        });

      assert.equal(response.status, 400);
    });

    await t.test("should not change balance when a deposit is rejected", async () => {
      const before = await Account.findById(account._id);

      const response = await request(app)
        .post("/api/transactions/deposit")
        .set("Authorization", `Bearer ${holderToken}`)
        .send({
          accountId: frozenAccount._id.toString(),
          amountPaise: 1000
        });

      assert.equal(response.status, 409);

      const after = await Account.findById(account._id);
      assert.equal(after.balancePaise, before.balancePaise);
    });

    // Test atomic rollback when the ledger insert fails.
    await t.test("should roll back the balance if ledger creation fails", async () => {
      const rollbackAccount = await makeAccount(holder);
      const beforeBalance = rollbackAccount.balancePaise;

      const originalCreate = Transaction.create;

      try {
        Transaction.create = async () => {
          throw new Error("Simulated ledger write failure");
        };

        const response = await request(app)
          .post("/api/transactions/deposit")
          .set("Authorization", `Bearer ${holderToken}`)
          .send({
            accountId: rollbackAccount._id.toString(),
            amountPaise: 2500
          });

        assert.equal(response.status, 500);

        const afterAccount = await Account.findById(rollbackAccount._id);

        assert.equal(afterAccount.balancePaise, beforeBalance);

        const transactionCount = await Transaction.countDocuments({
          account: rollbackAccount._id
        });

        assert.equal(transactionCount, 0);
      } finally {
        Transaction.create = originalCreate;
      }
    });

    // Test simultaneous deposits against the same account.
    await t.test("should process concurrent deposits without losing updates", async () => {
      const concurrentAccount = await makeAccount(holder);

      const startingBalance = concurrentAccount.balancePaise;
      const depositAmount = 1250;
      const numberOfDeposits = 8;

      const responses = await Promise.all(
        Array.from({ length: numberOfDeposits }, () =>
          request(app)
            .post("/api/transactions/deposit")
            .set("Authorization", `Bearer ${holderToken}`)
            .send({
              accountId: concurrentAccount._id.toString(),
              amountPaise: depositAmount,
              description: "Concurrent deposit test"
            })
        )
      );

      for (const response of responses) {
        assert.equal(response.status, 201);
      }

      const finalAccount = await Account.findById(concurrentAccount._id);

      assert.equal(
        finalAccount.balancePaise,
        startingBalance + numberOfDeposits * depositAmount
      );

      const transactions = await Transaction.find({
        account: concurrentAccount._id,
        type: "DEPOSIT"
      }).sort({ balanceAfterPaise: 1 });

      assert.equal(transactions.length, numberOfDeposits);

      const expectedBalances = Array.from(
        { length: numberOfDeposits },
        (_, index) => startingBalance + (index + 1) * depositAmount
      );

      assert.deepEqual(
        transactions.map((transaction) => transaction.balanceAfterPaise),
        expectedBalances
      );
    });

  } finally {
    // Clean up only records created by this test.
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
