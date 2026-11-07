
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

test("LedgerLine account API tests", async (t) => {
  const testUsers = [];

  try {
    // Connect to the separate test database
    assert.ok(
      process.env.MONGODB_TEST_URI,
      "MONGODB_TEST_URI is missing"
    );

    assert.ok(
      process.env.JWT_SECRET,
      "JWT_SECRET is missing"
    );

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    // Helper: create temporary test users
    const createTestUser = async (role) => {
      const user = await User.create({
        name: `${role} Test User`,
        email: `${role.toLowerCase()}-${randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
        role
      });

      testUsers.push(user);
      return user;
    };

    // Helper: generate JWT
    const generateToken = (user) => {
      return jwt.sign(
        { role: user.role },
        process.env.JWT_SECRET,
        {
          subject: user._id.toString(),
          expiresIn: "10m"
        }
      );
    };

    // Create users with different roles
    const accountHolder = await createTestUser("ACCOUNT_HOLDER");
    const anotherHolder = await createTestUser("ACCOUNT_HOLDER");
    const admin = await createTestUser("ADMIN");
    const auditor = await createTestUser("AUDITOR");

    const holderToken = generateToken(accountHolder);
    const adminToken = generateToken(admin);
    const auditorToken = generateToken(auditor);

    // Create two accounts belonging to different users
    const accountOne = await Account.create({
      owner: accountHolder._id,
      accountNumber: `LLTEST${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      accountType: "SAVINGS",
      balancePaise: 100000
    });

    const accountTwo = await Account.create({
      owner: anotherHolder._id,
      accountNumber: `LLTEST${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      accountType: "CURRENT",
      balancePaise: 200000
    });

    // ==========================================
    // TASK 5: ACCOUNT LISTING API TESTS
    // ==========================================

    // Test 1: Account holder sees only their own accounts
    await t.test(
      "ACCOUNT_HOLDER should see only their own accounts",
      async () => {
        const response = await request(app)
          .get("/api/accounts")
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.statusCode, 200);
        assert.equal(response.body.success, true);

        assert.ok(
          response.body.accounts.length >= 1
        );

        assert.ok(
          response.body.accounts.every(
            (account) =>
              account.owner === accountHolder._id.toString()
          )
        );

        const accountNumbers = response.body.accounts.map(
          (account) => account.accountNumber
        );

        assert.ok(accountNumbers.includes(accountOne.accountNumber));
      }
    );

    // Test 2: Account holder cannot see another user's account
    await t.test(
      "ACCOUNT_HOLDER should not see another user's account",
      async () => {
        const response = await request(app)
          .get("/api/accounts")
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.statusCode, 200);

        const accountNumbers = response.body.accounts.map(
          (account) => account.accountNumber
        );

        assert.ok(
          !accountNumbers.includes(accountTwo.accountNumber)
        );
      }
    );

    // Test 3: Admin can see all accounts
    await t.test(
      "ADMIN should see all accounts",
      async () => {
        const response = await request(app)
          .get("/api/accounts")
          .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(response.statusCode, 200);
        assert.equal(response.body.success, true);

        const accountNumbers = response.body.accounts.map(
          (account) => account.accountNumber
        );

        assert.ok(accountNumbers.includes(accountOne.accountNumber));
        assert.ok(accountNumbers.includes(accountTwo.accountNumber));
      }
    );

    // Test 4: Auditor can see all accounts
    await t.test(
      "AUDITOR should see all accounts",
      async () => {
        const response = await request(app)
          .get("/api/accounts")
          .set("Authorization", `Bearer ${auditorToken}`);

        assert.equal(response.statusCode, 200);
        assert.equal(response.body.success, true);

        const accountNumbers = response.body.accounts.map(
          (account) => account.accountNumber
        );

        assert.ok(accountNumbers.includes(accountOne.accountNumber));
        assert.ok(accountNumbers.includes(accountTwo.accountNumber));
      }
    );

    // Test 5: Reject missing authentication
    await t.test(
      "GET accounts should reject missing authentication",
      async () => {
        const response = await request(app)
          .get("/api/accounts");

        assert.equal(response.statusCode, 401);
      }
    );

    // ==========================================
    // ACCOUNT CREATION API TESTS
    // ==========================================

    // Test 6: Create account for authenticated user
    await t.test(
      "should create account for authenticated user",
      async () => {
        const response = await request(app)
          .post("/api/accounts")
          .set("Authorization", `Bearer ${holderToken}`)
          .send({ accountType: "SAVINGS" });

        assert.equal(response.statusCode, 201);
        assert.equal(
          response.body.account.owner,
          accountHolder._id.toString()
        );
        assert.equal(response.body.account.accountType, "SAVINGS");
        assert.equal(response.body.account.balancePaise, 0);
      }
    );

    // Test 7: Reject unauthenticated account creation
    await t.test(
      "should reject account creation without authentication",
      async () => {
        const response = await request(app)
          .post("/api/accounts")
          .send({ accountType: "SAVINGS" });

        assert.equal(response.statusCode, 401);
      }
    );

    // Test 8: Reject invalid account type
    await t.test(
      "should reject invalid account type",
      async () => {
        const response = await request(app)
          .post("/api/accounts")
          .set("Authorization", `Bearer ${holderToken}`)
          .send({ accountType: "BUSINESS" });

        assert.equal(response.statusCode, 400);
      }
    );

    // Test 9: Ignore client-supplied owner and balance
    await t.test(
      "should ignore client-supplied owner and balance",
      async () => {
        const anotherUserId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .post("/api/accounts")
          .set("Authorization", `Bearer ${holderToken}`)
          .send({
            accountType: "SAVINGS",
            owner: anotherUserId.toString(),
            balancePaise: 500000
          });

        assert.equal(response.statusCode, 201);

        assert.equal(
          response.body.account.owner,
          accountHolder._id.toString()
        );

        assert.equal(response.body.account.balancePaise, 0);
      }
    );

  } finally {
    // Clean up temporary test accounts and users
    try {
      if (testUsers.length > 0) {
        const userIds = testUsers.map((user) => user._id);

        await Account.deleteMany({
          owner: { $in: userIds }
        });

        await User.deleteMany({
          _id: { $in: userIds }
        });
      }
    } finally {
      // Always close the MongoDB connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }
});
