const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categories");
const multer = require("multer");
const path = require("path");
const { loginCheck, isAdmin } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads/categories");
  },
  filename: function (req, file, cb) {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, Date.now() + "_" + safeName);
  },
});

const imageFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.get("/all-category", categoryController.getAllCategory);
router.post("/add-category", loginCheck, isAdmin, upload.single("cImage"), categoryController.postAddCategory);
router.post("/edit-category", loginCheck, isAdmin, categoryController.postEditCategory);
router.post("/delete-category", loginCheck, isAdmin, categoryController.getDeleteCategory);

module.exports = router;
