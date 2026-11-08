
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

// ============================================
// CREATE ACCOUNT
// ============================================
const createAccount = async (req, res) => {
  try {
    const { accountType } = req.body;

    if (!["SAVINGS", "CURRENT"].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: "Account type must be SAVINGS or CURRENT"
      });
    }

    let account;

    for (let attempt = 0; attempt < 5; attempt++) {
      const accountNumber = `LL${crypto.randomInt(
        1000000000,
        10000000000
      )}`;

      try {
        account = await Account.create({
          owner: req.user.id,
          accountNumber,
          accountType,
          balancePaise: 0
        });

        break;
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    if (!account) {
      return res.status(503).json({
        success: false,
        message: "Unable to generate a unique account number. Please retry."
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      account
    });

  } catch (error) {
    console.error("Account creation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account"
    });
  }
};


// ============================================
// GET ACCOUNTS BASED ON USER ROLE
// ============================================
const getAccounts = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "ACCOUNT_HOLDER") {
      filter.owner = req.user.id;
    } else if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "AUDITOR"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view accounts"
      });
    }

    const accounts = await Account.find(filter)
      .select(
        "owner accountNumber accountType balancePaise currency status createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: accounts.length,
      accounts
    });

  } catch (error) {
    console.error("Get accounts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve accounts"
    });
  }
};


