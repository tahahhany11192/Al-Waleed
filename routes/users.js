const express = require("express");
const router = express.Router();
const usersController = require("../controller/users");
const { loginCheck, isAdmin } = require("../middleware/auth");

router.get("/all-user", loginCheck, isAdmin, usersController.getAllUser);
router.post("/signle-user", loginCheck, usersController.getSingleUser);
router.post("/add-user", loginCheck, isAdmin, usersController.postAddUser);
router.post("/edit-user", loginCheck, usersController.postEditUser);
router.post("/delete-user", loginCheck, isAdmin, usersController.getDeleteUser);
router.post("/change-password", loginCheck, usersController.changePassword);

module.exports = router;
