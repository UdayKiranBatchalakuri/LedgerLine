
const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  depositMoney,
  withdrawMoney,
  transferMoney
} = require("../controllers/accountController");

const {
  getAccountTransactions,
  getTransactionById
} = require("../controllers/transactionController");

const router = express.Router();

// Deposit money
router.post("/deposit", protect, depositMoney);

// Withdraw money
router.post("/withdraw", protect, withdrawMoney);

// Transfer money
router.post("/transfer", protect, transferMoney);

// Assignment 7: Get account transaction history
router.get(
  "/account/:accountId",
  protect,
  getAccountTransactions
);

// Assignment 7: Get transaction details by ID
router.get(
  "/:transactionId",
  protect,
  getTransactionById
);

module.exports = router;
