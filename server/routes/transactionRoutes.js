const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { depositMoney } = require("../controllers/accountController");

const router = express.Router();

router.post("/deposit", protect, depositMoney);

module.exports = router;