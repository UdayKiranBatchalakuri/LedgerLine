
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
const AuditLog = require("../models/AuditLog");

test("LedgerLine Audit Trail API tests", async (t) => {
  const createdUserIds = [];
  const createdAccountIds = [];
  const createdAuditIds = [];

  try {
    assert.ok(process.env.MONGODB_TEST_URI, "MONGODB_TEST_URI is missing");
    assert.ok(process.env.JWT_SECRET, "JWT_SECRET is missing");

    await mongoose.connect(process.env.MONGODB_TEST_URI);

    const createUser = async (role) => {
      const user = await User.create({
        name: `${role} Audit Test`,
        email: `${randomUUID()}@example.com`,
        passwordHash: "test-password-hash",
        role,
        status: "ACTIVE"
      });

      createdUserIds.push(user._id);
      return user;
    };

    const generateToken = (user) =>
      jwt.sign(
        { role: user.role },
        process.env.JWT_SECRET,
        {
          subject: user._id.toString(),
          expiresIn: "1h"
        }
      );

    const createAccount = async (owner) => {
      const account = await Account.create({
        owner: owner._id,
        accountNumber: `LLAUDIT${randomUUID().replace(/-/g, "").slice(0, 10)}`,
        accountType: "SAVINGS",
        balancePaise: 0,
        currency: "INR",
        status: "ACTIVE"
      });

      createdAccountIds.push(account._id);
      return account;
    };

    const admin = await createUser("ADMIN");
    const auditor = await createUser("AUDITOR");
    const holder = await createUser("ACCOUNT_HOLDER");
    const anotherHolder = await createUser("ACCOUNT_HOLDER");

    const adminToken = generateToken(admin);
    const auditorToken = generateToken(auditor);
    const holderToken = generateToken(holder);
    const anotherHolderToken = generateToken(anotherHolder);

    const account = await createAccount(holder);

    // ==========================================
    // ADMIN ACTIONS AND AUDIT RECORD CREATION
    // ==========================================

    await t.test("Suspending a user should create an audit record", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "SUSPENDED" });

      assert.equal(response.statusCode, 200);

      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "USER_SUSPENDED",
        targetId: holder._id
      });

      assert.ok(log);
      assert.equal(log.targetType, "USER");
      assert.equal(log.changes.field, "status");
      assert.equal(log.changes.previousValue, "ACTIVE");
      assert.equal(log.changes.newValue, "SUSPENDED");

      createdAuditIds.push(log._id);
    });

    await t.test("Reactivating a user should create an audit record", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ACTIVE" });

      assert.equal(response.statusCode, 200);

      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "USER_REACTIVATED",
        targetId: holder._id
      });

      assert.ok(log);
      assert.equal(log.changes.previousValue, "SUSPENDED");
      assert.equal(log.changes.newValue, "ACTIVE");

      createdAuditIds.push(log._id);
    });

    await t.test("Changing a user role should create an audit record", async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${holder._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "AUDITOR" });

      assert.equal(response.statusCode, 200);

      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "USER_ROLE_CHANGED",
        targetId: holder._id
      });

      assert.ok(log);
      assert.equal(log.changes.field, "role");
      assert.equal(log.changes.previousValue, "ACCOUNT_HOLDER");
      assert.equal(log.changes.newValue, "AUDITOR");

      createdAuditIds.push(log._id);
    });

    await t.test("Freezing an account should create an audit record", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${account._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "FROZEN" });

      assert.equal(response.statusCode, 200);

      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "ACCOUNT_FROZEN",
        targetId: account._id
      });

      assert.ok(log);
      assert.equal(log.targetType, "ACCOUNT");
      assert.equal(log.changes.previousValue, "ACTIVE");
      assert.equal(log.changes.newValue, "FROZEN");

      createdAuditIds.push(log._id);
    });

    await t.test("Activating an account should create an audit record", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${account._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ACTIVE" });

      assert.equal(response.statusCode, 200);

      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "ACCOUNT_ACTIVATED",
        targetId: account._id
      });

      assert.ok(log);
      assert.equal(log.changes.previousValue, "FROZEN");
      assert.equal(log.changes.newValue, "ACTIVE");

      createdAuditIds.push(log._id);
    });

    await t.test("Closing an empty account should create an audit record", async () => {
      const response = await request(app)
        .patch(`/api/admin/accounts/${account._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "CLOSED" });

      assert.equal(response.statusCode, 200);

      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "ACCOUNT_CLOSED",
        targetId: account._id
      });

      assert.ok(log);
      assert.equal(log.changes.previousValue, "ACTIVE");
      assert.equal(log.changes.newValue, "CLOSED");

      createdAuditIds.push(log._id);
    });

    // ==========================================
    // AUDIT LOG READING TESTS
    // ==========================================

    await t.test("ADMIN should be able to list audit logs", async () => {
      const response = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.ok(Array.isArray(response.body.auditLogs));

      assert.ok(
        response.body.auditLogs.some(
          (log) => log.targetId.toString() === holder._id.toString()
        )
      );
    });

    await t.test("AUDITOR should be able to list audit logs", async () => {
      const response = await request(app)
        .get("/api/audit-logs")
        .set("Authorization", `Bearer ${auditorToken}`);

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.ok(Array.isArray(response.body.auditLogs));
    });

    await t.test("ACCOUNT_HOLDER should not list audit logs", async () => {
  const response = await request(app)
    .get("/api/audit-logs")
    .set("Authorization", `Bearer ${anotherHolderToken}`);

  assert.equal(response.statusCode, 403);
});

    await t.test("Audit logs should support action filtering", async () => {
      const response = await request(app)
        .get("/api/audit-logs?action=USER_SUSPENDED")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 200);

      assert.ok(
        response.body.auditLogs.every(
          (log) => log.action === "USER_SUSPENDED"
        )
      );
    });

    await t.test("Audit logs should support pagination", async () => {
      const response = await request(app)
        .get("/api/audit-logs?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 200);
      assert.ok(response.body.auditLogs.length <= 2);
      assert.equal(response.body.pagination.page, 1);
      assert.equal(response.body.pagination.limit, 2);
    });

    await t.test("Audit logs should reject invalid pagination", async () => {
      const response = await request(app)
        .get("/api/audit-logs?page=0&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 400);
    });

    await t.test("Audit logs should reject invalid action filters", async () => {
      const response = await request(app)
        .get("/api/audit-logs?action=INVALID_ACTION")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 400);
    });

    await t.test("Audit log details should be retrievable by ID", async () => {
      const log = await AuditLog.findOne({
        actor: admin._id,
        action: "USER_SUSPENDED",
        targetId: holder._id
      });

      const response = await request(app)
        .get(`/api/audit-logs/${log._id}`)
        .set("Authorization", `Bearer ${auditorToken}`);

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.auditLog.action, "USER_SUSPENDED");
      assert.equal(
        response.body.auditLog.actor.email,
        admin.email
      );
    });

    await t.test("Audit log details should reject invalid IDs", async () => {
      const response = await request(app)
        .get("/api/audit-logs/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 400);
    });

    await t.test("Missing audit log should return 404", async () => {
      const missingId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/audit-logs/${missingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(response.statusCode, 404);
    });

    await t.test("Unauthenticated users should not read audit logs", async () => {
      const response = await request(app)
        .get("/api/audit-logs");

      assert.equal(response.statusCode, 401);
    });

    // ==========================================
    // FAILED ACTIONS MUST NOT CREATE AUDIT LOGS
    // ==========================================

    await t.test("Failed admin action should not create an audit record", async () => {
      const beforeCount = await AuditLog.countDocuments({
        targetId: anotherHolder._id
      });

      const response = await request(app)
        .patch(`/api/admin/users/${anotherHolder._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "INVALID_ROLE" });

      assert.equal(response.statusCode, 400);

      const afterCount = await AuditLog.countDocuments({
        targetId: anotherHolder._id
      });

      assert.equal(afterCount, beforeCount);
    });

    await t.test("Repeated status request should not create duplicate audit logs", async () => {
      const beforeCount = await AuditLog.countDocuments({
        targetId: anotherHolder._id,
        action: "USER_SUSPENDED"
      });

      const response = await request(app)
        .patch(`/api/admin/users/${anotherHolder._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ACTIVE" });

      assert.equal(response.statusCode, 200);

      const afterCount = await AuditLog.countDocuments({
        targetId: anotherHolder._id,
        action: "USER_SUSPENDED"
      });

      assert.equal(afterCount, beforeCount);
    });

  } finally {
    try {
      if (createdAuditIds.length > 0) {
        await AuditLog.deleteMany({
          _id: { $in: createdAuditIds }
        });
      }

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
