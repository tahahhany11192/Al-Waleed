const userModel = require("../models/users");
const bcrypt = require("bcryptjs");

const canAccessUser = (req, userId) => {
  if (!req.userDetails || !userId) return false;
  return req.userDetails.role === 1 || req.userDetails._id.toString() === userId.toString();
};

class User {
  async getAllUser(req, res) {
    try {
      const Users = await userModel.find({}).select("-password").sort({ _id: -1 });
      return res.json({ Users });
    } catch (err) {
      console.error("getAllUser error:", err);
      return res.status(500).json({ error: "Failed to load users" });
    }
  }

  async getSingleUser(req, res) {
    const { uId } = req.body;
    if (!uId) {
      return res.status(400).json({ error: "User id is required" });
    }

    if (!canAccessUser(req, uId)) {
      return res.status(403).json({ error: "You can only view your own profile" });
    }

    try {
      const User = await userModel
        .findById(uId)
        .select("name email phoneNumber userImage updatedAt createdAt userRole");
      if (!User) return res.status(404).json({ error: "User not found" });
      return res.json({ User });
    } catch (err) {
      console.error("getSingleUser error:", err);
      return res.status(500).json({ error: "Failed to load user" });
    }
  }

  async postAddUser(req, res) {
    return res.status(405).json({ error: "Use /api/signup to create users" });
  }

  async postEditUser(req, res) {
    let { uId, name, phoneNumber } = req.body;
    if (!uId || !name || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!canAccessUser(req, uId)) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    try {
      const currentUser = await userModel.findByIdAndUpdate(
        uId,
        { name: name.trim(), phoneNumber, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      if (!currentUser) return res.status(404).json({ error: "User not found" });
      return res.json({ success: "User updated successfully" });
    } catch (err) {
      console.error("postEditUser error:", err);
      return res.status(500).json({ error: "User update failed" });
    }
  }

  async getDeleteUser(req, res) {
    const { uId } = req.body;
    if (!uId) {
      return res.status(400).json({ message: "User id is required" });
    }

    try {
      const user = await userModel.findByIdAndDelete(uId);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ success: "User deleted successfully" });
    } catch (err) {
      console.error("getDeleteUser error:", err);
      return res.status(500).json({ error: "User delete failed" });
    }
  }

  async changePassword(req, res) {
    const { uId, oldPassword, newPassword } = req.body;
    if (!uId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!canAccessUser(req, uId)) {
      return res.status(403).json({ error: "You can only change your own password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    try {
      const data = await userModel.findById(uId);
      if (!data) return res.status(404).json({ error: "Invalid user" });

      const oldPassCheck = await bcrypt.compare(oldPassword, data.password);
      if (!oldPassCheck) {
        return res.status(400).json({ error: "Your old password is wrong" });
      }

      const newHashedPassword = bcrypt.hashSync(newPassword, 10);
      await userModel.findByIdAndUpdate(uId, { password: newHashedPassword });
      return res.json({ success: "Password updated successfully" });
    } catch (err) {
      console.error("changePassword error:", err);
      return res.status(500).json({ error: "Password update failed" });
    }
  }
}

const usersController = new User();
module.exports = usersController;
