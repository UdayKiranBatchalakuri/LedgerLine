const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  createAccount,
  getAccounts
} = require("../controllers/accountController");

const router = express.Router();

router.post("/", protect, createAccount);
router.get("/", protect, getAccounts);

module.exports = router;