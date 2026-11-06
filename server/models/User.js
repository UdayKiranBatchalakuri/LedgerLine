
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false
    },

    role: {
      type: String,
      enum: ["ADMIN", "ACCOUNT_HOLDER", "AUDITOR"],
      default: "ACCOUNT_HOLDER",
      required: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
