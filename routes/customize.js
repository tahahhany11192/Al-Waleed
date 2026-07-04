const express = require("express");
const router = express.Router();
const customizeController = require("../controller/customize");
const multer = require("multer");
const path = require("path");
const { loginCheck, isAdmin } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/customize");
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
  limits: { fileSize: 3 * 1024 * 1024 },
});

router.get("/get-slide-image", customizeController.getImages);
router.post("/delete-slide-image", loginCheck, isAdmin, customizeController.deleteSlideImage);
router.post("/upload-slide-image", loginCheck, isAdmin, upload.single("image"), customizeController.uploadSlideImage);
router.post("/dashboard-data", loginCheck, isAdmin, customizeController.getAllData);

module.exports = router;
