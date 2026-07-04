const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");

class Auth {
  async isAdmin(req, res) {
    try {
      const loggedInUserId = req.body.loggedInUserId || (req.userDetails && req.userDetails._id);
      if (!loggedInUserId) return res.status(401).json({ error: "You must be logged in" });

      const loggedInUser = await userModel.findById(loggedInUserId).select("userRole");
      if (!loggedInUser) return res.status(404).json({ error: "User not found" });

      return res.json({ role: loggedInUser.userRole });
    } catch (err) {
      console.error("isAdmin error:", err);
      return res.status(500).json({ error: "Failed to check admin role" });
    }
  }

  async allUser(req, res) {
    try {
      const allUser = await userModel.find({}).select("-password");
      return res.json({ users: allUser });
    } catch (err) {
      console.error("allUser error:", err);
      return res.status(500).json({ error: "Failed to load users" });
    }
  }

  async postSignup(req, res) {
    let { name, email, password, cPassword } = req.body;
    let error = {};

    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();

    if (!name || !email || !password || !cPassword) {
      return res.status(400).json({
        error: {
          name: !name ? "Field must not be empty" : "",
          email: !email ? "Field must not be empty" : "",
          password: !password ? "Field must not be empty" : "",
          cPassword: !cPassword ? "Field must not be empty" : "",
        },
      });
    }

    if (name.length < 3 || name.length > 25) {
      error = { ...error, name: "Name must be 3-25 characters" };
      return res.status(400).json({ error });
    }

    if (!validateEmail(email)) {
      error = { ...error, email: "Email is not valid", name: "", password: "" };
      return res.status(400).json({ error });
    }

    if (password.length > 255 || password.length < 8) {
      error = { ...error, password: "Password must be at least 8 characters", name: "", email: "" };
      return res.status(400).json({ error });
    }

    if (password !== cPassword) {
      error = { ...error, password: "Passwords do not match", cPassword: "Passwords do not match" };
      return res.status(400).json({ error });
    }

    try {
      const data = await userModel.findOne({ email });
      if (data) {
        error = { ...error, password: "", name: "", email: "Email already exists" };
        return res.status(409).json({ error });
      }

      const newUser = new userModel({
        name: toTitleCase(name),
        email,
        password: bcrypt.hashSync(password, 10),
        userRole: 0,
      });

      await newUser.save();
      return res.status(201).json({ success: "Account created successfully. Please login" });
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).json({ error: "Account creation failed" });
    }
  }

  async postSignin(req, res) {
    let { email, password } = req.body;
    email = (email || "").trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: "Fields must not be empty" });
    }

    try {
      const data = await userModel.findOne({ email });
      if (!data) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const login = await bcrypt.compare(password, data.password);
      if (!login) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { _id: data._id, role: data.userRole },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: { _id: data._id, role: data.userRole, name: data.name, email: data.email },
      });
    } catch (err) {
      console.error("Signin error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  }
}

const authController = new Auth();
module.exports = authController;
