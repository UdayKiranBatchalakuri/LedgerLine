
const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const {
  getAuditLogs,
  getAuditLogById
} = require("../controllers/auditController");

const router = express.Router();

// ADMIN and AUDITOR can view audit logs
router.get(
  "/",
  protect,
  authorizeRoles("ADMIN", "AUDITOR"),
  getAuditLogs
);

// ADMIN and AUDITOR can view individual audit log details
router.get(
  "/:auditLogId",
  protect,
  authorizeRoles("ADMIN", "AUDITOR"),
  getAuditLogById
);

module.exports = router;
