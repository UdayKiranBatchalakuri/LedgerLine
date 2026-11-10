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

test("LedgerLine fund transfer API tests", async (t) => {
  const createdUserIds = [];
  const createdAccountIds = [];

  try {
    assert.ok(process.env.MONGODB_TEST_URI, "MONGODB_TEST_URI is missing");
    assert.ok(process.env.JWT_SECRET, "JWT_SECRET is missing");

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    const makeUser = async (role = "ACCOUNT_HOLDER") => {
      const user = await User.create({
        name: "Transfer Test User",
        email: `transfer-${randomUUID()}@example.com`,
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

    const sourceAccount = await makeAccount(holder);
    const destinationAccount = await makeAccount(anotherHolder);
    const secondSourceAccount = await makeAccount(holder);

    const frozenSourceAccount = await makeAccount(holder, {
      status: "FROZEN"
    });

    const frozenDestinationAccount = await makeAccount(anotherHolder, {
      status: "FROZEN"
    });

    const holderToken = tokenFor(holder);
    const adminToken = tokenFor(admin);

    // ============================================
    // SUCCESSFUL TRANSFER
    // ============================================

    await t.test(
      "should complete a valid transfer and create two linked ledger entries",
      async () => {
        const sourceBefore = sourceAccount.balancePaise;
        const destinationBefore = destinationAccount.balancePaise;
        const amountPaise = 3000;

        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: sourceAccount._id.toString(),
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise,
            description: "Test fund transfer"
          });

        assert.equal(response.status, 201);
        assert.equal(response.body.success, true);

        const updatedSource = await Account.findById(
          sourceAccount._id
        );

        const updatedDestination = await Account.findById(
          destinationAccount._id
        );

        assert.equal(
          updatedSource.balancePaise,
          sourceBefore - amountPaise
        );

        assert.equal(
          updatedDestination.balancePaise,
          destinationBefore + amountPaise
        );

        const outgoing = await Transaction.findOne({
          account: sourceAccount._id,
          type: "TRANSFER",
          transferDirection: "OUTGOING"
        });

        const incoming = await Transaction.findOne({
          account: destinationAccount._id,
          type: "TRANSFER",
          transferDirection: "INCOMING"
        });

        assert.ok(outgoing);
        assert.ok(incoming);

        assert.equal(outgoing.amountPaise, amountPaise);
        assert.equal(incoming.amountPaise, amountPaise);

        assert.equal(
          outgoing.balanceAfterPaise,
          sourceBefore - amountPaise
        );

        assert.equal(
          incoming.balanceAfterPaise,
          destinationBefore + amountPaise
        );

        assert.equal(outgoing.transferId, incoming.transferId);
        assert.notEqual(outgoing.reference, incoming.reference);

        assert.equal(outgoing.description, "Test fund transfer");
        assert.equal(incoming.description, "Test fund transfer");
      }
    );

    // ============================================
    // AUTHENTICATION
    // ============================================

    await t.test(
      "should reject a transfer without authentication",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .send({
            sourceAccountId: sourceAccount._id.toString(),
            destinationAccountId: destinationAccount._id.toString(),
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
            .post("/api/transactions/transfer")
            .set("Authorization", `Bearer ${holderToken}`)
            .set("Idempotency-Key", randomUUID())
            .send({
              sourceAccountId: sourceAccount._id.toString(),
              destinationAccountId: destinationAccount._id.toString(),
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
      "should reject invalid source and destination account IDs",
      async () => {
        const invalidSource = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: "invalid-id",
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(invalidSource.status, 400);

        const invalidDestination = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: sourceAccount._id.toString(),
            destinationAccountId: "invalid-id",
            amountPaise: 1000
          });

        assert.equal(invalidDestination.status, 400);
      }
    );

    // ============================================
    // SAME ACCOUNT VALIDATION
    // ============================================

    await t.test(
      "should reject transfers between the same account",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: sourceAccount._id.toString(),
            destinationAccountId: sourceAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 400);
      }
    );

    // ============================================
    // OWNERSHIP VALIDATION
    // ============================================

    await t.test(
      "should reject a transfer from another user's source account",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: destinationAccount._id.toString(),
            destinationAccountId: secondSourceAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // ROLE VALIDATION
    // ============================================

    await t.test(
      "should reject transfers by an ADMIN",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${adminToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: sourceAccount._id.toString(),
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 403);
      }
    );

    // ============================================
    // MISSING SOURCE ACCOUNT
    // ============================================

    await t.test(
      "should reject a missing source account",
      async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: missingId.toString(),
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // MISSING DESTINATION ACCOUNT
    // ============================================

    await t.test(
      "should reject a missing destination account",
      async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: secondSourceAccount._id.toString(),
            destinationAccountId: missingId.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 404);
      }
    );

    // ============================================
    // FROZEN SOURCE ACCOUNT
    // ============================================

    await t.test(
      "should reject a frozen source account",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: frozenSourceAccount._id.toString(),
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 409);
      }
    );

    // ============================================
    // FROZEN DESTINATION ACCOUNT
    // ============================================

    await t.test(
      "should reject a frozen destination account",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: secondSourceAccount._id.toString(),
            destinationAccountId: frozenDestinationAccount._id.toString(),
            amountPaise: 1000
          });

        assert.equal(response.status, 409);

        const unchangedSource = await Account.findById(
          secondSourceAccount._id
        );

        assert.equal(unchangedSource.balancePaise, 10000);
      }
    );

    // ============================================
    // INSUFFICIENT BALANCE
    // ============================================

    await t.test(
      "should prevent overdrafts and preserve both account balances",
      async () => {
        const lowBalanceSource = await makeAccount(holder, {
          balancePaise: 2000
        });

        const destinationBefore = await Account.findById(
          destinationAccount._id
        );

        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: lowBalanceSource._id.toString(),
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise: 3000
          });

        assert.equal(response.status, 409);

        const sourceAfter = await Account.findById(
          lowBalanceSource._id
        );

        const destinationAfter = await Account.findById(
          destinationAccount._id
        );

        assert.equal(sourceAfter.balancePaise, 2000);

        assert.equal(
          destinationAfter.balancePaise,
          destinationBefore.balancePaise
        );

        const transactionCount = await Transaction.countDocuments({
          account: lowBalanceSource._id,
          type: "TRANSFER"
        });

        assert.equal(transactionCount, 0);
      }
    );

    // ============================================
    // DESTINATION BALANCE OVERFLOW
    // ============================================

    await t.test(
      "should reject a transfer that would overflow the destination balance",
      async () => {
        const overflowSource = await makeAccount(holder, {
          balancePaise: 5000
        });

        const overflowDestination = await makeAccount(anotherHolder, {
          balancePaise: Number.MAX_SAFE_INTEGER - 100
        });

        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: overflowSource._id.toString(),
            destinationAccountId: overflowDestination._id.toString(),
            amountPaise: 500
          });

        assert.equal(response.status, 409);

        const sourceAfter = await Account.findById(
          overflowSource._id
        );

        const destinationAfter = await Account.findById(
          overflowDestination._id
        );

        assert.equal(sourceAfter.balancePaise, 5000);

        assert.equal(
          destinationAfter.balancePaise,
          Number.MAX_SAFE_INTEGER - 100
        );
      }
    );

    // ============================================
    // DESCRIPTION VALIDATION
    // ============================================

    await t.test(
      "should reject descriptions longer than 200 characters",
      async () => {
        const response = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", randomUUID())
          .send({
            sourceAccountId: secondSourceAccount._id.toString(),
            destinationAccountId: destinationAccount._id.toString(),
            amountPaise: 1000,
            description: "x".repeat(201)
          });

        assert.equal(response.status, 400);
      }
    );

    // ============================================
    // TRANSACTION ROLLBACK
    // ============================================

    await t.test(
      "should roll back both balances if ledger creation fails",
      async () => {
        const rollbackSource = await makeAccount(holder);
        const rollbackDestination = await makeAccount(anotherHolder);

        const sourceBefore = rollbackSource.balancePaise;
        const destinationBefore = rollbackDestination.balancePaise;

        const originalCreate = Transaction.create;

        try {
          Transaction.create = async () => {
            throw new Error("Simulated transfer ledger failure");
          };

          const response = await request(app)
            .post("/api/transactions/transfer")
            .set("Authorization", `Bearer ${holderToken}`)
            .set("Idempotency-Key", randomUUID())
            .send({
              sourceAccountId: rollbackSource._id.toString(),
              destinationAccountId: rollbackDestination._id.toString(),
              amountPaise: 2500
            });

          assert.equal(response.status, 500);

          const sourceAfter = await Account.findById(
            rollbackSource._id
          );

          const destinationAfter = await Account.findById(
            rollbackDestination._id
          );

          assert.equal(sourceAfter.balancePaise, sourceBefore);
          assert.equal(destinationAfter.balancePaise, destinationBefore);

          const transactionCount = await Transaction.countDocuments({
            account: {
              $in: [rollbackSource._id, rollbackDestination._id]
            }
          });

          assert.equal(transactionCount, 0);
        } finally {
          Transaction.create = originalCreate;
        }
      }
    );

    // ============================================
    // CONCURRENT TRANSFERS
    // ============================================

    await t.test(
      "should preserve balances during concurrent transfers without overdrafts",
      async () => {
        const concurrentSource = await makeAccount(holder, {
          balancePaise: 10000
        });

        const concurrentDestination = await makeAccount(anotherHolder, {
          balancePaise: 5000
        });

        const startingTotal =
          concurrentSource.balancePaise +
          concurrentDestination.balancePaise;

        const transferAmount = 1500;
        const numberOfTransfers = 8;

        const responses = await Promise.all(
          Array.from({ length: numberOfTransfers }, () =>
            request(app)
              .post("/api/transactions/transfer")
              .set("Authorization", `Bearer ${holderToken}`)
              .set("Idempotency-Key", randomUUID())
              .send({
                sourceAccountId: concurrentSource._id.toString(),
                destinationAccountId: concurrentDestination._id.toString(),
                amountPaise: transferAmount,
                description: "Concurrent transfer test"
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

        const finalSource = await Account.findById(
          concurrentSource._id
        );

        const finalDestination = await Account.findById(
          concurrentDestination._id
        );

        assert.equal(
          finalSource.balancePaise,
          10000 - 6 * transferAmount
        );

        assert.equal(
          finalDestination.balancePaise,
          5000 + 6 * transferAmount
        );

        assert.ok(finalSource.balancePaise >= 0);

        assert.equal(
          finalSource.balancePaise + finalDestination.balancePaise,
          startingTotal
        );

        const outgoingTransactions = await Transaction.find({
          account: concurrentSource._id,
          type: "TRANSFER",
          transferDirection: "OUTGOING"
        });

        const incomingTransactions = await Transaction.find({
          account: concurrentDestination._id,
          type: "TRANSFER",
          transferDirection: "INCOMING"
        });

        assert.equal(outgoingTransactions.length, 6);
        assert.equal(incomingTransactions.length, 6);

        const outgoingTransferIds = outgoingTransactions
          .map((transaction) => transaction.transferId)
          .sort();

        const incomingTransferIds = incomingTransactions
          .map((transaction) => transaction.transferId)
          .sort();

        assert.deepEqual(outgoingTransferIds, incomingTransferIds);
      }
    );

    // ============================================
    // IDEMPOTENCY
    // ============================================

    await t.test(
      "should apply a repeated transfer idempotency key only once",
      async () => {
        const idempotentSource = await makeAccount(holder);
        const idempotentDestination = await makeAccount(anotherHolder);

        const idempotencyKey = randomUUID();

        const payload = {
          sourceAccountId: idempotentSource._id.toString(),
          destinationAccountId: idempotentDestination._id.toString(),
          amountPaise: 2200,
          description: "Idempotent transfer test"
        };

        const firstResponse = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send(payload);

        const secondResponse = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send(payload);

        assert.equal(firstResponse.status, 201);
        assert.equal(secondResponse.status, 200);

        const sourceAfter = await Account.findById(
          idempotentSource._id
        );

        const destinationAfter = await Account.findById(
          idempotentDestination._id
        );

        assert.equal(sourceAfter.balancePaise, 7800);
        assert.equal(destinationAfter.balancePaise, 12200);

        const outgoingCount = await Transaction.countDocuments({
          account: idempotentSource._id,
          type: "TRANSFER",
          transferDirection: "OUTGOING"
        });

        const incomingCount = await Transaction.countDocuments({
          account: idempotentDestination._id,
          type: "TRANSFER",
          transferDirection: "INCOMING"
        });

        assert.equal(outgoingCount, 1);
        assert.equal(incomingCount, 1);

        // Reusing the key with a different amount must fail.
        const changedPayloadResponse = await request(app)
          .post("/api/transactions/transfer")
          .set("Authorization", `Bearer ${holderToken}`)
          .set("Idempotency-Key", idempotencyKey)
          .send({
            ...payload,
            amountPaise: 3300
          });

        assert.equal(changedPayloadResponse.status, 409);

        const unchangedSource = await Account.findById(
          idempotentSource._id
        );

        const unchangedDestination = await Account.findById(
          idempotentDestination._id
        );

        assert.equal(unchangedSource.balancePaise, 7800);
        assert.equal(unchangedDestination.balancePaise, 12200);
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