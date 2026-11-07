
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true
    },

    accountType: {
      type: String,
      enum: ["SAVINGS", "CURRENT"],
      required: true
    },

    balancePaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Balance must be a safe integer in paise"
      }
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
      immutable: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN", "CLOSED"],
      default: "ACTIVE"
    }
  },
  {
    timestamps: true,

  }
);

module.exports = mongoose.model("Account", accountSchema);
