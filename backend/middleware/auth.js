const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.header("Authorization");

  // Check if the Authorization header is missing or doesn't start with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Authorization header missing or invalid"); // Log the issue
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using the JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully. User ID:", decoded.id); // Log the decoded user ID

    // Attach the user ID to the request object
    req.user = decoded.id;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("Token verification failed:", err.message); // Log the error
    res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = authMiddleware;