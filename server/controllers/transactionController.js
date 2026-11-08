
const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const ALLOWED_ROLES = ["ACCOUNT_HOLDER", "ADMIN", "AUDITOR"];
const ALLOWED_TYPES = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"];

const parseDate = (value, fieldName, isEndDate = false) => {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    const error = new Error(`${fieldName} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }

  // Treat YYYY-MM-DD end dates as inclusive through the end of that day.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(
    dateOnly && isEndDate
      ? `${value}T23:59:59.999Z`
      : value
  );

  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }

  // Reject impossible calendar dates such as 2026-02-31.
  if (dateOnly) {
    const [year, month, day] = value.split("-").map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));

    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day
    ) {
      const error = new Error(`${fieldName} must be a valid date`);
      error.statusCode = 400;
      throw error;
    }
  }

  return date;
};

// GET /api/transactions/account/:accountId
const getAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { page = "1", limit = "10", type, startDate, endDate } = req.query;

    if (!mongoose.isValidObjectId(accountId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account ID"
      });
    }

    if (!ALLOWED_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view transactions"
      });
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer"
      });
    }

    if (
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 100"
      });
    }

    if (
      type !== undefined &&
      !ALLOWED_TYPES.includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type"
      });
    }

    const parsedStartDate = parseDate(startDate, "startDate");
    const parsedEndDate = parseDate(endDate, "endDate", true);

    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedStartDate > parsedEndDate
    ) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be later than endDate"
      });
    }

    const account = await Account.findById(accountId).select(
      "_id owner accountNumber accountType"
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // Account holders can only view their own accounts.
    // Admins and auditors can view accounts across the system.
    if (
      req.user.role === "ACCOUNT_HOLDER" &&
      account.owner.toString() !== req.user.id.toString()
    ) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    const filter = {
      account: account._id
    };

    if (type) {
      filter.type = type;
    }

    if (parsedStartDate || parsedEndDate) {
      filter.createdAt = {};

      if (parsedStartDate) {
        filter.createdAt.$gte = parsedStartDate;
      }

      if (parsedEndDate) {
        filter.createdAt.$lte = parsedEndDate;
      }
    }

    const skip = (pageNumber - 1) * pageSize;

    const [transactions, totalTransactions] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Transaction.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalTransactions / pageSize);

    return res.status(200).json({
      success: true,
      message: "Account transactions retrieved successfully",
      account: {
        id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType
      },
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalTransactions,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      },
      filters: {
        type: type || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate
      },
      transactions
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    console.error("Get account transactions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve account transactions"
    });
  }
};

// GET /api/transactions/:transactionId
const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!mongoose.isValidObjectId(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    if (!ALLOWED_ROLES.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this transaction"
      });
    }

    const transaction = await Transaction.findById(transactionId).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    if (
      req.user.role === "ACCOUNT_HOLDER" &&
      transaction.owner.toString() !== req.user.id.toString()
    ) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      transaction
    });
  } catch (error) {
    console.error("Get transaction by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transaction"
    });
  }
};

module.exports = {
  getAccountTransactions,
  getTransactionById
};
