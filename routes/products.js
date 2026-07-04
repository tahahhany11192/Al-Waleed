const express = require("express");
const router = express.Router();
const productController = require("../controller/products");
const multer = require("multer");
const path = require("path");
const { loginCheck, isAdmin } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/products");
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
  limits: { fileSize: 3 * 1024 * 1024, files: 2 },
});

router.get("/all-product", productController.getAllProduct);
router.post("/product-by-category", productController.getProductByCategory);
router.post("/product-by-price", productController.getProductByPrice);
router.post("/wish-product", productController.getWishProduct);
router.post("/cart-product", productController.getCartProduct);
router.post("/single-product", productController.getSingleProduct);

router.post("/add-product", loginCheck, isAdmin, upload.any(), productController.postAddProduct);
router.post("/edit-product", loginCheck, isAdmin, upload.any(), productController.postEditProduct);
router.post("/delete-product", loginCheck, isAdmin, productController.getDeleteProduct);

router.post("/add-review", loginCheck, productController.postAddReview);
router.post("/delete-review", loginCheck, productController.deleteReview);

module.exports = router;
