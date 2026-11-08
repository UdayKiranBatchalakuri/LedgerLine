
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

test("LedgerLine Admin and Auditor API tests", async (t) => {
  const createdUserIds = [];
  const createdAccountIds = [];

  try {
    assert.ok(process.env.MONGODB_TEST_URI, "MONGODB_TEST_URI is missing");
    assert.ok(process.env.JWT_SECRET, "JWT_SECRET is missing");

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    // Create temporary test users
    const createUser = async (role) => {
      const user = await User.create({
        name: `${role} Test User`,
        email: `${randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
        role,
        status: "ACTIVE"
      });

      createdUserIds.push(user._id);
      return user;
    };

    // Generate JWT token
    const generateToken = (user) => {
      return jwt.sign(
        { role: user.role },
        process.env.JWT_SECRET,
        {
          subject: user._id.toString(),
          expiresIn: "1h"
        }
      );
    };

    // Create temporary test accounts
    const createAccount = async (owner, balancePaise = 0) => {
      const account = await Account.create({
        owner: owner._id,
        accountNumber: `LLTEST${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        accountType: "SAVINGS",
        balancePaise,
        currency: "INR",
        status: "ACTIVE"
      });

      createdAccountIds.push(account._id);
      return account;
    };

    // Setup test users
    const admin = await createUser("ADMIN");
    const auditor = await createUser("AUDITOR");
    const holder = await createUser("ACCOUNT_HOLDER");
    const anotherHolder = await createUser("ACCOUNT_HOLDER");

    const adminToken = generateToken(admin);
    const auditorToken = generateToken(auditor);
    const holderToken = generateToken(holder);

    // Setup test accounts
    const holderAccount = await createAccount(holder, 100000);
    const emptyAccount = await createAccount(anotherHolder, 0);

    // ==========================================
    // USER LISTING TESTS
    // ==========================================

    await t.test("ADMIN should be able to list users", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.ok(Array.isArray(response.body.users));

      assert.ok(
        response.body.users.some(
          (user) => user.email === holder.email
        )
      );
    });

    await t.test("AUDITOR should be able to list users", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${auditorToken}`);

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.ok(Array.isArray(response.body.users));
    });

    await t.test(
      "ACCOUNT_HOLDER should not be able to list users",
      async () => {
        const response = await request(app)
          .get("/api/admin/users")
          .set("Authorization", `Bearer ${holderToken}`);

        assert.equal(response.statusCode, 403);
      }
    );

    await t.test(
      "User listing should never expose password hashes",
      async () => {
        const response = await request(app)
          .get("/api/admin/users")
          .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(response.statusCode, 200);

        for (const user of response.body.users) {
          assert.equal(
            Object.prototype.hasOwnProperty.call(user, "passwordHash"),
            false
          );
        }
      }
    );

    await t.test(
      "User listing should support pagination and role filtering",
      async () => {
        const response = await request(app)
          .get("/api/admin/users?page=1&limit=2&role=ACCOUNT_HOLDER")
          .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(response.statusCode, 200);
        assert.ok(response.body.users.length <= 2);
        assert.equal(response.body.pagination.page, 1);
        assert.equal(response.body.pagination.limit, 2);

        assert.ok(
          response.body.users.every(
            (user) => user.role === "ACCOUNT_HOLDER"
          )
        );
      }
    );

    await t.test(
      "User listing should reject invalid pagination",
      async () => {
        const response = await request(app)
          .get("/api/admin/users?page=0&limit=10")
          .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(response.statusCode, 400);
      }
    );

    // ==========================================
    // USER STATUS TESTS
    // ==========================================

    await t.test("ADMIN should suspend a user", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "SUSPENDED" });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.user.status, "SUSPENDED");

      const updatedUser = await User.findById(holder._id);
      assert.equal(updatedUser.status, "SUSPENDED");
    });

    await t.test("ADMIN should reactivate a suspended user", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ACTIVE" });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.user.status, "ACTIVE");
    });

    await t.test(
      "AUDITOR should not be able to suspend a user",
      async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${holder._id}/status`)
          .set("Authorization", `Bearer ${auditorToken}`)
          .send({ status: "SUSPENDED" });

        assert.equal(response.statusCode, 403);
      }
    );

    await t.test(
      "ADMIN should not change their own account status",
      async () => {
        const response = await request(app)
          .patch(`/api/admin/users/${admin._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "SUSPENDED" });

        assert.equal(response.statusCode, 400);
      }
    );

    await t.test("Reject invalid user status", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "BLOCKED" });

      assert.equal(response.statusCode, 400);
    });

    // ==========================================
    // USER ROLE TESTS
    // ==========================================

    await t.test("ADMIN should change a user's role", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "AUDITOR" });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.user.role, "AUDITOR");

      const updatedUser = await User.findById(holder._id);
      assert.equal(updatedUser.role, "AUDITOR");
    });

    await t.test("AUDITOR should not change a user's role", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${anotherHolder._id}/role`)
        .set("Authorization", `Bearer ${auditorToken}`)
        .send({ role: "ADMIN" });

      assert.equal(response.statusCode, 403);
    });

    await t.test("Reject invalid user role", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${anotherHolder._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "SUPERADMIN" });

      assert.equal(response.statusCode, 400);
    });

    await t.test("ADMIN cannot change their own role", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${admin._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "ACCOUNT_HOLDER" });

      assert.equal(response.statusCode, 400);
    });

    // ==========================================
    // ACCOUNT STATUS TESTS
    // ==========================================

    await t.test("ADMIN should freeze an account", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${holderAccount._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "FROZEN" });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.account.status, "FROZEN");

      const updatedAccount = await Account.findById(holderAccount._id);
      assert.equal(updatedAccount.status, "FROZEN");
    });

    await t.test("ADMIN should reactivate a frozen account", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${holderAccount._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ACTIVE" });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.account.status, "ACTIVE");
    });

    await t.test(
      "AUDITOR should not change account status",
      async () => {
        const response = await request(app)
          .patch(`/api/admin/accounts/${holderAccount._id}/status`)
          .set("Authorization", `Bearer ${auditorToken}`)
          .send({ status: "FROZEN" });

        assert.equal(response.statusCode, 403);
      }
    );

    await t.test(
      "ADMIN should reject closing an account with a positive balance",
      async () => {
        const response = await request(app)
          .patch(`/api/admin/accounts/${holderAccount._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "CLOSED" });

        assert.equal(response.statusCode, 409);

        const account = await Account.findById(holderAccount._id);
        assert.equal(account.status, "ACTIVE");
        assert.equal(account.balancePaise, 100000);
      }
    );

    await t.test("ADMIN should close an empty account", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${emptyAccount._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "CLOSED" });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.account.status, "CLOSED");
    });

    await t.test(
      "A closed account should not be reactivated",
      async () => {
        const response = await request(app)
          .patch(`/api/admin/accounts/${emptyAccount._id}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: "ACTIVE" });

        assert.equal(response.statusCode, 409);
      }
    );

    await t.test("Reject invalid account status", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${holderAccount._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "BLOCKED" });

      assert.equal(response.statusCode, 400);
    });

    // ==========================================
    // VALIDATION AND AUTHENTICATION TESTS
    // ==========================================

    await t.test("Reject invalid user ID", async () => {
      const response = await request(app)
        .patch("/api/admin/users/invalid-id/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "SUSPENDED" });

      assert.equal(response.statusCode, 400);
    });

    await t.test("Reject invalid account ID", async () => {
      const response = await request(app)
        .patch("/api/admin/accounts/invalid-id/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "FROZEN" });

      assert.equal(response.statusCode, 400);
    });

    await t.test(
      "Reject user listing without authentication",
      async () => {
        const response = await request(app)
          .get("/api/admin/users");

        assert.equal(response.statusCode, 401);
      }
    );

  } finally {
    try {
      if (createdAccountIds.length > 0) {
        await Account.deleteMany({
          _id: { $in: createdAccountIds }
        });
      }

      if (createdUserIds.length > 0) {
        await User.deleteMany({
          _id: { $in: createdUserIds }
        });
      }
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }
});
