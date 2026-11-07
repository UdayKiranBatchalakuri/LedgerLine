
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const { randomUUID } = require("node:crypto");

const app = require("../server");
const User = require("../models/User");

test("LedgerLine authentication API tests", async (t) => {
  const email = `ledgerline-test-${randomUUID()}@example.com`;
  const password = "Test@12345";
  let token;

  // Connect to the test database
 // Connect to the isolated test database
assert.ok(
  process.env.MONGODB_TEST_URI,
  "MONGODB_TEST_URI is missing"
);

await mongoose.connect(process.env.MONGODB_TEST_URI);

  try {
    // TEST 1: Invalid registration data
    await t.test("Registration should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          password
        });

      assert.equal(response.statusCode, 400);
      assert.equal(response.body.success, false);
    });

    // TEST 2: Successful registration
    await t.test("Registration should create a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "LedgerLine Test User",
          email,
          password
        });

      assert.equal(response.statusCode, 201);
      assert.equal(response.body.success, true);
      assert.equal(response.body.user.email, email);
      assert.equal(response.body.user.role, "ACCOUNT_HOLDER");

      // Password must not appear in the response
      assert.equal(response.body.user.passwordHash, undefined);
    });

    // TEST 3: Duplicate email
    await t.test("Registration should reject duplicate email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Another User",
          email,
          password
        });

      assert.equal(response.statusCode, 409);
    });

    // TEST 4: Successful login
    await t.test("Login should return a JWT token", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email,
          password
        });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.ok(response.body.token);

      token = response.body.token;
    });

    // TEST 5: Incorrect password
    await t.test("Login should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email,
          password: "WrongPassword123"
        });

      assert.equal(response.statusCode, 401);
      assert.equal(response.body.success, false);
    });

    // TEST 6: Protected route without token
    await t.test("Protected route should reject missing token", async () => {
      const response = await request(app)
        .get("/api/auth/me");

      assert.equal(response.statusCode, 401);
    });

    // TEST 7: Protected route with invalid token
    await t.test("Protected route should reject invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.value");

      assert.equal(response.statusCode, 401);
    });

    // TEST 8: Protected route with valid token
    await t.test("Protected route should accept valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.equal(response.body.user.email, email);
      assert.equal(response.body.user.role, "ACCOUNT_HOLDER");
    });

  } finally {
    // Remove only the user created by this test
    await User.deleteOne({ email });
    await mongoose.disconnect();
  }
});
