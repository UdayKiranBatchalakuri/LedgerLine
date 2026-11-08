const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

const {
  getUsers,
  updateUserStatus,
  updateUserRole,
  updateAccountStatus
} = require("../controllers/adminController");

const router = express.Router();

// ADMIN and AUDITOR: read-only user listing
router.get(
  "/users",
  protect,
  authorizeRoles("ADMIN", "AUDITOR"),
  getUsers
);

// ADMIN only: user management
router.patch(
  "/users/:userId/status",
  protect,
  authorizeRoles("ADMIN"),
  updateUserStatus
);

router.patch(
  "/users/:userId/role",
  protect,
  authorizeRoles("ADMIN"),
  updateUserRole
);

// ADMIN only: account management
router.patch(
  "/accounts/:accountId/status",
  protect,
  authorizeRoles("ADMIN"),
  updateAccountStatus
);

module.exports = router;