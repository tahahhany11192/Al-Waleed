const orderModel = require("../models/orders");

const isOwnerOrAdmin = (req, userId) => {
  if (!req.userDetails || !userId) return false;
  return req.userDetails.role === 1 || req.userDetails._id.toString() === userId.toString();
};

class Order {
  async getAllOrders(req, res) {
    try {
      const Orders = await orderModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      return res.json({ Orders });
    } catch (err) {
      console.error("getAllOrders error:", err);
      return res.status(500).json({ error: "Failed to load orders" });
    }
  }

  async getOrderByUser(req, res) {
    const { uId } = req.body;
    if (!uId) {
      return res.status(400).json({ message: "User id is required" });
    }

    if (!isOwnerOrAdmin(req, uId)) {
      return res.status(403).json({ error: "You can only view your own orders" });
    }

    try {
      const Order = await orderModel
        .find({ user: uId })
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });
      return res.json({ Order });
    } catch (err) {
      console.error("getOrderByUser error:", err);
      return res.status(500).json({ error: "Failed to load user orders" });
    }
  }

  async postCreateOrder(req, res) {
    let {
      allProduct,
      user,
      amount,
      transactionId,
      address,
      phone,
      location,
      paymentMethod = "COD",
      paymentStatus,
    } = req.body;

    if (!isOwnerOrAdmin(req, user)) {
      return res.status(403).json({ error: "You can only create orders for your account" });
    }

    if (!Array.isArray(allProduct) || allProduct.length === 0) {
      return res.status(400).json({ message: "Cart products are required" });
    }

    address = (address || "").trim();
    phone = (phone || "").toString().trim();
    location = (location || "").trim();
    paymentMethod = paymentMethod === "Online" ? "Online" : "COD";

    if (!user || !amount || !address || !phone || !location) {
      return res.status(400).json({ message: "Address, phone, location and amount are required" });
    }

    if (!transactionId) {
      transactionId = paymentMethod === "COD" ? `COD-${Date.now()}` : "ONLINE-PENDING";
    }

    const orderPaymentStatus = paymentStatus || (paymentMethod === "COD" ? "Pending" : "Paid");

    try {
      const newOrder = new orderModel({
        allProduct,
        user,
        amount: Number(amount),
        transactionId,
        address,
        phone,
        location,
        paymentMethod,
        paymentStatus: orderPaymentStatus,
      });
      await newOrder.save();
      return res.status(201).json({ success: "Order created successfully" });
    } catch (err) {
      console.error("postCreateOrder error:", err);
      return res.status(500).json({ error: "Order creation failed" });
    }
  }

  async postUpdateOrder(req, res) {
    const { oId, status, paymentStatus } = req.body;
    if (!oId || !status) {
      return res.status(400).json({ message: "Order id and status are required" });
    }

    try {
      const update = { status, updatedAt: Date.now() };
      if (paymentStatus) update.paymentStatus = paymentStatus;
      const currentOrder = await orderModel.findByIdAndUpdate(oId, update, {
        new: true,
        runValidators: true,
      });
      if (!currentOrder) return res.status(404).json({ error: "Order not found" });
      return res.json({ success: "Order updated successfully" });
    } catch (err) {
      console.error("postUpdateOrder error:", err);
      return res.status(500).json({ error: "Order update failed" });
    }
  }

  async postDeleteOrder(req, res) {
    const { oId } = req.body;
    if (!oId) {
      return res.status(400).json({ error: "Order id is required" });
    }

    try {
      const deleteOrder = await orderModel.findByIdAndDelete(oId);
      if (!deleteOrder) return res.status(404).json({ error: "Order not found" });
      return res.json({ success: "Order deleted successfully" });
    } catch (error) {
      console.error("postDeleteOrder error:", error);
      return res.status(500).json({ error: "Order delete failed" });
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;
