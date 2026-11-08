
const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

const AUDIT_ACTIONS = [
  "USER_SUSPENDED",
  "USER_REACTIVATED",
  "USER_ROLE_CHANGED",
  "ACCOUNT_FROZEN",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_CLOSED"
];

const getAuditLogs = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100"
      });
    }

    const filter = {};

    if (req.query.action) {
      if (!AUDIT_ACTIONS.includes(req.query.action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid audit action"
        });
      }

      filter.action = req.query.action;
    }

    if (req.query.targetType) {
      if (!["USER", "ACCOUNT"].includes(req.query.targetType)) {
        return res.status(400).json({
          success: false,
          message: "Target type must be USER or ACCOUNT"
        });
      }

      filter.targetType = req.query.targetType;
    }

    if (req.query.actor) {
      if (!mongoose.isValidObjectId(req.query.actor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid actor ID"
        });
      }

      filter.actor = req.query.actor;
    }

    if (req.query.targetId) {
      if (!mongoose.isValidObjectId(req.query.targetId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid target ID"
        });
      }

      filter.targetId = req.query.targetId;
    }

    const skip = (page - 1) * limit;

    const [auditLogs, totalLogs] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email role")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalLogs,
        totalPages: Math.ceil(totalLogs / limit)
      },
      auditLogs
    });
  } catch (error) {
    console.error("Get audit logs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve audit logs"
    });
  }
};

const getAuditLogById = async (req, res) => {
  try {
    const { auditLogId } = req.params;

    if (!mongoose.isValidObjectId(auditLogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit log ID"
      });
    }

    const auditLog = await AuditLog.findById(auditLogId)
      .populate("actor", "name email role")
      .lean();

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found"
      });
    }

    return res.status(200).json({
      success: true,
      auditLog
    });
  } catch (error) {
    console.error("Get audit log details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve audit log details"
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById
};
