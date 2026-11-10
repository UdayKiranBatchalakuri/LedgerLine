require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const identifier = process.argv[2];
const targetRole = process.argv[3] || "ADMIN";

const VALID_ROLES = ["ADMIN", "ACCOUNT_HOLDER", "AUDITOR"];

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI not found in environment.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    if (!identifier || identifier === "list") {
      const allUsers = await User.find({}).select("name email role status");
      console.log("\nRegistered Users in Database:");
      console.log("--------------------------------------------------");
      allUsers.forEach((u) => {
        console.log(`• Name: "${u.name}" | Email: ${u.email} | Role: ${u.role} | Status: ${u.status}`);
      });
      console.log("--------------------------------------------------");
      console.log('To promote a user, run: node scripts/setRole.js "<email_or_name>" ADMIN\n');
      return;
    }

    if (!VALID_ROLES.includes(targetRole)) {
      console.log(`Invalid role "${targetRole}". Must be one of: ${VALID_ROLES.join(", ")}`);
      return;
    }

    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase().trim() }
      : { name: new RegExp(`^${identifier.trim()}$`, "i") };

    let user = await User.findOne(query);

    if (!user) {
      // Partial name match fallback
      user = await User.findOne({ name: new RegExp(identifier.trim(), "i") });
    }

    if (!user) {
      console.log(`\nNo user found matching "${identifier}".`);
      const allUsers = await User.find({}).select("name email role");
      console.log("Available users:");
      allUsers.forEach((u) => console.log(`• ${u.name} (${u.email}) [Role: ${u.role}]`));
      return;
    }

    user.role = targetRole;
    await user.save();
    console.log(`\nSUCCESS: Updated "${user.name}" (${user.email}) to role ${targetRole}!\n`);
  } catch (err) {
    console.error("Database error:", err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

run();
