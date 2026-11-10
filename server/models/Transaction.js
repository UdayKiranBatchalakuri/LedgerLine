
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      immutable: true,
      index: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true
    },

    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER"],
      required: true,
      immutable: true
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Transaction amount must be a safe integer in paise"
      }
    },

    balanceAfterPaise: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      validate: {
        validator: Number.isSafeInteger,
        message: "Balance must be a safe integer in paise"
      }
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      immutable: true
    },

    transferId: {
      type: String,
      immutable: true,
      index: true
    },

    transferDirection: {
      type: String,
      enum: ["OUTGOING", "INCOMING"],
      immutable: true
    },

    idempotencyKey: {
      type: String,
      immutable: true
    },

    requestHash: {
      type: String,
      immutable: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 200,
      immutable: true
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ account: 1, createdAt: -1 });

transactionSchema.index(
  { owner: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" }
    }
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