// ============================================
// DEPOSIT MONEY
// ============================================
const depositMoney = async (req, res) => {
  const { accountId, amountPaise, description } = req.body;

  if (!mongoose.isValidObjectId(accountId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account ID"
    });
  }

  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Deposit amount must be a positive integer in paise"
    });
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || description.length > 200)
  ) {
    return res.status(400).json({
      success: false,
      message: "Description must be a string of at most 200 characters"
    });
  }

  if (req.user.role !== "ACCOUNT_HOLDER") {
    return res.status(403).json({
      success: false,
      message: "Only account holders can deposit money"
    });
  }

  const session = await mongoose.startSession();

  try {
    let result;
    const reference = crypto.randomUUID();

    await session.withTransaction(async () => {
      const account = await Account.findOneAndUpdate(
        {
          _id: accountId,
          owner: req.user.id,
          status: "ACTIVE",
          balancePaise: {
            $lte: Number.MAX_SAFE_INTEGER - amountPaise
          }
        },
        {
          $inc: {
            balancePaise: amountPaise
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!account) {
        const ownedAccount = await Account.findOne({
          _id: accountId,
          owner: req.user.id
        }).session(session);

        if (!ownedAccount) {
          const error = new Error("Account not found");
          error.statusCode = 404;
          throw error;
        }

        if (ownedAccount.status !== "ACTIVE") {
          const error = new Error("Account is not active");
          error.statusCode = 409;
          throw error;
        }

        const error = new Error("Account balance limit exceeded");
        error.statusCode = 409;
        throw error;
      }

      const [transaction] = await Transaction.create(
        [
          {
            account: account._id,
            owner: account.owner,
            type: "DEPOSIT",
            amountPaise,
            balanceAfterPaise: account.balancePaise,
            reference,
            description
          }
        ],
        {
          session,
          ordered: true
        }
      );

      result = {
        accountNumber: account.accountNumber,
        balancePaise: account.balancePaise,
        transaction
      };
    });

    return res.status(201).json({
      success: true,
      message: "Deposit completed successfully",
      ...result
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    console.error("Deposit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process deposit"
    });

  } finally {
    await session.endSession();
  }
};


// ============================================
// WITHDRAW MONEY
// ============================================
const withdrawMoney = async (req, res) => {
  const { accountId, amountPaise, description } = req.body;

  if (!mongoose.isValidObjectId(accountId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account ID"
    });
  }

  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Withdrawal amount must be a positive integer in paise"
    });
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || description.length > 200)
  ) {
    return res.status(400).json({
      success: false,
      message: "Description must be a string of at most 200 characters"
    });
  }

  if (req.user.role !== "ACCOUNT_HOLDER") {
    return res.status(403).json({
      success: false,
      message: "Only account holders can withdraw money"
    });
  }

  const session = await mongoose.startSession();

  try {
    let result;
    const reference = crypto.randomUUID();

    await session.withTransaction(async () => {
      const account = await Account.findOneAndUpdate(
        {
          _id: accountId,
          owner: req.user.id,
          status: "ACTIVE",
          balancePaise: {
            $gte: amountPaise
          }
        },
        {
          $inc: {
            balancePaise: -amountPaise
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!account) {
        const ownedAccount = await Account.findOne({
          _id: accountId,
          owner: req.user.id
        }).session(session);

        if (!ownedAccount) {
          const error = new Error("Account not found");
          error.statusCode = 404;
          throw error;
        }

        if (ownedAccount.status !== "ACTIVE") {
          const error = new Error("Account is not active");
          error.statusCode = 409;
          throw error;
        }

        const error = new Error("Insufficient account balance");
        error.statusCode = 409;
        throw error;
      }

      const [transaction] = await Transaction.create(
        [
          {
            account: account._id,
            owner: account.owner,
            type: "WITHDRAWAL",
            amountPaise,
            balanceAfterPaise: account.balancePaise,
            reference,
            description
          }
        ],
        {
          session,
          ordered: true
        }
      );

      result = {
        accountNumber: account.accountNumber,
        balancePaise: account.balancePaise,
        transaction
      };
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal completed successfully",
      ...result
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    console.error("Withdrawal error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process withdrawal"
    });

  } finally {
    await session.endSession();
  }
};


// ============================================
// FUND TRANSFER
// ============================================
const transferMoney = async (req, res) => {
  const {
    sourceAccountId,
    destinationAccountId,
    amountPaise,
    description
  } = req.body;

  // Validate source account ID
  if (!mongoose.isValidObjectId(sourceAccountId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid source account ID"
    });
  }

  // Validate destination account ID
  if (!mongoose.isValidObjectId(destinationAccountId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid destination account ID"
    });
  }

  const sourceId = new mongoose.Types.ObjectId(sourceAccountId);
  const destinationId = new mongoose.Types.ObjectId(destinationAccountId);

  // Prevent transfers to the same account
  if (sourceId.equals(destinationId)) {
    return res.status(400).json({
      success: false,
      message: "Source and destination accounts must be different"
    });
  }

  // Validate amount
  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Transfer amount must be a positive integer in paise"
    });
  }

  // Validate description
  if (
    description !== undefined &&
    (typeof description !== "string" || description.length > 200)
  ) {
    return res.status(400).json({
      success: false,
      message: "Description must be a string of at most 200 characters"
    });
  }

  if (req.user.role !== "ACCOUNT_HOLDER") {
    return res.status(403).json({
      success: false,
      message: "Only account holders can transfer money"
    });
  }

  const session = await mongoose.startSession();

  try {
    let result;

    const transferId = crypto.randomUUID();
    const outgoingReference = crypto.randomUUID();
    const incomingReference = crypto.randomUUID();

    await session.withTransaction(async () => {

      // STEP 1: Debit source account
      const sourceAccount = await Account.findOneAndUpdate(
        {
          _id: sourceId,
          owner: req.user.id,
          status: "ACTIVE",
          balancePaise: {
            $gte: amountPaise
          }
        },
        {
          $inc: {
            balancePaise: -amountPaise
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!sourceAccount) {
        const ownedSource = await Account.findOne({
          _id: sourceId,
          owner: req.user.id
        }).session(session);

        if (!ownedSource) {
          const error = new Error("Source account not found");
          error.statusCode = 404;
          throw error;
        }

        if (ownedSource.status !== "ACTIVE") {
          const error = new Error("Source account is not active");
          error.statusCode = 409;
          throw error;
        }

        const error = new Error("Insufficient source account balance");
        error.statusCode = 409;
        throw error;
      }

      // STEP 2: Credit destination account
      const destinationAccount = await Account.findOneAndUpdate(
        {
          _id: destinationId,
          status: "ACTIVE",
          balancePaise: {
            $lte: Number.MAX_SAFE_INTEGER - amountPaise
          }
        },
        {
          $inc: {
            balancePaise: amountPaise
          }
        },
        {
          returnDocument: "after",
          runValidators: true,
          session
        }
      );

      if (!destinationAccount) {
        const existingDestination = await Account.findById(
          destinationId
        ).session(session);

        if (!existingDestination) {
          const error = new Error("Destination account not found");
          error.statusCode = 404;
          throw error;
        }

        if (existingDestination.status !== "ACTIVE") {
          const error = new Error("Destination account is not active");
          error.statusCode = 409;
          throw error;
        }

        const error = new Error("Destination balance limit exceeded");
        error.statusCode = 409;
        throw error;
      }

      // STEP 3: Create two linked ledger entries
      const [
        outgoingTransaction,
        incomingTransaction
      ] = await Transaction.create(
        [
          {
            account: sourceAccount._id,
            owner: sourceAccount.owner,
            type: "TRANSFER",
            amountPaise,
            balanceAfterPaise: sourceAccount.balancePaise,
            reference: outgoingReference,
            transferId,
            transferDirection: "OUTGOING",
            description
          },
          {
            account: destinationAccount._id,
            owner: destinationAccount.owner,
            type: "TRANSFER",
            amountPaise,
            balanceAfterPaise: destinationAccount.balancePaise,
            reference: incomingReference,
            transferId,
            transferDirection: "INCOMING",
            description
          }
        ],
        {
          session,
          ordered: true
        }
      );

      result = {
        transferId,
        amountPaise,

        sourceAccount: {
          accountNumber: sourceAccount.accountNumber,
          balancePaise: sourceAccount.balancePaise
        },

        destinationAccount: {
          accountNumber: destinationAccount.accountNumber,
          balancePaise: destinationAccount.balancePaise
        },

        outgoingTransaction,
        incomingTransaction
      };
    });

    return res.status(201).json({
      success: true,
      message: "Transfer completed successfully",
      ...result
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    console.error("Transfer error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process transfer"
    });

  } finally {
    await session.endSession();
  }
};


// ============================================
// EXPORT CONTROLLERS
// ============================================
module.exports = {
  createAccount,
  getAccounts,
  depositMoney,
  withdrawMoney,
  transferMoney
};
