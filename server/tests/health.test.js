
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../server");

test("GET /api/health should return 200", async () => {
  const response = await request(app)
    .get("/api/health");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(
    response.body.message,
    "LedgerLine API is running"
  );
});
