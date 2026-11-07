
const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Account = require("../models/Account");

test("Account model validation", async (t) => {
  const ownerId = new mongoose.Types.ObjectId();

  await t.test("should accept valid account data", async () => {
    const account = new Account({
      owner: ownerId,
      accountNumber: "LL1000000001",
      accountType: "SAVINGS"
    });

    await assert.doesNotReject(() => account.validate());

    assert.equal(account.balancePaise, 0);
    assert.equal(account.currency, "INR");
    assert.equal(account.status, "ACTIVE");
  });

  await t.test("should reject account without owner", async () => {
    const account = new Account({
      accountNumber: "LL1000000002",
      accountType: "SAVINGS"
    });

    await assert.rejects(() => account.validate());
  });

  await t.test("should reject invalid account type", async () => {
    const account = new Account({
      owner: ownerId,
      accountNumber: "LL1000000003",
      accountType: "BUSINESS"
    });

    await assert.rejects(() => account.validate());
  });

  await t.test("should reject negative balance", async () => {
    const account = new Account({
      owner: ownerId,
      accountNumber: "LL1000000004",
      accountType: "SAVINGS",
      balancePaise: -100
    });

    await assert.rejects(() => account.validate());
  });

  await t.test("should reject decimal balance", async () => {
    const account = new Account({
      owner: ownerId,
      accountNumber: "LL1000000005",
      accountType: "SAVINGS",
      balancePaise: 100.50
    });

    await assert.rejects(() => account.validate());
  });

  await t.test("should reject invalid account status", async () => {
    const account = new Account({
      owner: ownerId,
      accountNumber: "LL1000000006",
      accountType: "SAVINGS",
      status: "BLOCKED"
    });

    await assert.rejects(() => account.validate());
  });
});
