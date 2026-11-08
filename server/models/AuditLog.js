
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },

    action: {
      type: String,
      enum: [
        "USER_SUSPENDED",
        "USER_REACTIVATED",
        "USER_ROLE_CHANGED",
        "ACCOUNT_FROZEN",
        "ACCOUNT_ACTIVATED",
        "ACCOUNT_CLOSED"
      ],
      required: true,
      immutable: true
    },

    targetType: {
      type: String,
      enum: ["USER", "ACCOUNT"],
      required: true,
      immutable: true
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      immutable: true
    },

    changes: {
      field: {
        type: String,
        enum: ["status", "role"],
        required: true,
        immutable: true
      },

      previousValue: {
        type: String,
        required: true,
        immutable: true
      },

      newValue: {
        type: String,
        required: true,
        immutable: true
      }
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    },
    versionKey: false
  }
);

auditLogSchema.index({ createdAt: -1, _id: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
