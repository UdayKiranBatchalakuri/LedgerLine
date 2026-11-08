
const mongoose = require("mongoose");
const User = require("../models/User");
const Account = require("../models/Account");
const AuditLog = require("../models/AuditLog");

const USER_STATUSES = ["ACTIVE", "SUSPENDED"];
const USER_ROLES = ["ADMIN", "ACCOUNT_HOLDER", "AUDITOR"];
const ACCOUNT_STATUSES = ["ACTIVE", "FROZEN", "CLOSED"];

// GET ALL USERS
const getUsers = async (req, res) => {
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

    if (req.query.role) {
      if (!USER_ROLES.includes(req.query.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role"
        });
      }

      filter.role = req.query.role;
    }

    if (req.query.status) {
      if (!USER_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user status"
        });
      }

      filter.status = req.query.status;
    }

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("name email role status createdAt updatedAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      },
      users
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users"
    });
  }
};

// UPDATE USER STATUS
const updateUserStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (!USER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or SUSPENDED"
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status"
      });
    }

    let updatedUser;
    let previousStatus;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);

      if (!user) {
        const error = new Error("USER_NOT_FOUND");
        throw error;
      }

      previousStatus = user.status;

      if (previousStatus === status) {
        updatedUser = user;
        return;
      }

      if (
        user.role === "ADMIN" &&
        user.status === "ACTIVE" &&
        status === "SUSPENDED"
      ) {
        const activeAdmins = await User.countDocuments({
          role: "ADMIN",
          status: "ACTIVE"
        }).session(session);

        if (activeAdmins <= 1) {
          const error = new Error("LAST_ACTIVE_ADMIN");
          throw error;
        }
      }

      user.status = status;
      await user.save({ session });

      const action =
        status === "SUSPENDED"
          ? "USER_SUSPENDED"
          : "USER_REACTIVATED";

      await AuditLog.create(
        [
          {
            actor: req.user.id,
            action,
            targetType: "USER",
            targetId: user._id,
            changes: {
              field: "status",
              previousValue: previousStatus,
              newValue: status
            }
          }
        ],
        { session }
      );

      updatedUser = user;
    });

    return res.status(200).json({
      success: true,
      message:
        previousStatus === status
          ? "User already has the requested status"
          : "User status updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error("Update user status error:", error.message);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (error.message === "LAST_ACTIVE_ADMIN") {
      return res.status(409).json({
        success: false,
        message: "Cannot suspend the last active administrator"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update user status"
    });
  } finally {
    await session.endSession();
  }
};

// UPDATE USER ROLE
const updateUserRole = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role"
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role"
      });
    }

    let updatedUser;
    let previousRole;

    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);

      if (!user) {
        const error = new Error("USER_NOT_FOUND");
        throw error;
      }

      previousRole = user.role;

      if (previousRole === role) {
        updatedUser = user;
        return;
      }

      if (
        user.role === "ADMIN" &&
        user.status === "ACTIVE" &&
        role !== "ADMIN"
      ) {
        const activeAdmins = await User.countDocuments({
          role: "ADMIN",
          status: "ACTIVE"
        }).session(session);

        if (activeAdmins <= 1) {
          const error = new Error("LAST_ACTIVE_ADMIN");
          throw error;
        }
      }

      user.role = role;
      await user.save({ session });

      await AuditLog.create(
        [
          {
            actor: req.user.id,
            action: "USER_ROLE_CHANGED",
            targetType: "USER",
            targetId: user._id,
            changes: {
              field: "role",
              previousValue: previousRole,
              newValue: role
            }
          }
        ],
        { session }
      );

      updatedUser = user;
    });

    return res.status(200).json({
      success: true,
      message:
        previousRole === role
          ? "User already has the requested role"
          : "User role updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error("Update user role error:", error.message);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (error.message === "LAST_ACTIVE_ADMIN") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot change the role of the last active administrator"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update user role"
    });
  } finally {
    await session.endSession();
  }
};

// UPDATE ACCOUNT STATUS
const updateAccountStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { accountId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(accountId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account ID"
      });
    }

    if (!ACCOUNT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE, FROZEN or CLOSED"
      });
    }

    let updatedAccount;
    let previousStatus;

    await session.withTransaction(async () => {
      const account = await Account.findById(accountId).session(session);

      if (!account) {
        const error = new Error("ACCOUNT_NOT_FOUND");
        throw error;
      }

      previousStatus = account.status;

      if (previousStatus === "CLOSED" && status !== "CLOSED") {
        const error = new Error("CLOSED_ACCOUNT");
        throw error;
      }

      if (status === "CLOSED" && account.balancePaise > 0) {
        const error = new Error("POSITIVE_BALANCE");
        throw error;
      }

      if (previousStatus === status) {
        updatedAccount = account;
        return;
      }

      account.status = status;
      await account.save({ session });

      let action;

      if (status === "FROZEN") {
        action = "ACCOUNT_FROZEN";
      } else if (status === "CLOSED") {
        action = "ACCOUNT_CLOSED";
      } else {
        action = "ACCOUNT_ACTIVATED";
      }

      await AuditLog.create(
        [
          {
            actor: req.user.id,
            action,
            targetType: "ACCOUNT",
            targetId: account._id,
            changes: {
              field: "status",
              previousValue: previousStatus,
              newValue: status
            }
          }
        ],
        { session }
      );

      updatedAccount = account;
    });

    return res.status(200).json({
      success: true,
      message:
        previousStatus === status
          ? "Account already has the requested status"
          : "Account status updated successfully",
      account: {
        id: updatedAccount._id,
        accountNumber: updatedAccount.accountNumber,
        accountType: updatedAccount.accountType,
        balancePaise: updatedAccount.balancePaise,
        status: updatedAccount.status
      }
    });
  } catch (error) {
    console.error("Update account status error:", error.message);

    if (error.message === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    if (error.message === "CLOSED_ACCOUNT") {
      return res.status(409).json({
        success: false,
        message: "A closed account cannot be reactivated"
      });
    }

    if (error.message === "POSITIVE_BALANCE") {
      return res.status(409).json({
        success: false,
        message: "An account with a positive balance cannot be closed"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update account status"
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
  updateAccountStatus
};
