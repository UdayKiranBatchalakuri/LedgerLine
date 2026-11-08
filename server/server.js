
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

require("dotenv").config();

const accountRoutes = require("./routes/accountRoutes");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const auditRoutes = require("./routes/auditRoutes");

const connectDB = require("./config/db");

const app = express();

// Security headers
app.use(helmet());

// Frontend communication
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

// Parse JSON requests
app.use(express.json({ limit: "20kb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit-logs", auditRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LedgerLine API is running",
    timestamp: new Date().toISOString()
  });
});

// Export app for automated testing
module.exports = app;

// Start server only when executed directly
if (require.main === module) {
  const startServer = async () => {
    try {
      await connectDB();

      const PORT = process.env.PORT || 5000;

      app.listen(PORT, () => {
        console.log(`LedgerLine API running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Server startup failed:", error.message);
      process.exit(1);
    }
  };

  startServer();
}
