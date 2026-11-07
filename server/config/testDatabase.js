
const mongoose = require("mongoose");

const connectTestDB = async () => {
  const testURI = process.env.MONGODB_TEST_URI;

  if (!testURI) {
    throw new Error("MONGODB_TEST_URI is not configured");
  }

  if (!testURI.includes("ledgerline_test")) {
    throw new Error(
      "Test database URI must point to ledgerline_test"
    );
  }

  await mongoose.connect(testURI);

  console.log("Test database connected successfully");
};

module.exports = connectTestDB;
