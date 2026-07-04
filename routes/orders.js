const express = require("express");
const router = express.Router();
const ordersController = require("../controller/orders");
const { loginCheck, isAdmin } = require("../middleware/auth");

router.get("/get-all-orders", loginCheck, isAdmin, ordersController.getAllOrders);
router.post("/order-by-user", loginCheck, ordersController.getOrderByUser);
router.post("/create-order", loginCheck, ordersController.postCreateOrder);
router.post("/update-order", loginCheck, isAdmin, ordersController.postUpdateOrder);
router.post("/delete-order", loginCheck, isAdmin, ordersController.postDeleteOrder);

module.exports = router;
