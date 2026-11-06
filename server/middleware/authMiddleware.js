
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // 1. Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a token."
      });
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });
    }

    // 3. Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user using the token subject
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists"
      });
    }

    // 5. Check current account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active"
      });
    }

    // 6. Attach trusted database user details
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    // 7. Continue to the protected route
    next();

  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "CastError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    console.error("Authentication middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

module.exports = { protect };
