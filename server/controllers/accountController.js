const mongoose = require("mongoose");
const crypto = require("node:crypto");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

// CREATE ACCOUNT
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


// GET ALL ACCOUNTS BASED ON USER ROLE
const getAccounts = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "ACCOUNT_HOLDER") {
      // Account holders can access only their own accounts
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


const depositMoney = async (req, res) => {
  const { accountId, amountPaise, description } = req.body;

  // Validate account ID
  if (!mongoose.isValidObjectId(accountId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account ID"
    });
  }

  // Validate amount in paise
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
      // Find and update only the authenticated user's active account.
      // The upper bound prevents unsafe integer balances.
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
          $inc: { balancePaise: amountPaise }
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

      // Create the ledger record in the same transaction.
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
        { session }
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



// EXPORT CONTROLLERS
module.exports = {
  createAccount,
  getAccounts,
  depositMoney
};