const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const userModel = require("../models/users");

const getTokenFromRequest = (req) => {
  const headerToken = req.headers.authorization || req.headers.token;
  if (!headerToken || typeof headerToken !== "string") return null;
  return headerToken.replace("Bearer ", "").trim();
};

exports.loginCheck = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: "You must be logged in" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userDetails = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

exports.isAuth = (req, res, next) => {
  const loggedInUserId =
    req.body.loggedInUserId || req.body.uId || req.body.user || req.params.userId;

  if (
    !loggedInUserId ||
    !req.userDetails ||
    !req.userDetails._id ||
    loggedInUserId.toString() !== req.userDetails._id.toString()
  ) {
    return res.status(403).json({ error: "You are not authenticated" });
  }
  next();
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.userDetails || !req.userDetails._id) {
      return res.status(401).json({ error: "You must be logged in" });
    }

    const reqUser = await userModel.findById(req.userDetails._id).select("userRole");
    if (!reqUser || reqUser.userRole !== 1) {
      return res.status(403).json({ error: "Admin access denied" });
    }

    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    return res.status(500).json({ error: "Authentication check failed" });
  }
};
