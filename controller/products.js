const productModel = require("../models/products");
const fs = require("fs");
const path = require("path");

const productUploadDir = path.join(__dirname, "..", "public", "uploads", "products");

class Product {
  static deleteImages(images = [], mode = "string") {
    if (!Array.isArray(images)) return;

    images.forEach((image) => {
      const rawName = mode === "file" ? image && image.filename : image;
      if (!rawName) return;

      const safeFileName = path.basename(rawName);
      const filePath = path.join(productUploadDir, safeFileName);
      if (!filePath.startsWith(productUploadDir)) {
        console.warn("Blocked path traversal attempt", rawName);
        return;
      }

      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") console.error("Product image delete error:", err.message);
      });
    });
  }

  async getAllProduct(req, res) {
    try {
      const Products = await productModel
        .find({})
        .populate("pCategory", "_id cName")
        .sort({ _id: -1 });
      return res.json({ Products });
    } catch (err) {
      console.error("getAllProduct error:", err);
      return res.status(500).json({ error: "Failed to load products" });
    }
  }

  async postAddProduct(req, res) {
    const { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus } = req.body;
    const images = req.files || [];

    if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
      Product.deleteImages(images, "file");
      return res.status(400).json({ error: "All fields are required" });
    }

    if (pName.length > 255 || pDescription.length > 3000) {
      Product.deleteImages(images, "file");
      return res.status(400).json({ error: "Name must be under 255 characters and description under 3000 characters" });
    }

    if (images.length !== 2) {
      Product.deleteImages(images, "file");
      return res.status(400).json({ error: "You must provide exactly 2 images" });
    }

    try {
      const allImages = images.map((img) => img.filename);
      const newProduct = new productModel({
        pImages: allImages,
        pName: pName.trim(),
        pDescription: pDescription.trim(),
        pPrice: Number(pPrice),
        pQuantity: Number(pQuantity),
        pCategory,
        pOffer: pOffer || null,
        pStatus,
      });
      await newProduct.save();
      return res.status(201).json({ success: "Product created successfully" });
    } catch (err) {
      Product.deleteImages(images, "file");
      console.error("postAddProduct error:", err);
      return res.status(500).json({ error: "Product creation failed" });
    }
  }

  async postEditProduct(req, res) {
    const {
      pId,
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pOffer,
      pStatus,
      pImages,
    } = req.body;
    const editImages = req.files || [];

    if (!pId || !pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
      Product.deleteImages(editImages, "file");
      return res.status(400).json({ error: "All fields are required" });
    }

    if (pName.length > 255 || pDescription.length > 3000) {
      Product.deleteImages(editImages, "file");
      return res.status(400).json({ error: "Name must be under 255 characters and description under 3000 characters" });
    }

    if (editImages.length === 1 || editImages.length > 2) {
      Product.deleteImages(editImages, "file");
      return res.status(400).json({ error: "When updating images, provide exactly 2 images" });
    }

    const editData = {
      pName: pName.trim(),
      pDescription: pDescription.trim(),
      pPrice: Number(pPrice),
      pQuantity: Number(pQuantity),
      pCategory,
      pOffer: pOffer || null,
      pStatus,
      updatedAt: Date.now(),
    };

    if (editImages.length === 2) {
      editData.pImages = editImages.map((img) => img.filename);
    }

    try {
      const oldImages = typeof pImages === "string" ? pImages.split(",") : [];
      const editProduct = await productModel.findByIdAndUpdate(pId, editData, {
        new: true,
        runValidators: true,
      });
      if (!editProduct) {
        Product.deleteImages(editImages, "file");
        return res.status(404).json({ error: "Product not found" });
      }

      if (editImages.length === 2) Product.deleteImages(oldImages, "string");
      return res.json({ success: "Product edited successfully" });
    } catch (err) {
      Product.deleteImages(editImages, "file");
      console.error("postEditProduct error:", err);
      return res.status(500).json({ error: "Product update failed" });
    }
  }

  async getDeleteProduct(req, res) {
    const { pId } = req.body;
    if (!pId) {
      return res.status(400).json({ error: "Product id is required" });
    }

    try {
      const deleteProduct = await productModel.findByIdAndDelete(pId);
      if (!deleteProduct) return res.status(404).json({ error: "Product not found" });
      Product.deleteImages(deleteProduct.pImages, "string");
      return res.json({ success: "Product deleted successfully" });
    } catch (err) {
      console.error("getDeleteProduct error:", err);
      return res.status(500).json({ error: "Product delete failed" });
    }
  }

  async getSingleProduct(req, res) {
    const { pId } = req.body;
    if (!pId) {
      return res.status(400).json({ error: "Product id is required" });
    }

    try {
      const singleProduct = await productModel
        .findById(pId)
        .populate("pCategory", "cName")
        .populate("pRatingsReviews.user", "name email userImage");
      if (!singleProduct) return res.status(404).json({ error: "Product not found" });
      return res.json({ Product: singleProduct });
    } catch (err) {
      console.error("getSingleProduct error:", err);
      return res.status(500).json({ error: "Failed to load product" });
    }
  }

  async getProductByCategory(req, res) {
    const { catId } = req.body;
    if (!catId) {
      return res.status(400).json({ error: "Category id is required" });
    }

    try {
      const products = await productModel.find({ pCategory: catId }).populate("pCategory", "cName");
      return res.json({ Products: products });
    } catch (err) {
      console.error("getProductByCategory error:", err);
      return res.status(500).json({ error: "Search product failed" });
    }
  }

  async getProductByPrice(req, res) {
    const { price } = req.body;
    if (!price) {
      return res.status(400).json({ error: "Price is required" });
    }

    try {
      const products = await productModel
        .find({ pPrice: { $lt: Number(price) } })
        .populate("pCategory", "cName")
        .sort({ pPrice: -1 });
      return res.json({ Products: products });
    } catch (err) {
      console.error("getProductByPrice error:", err);
      return res.status(500).json({ error: "Filter product failed" });
    }
  }

  async getWishProduct(req, res) {
    const { productArray } = req.body;
    if (!Array.isArray(productArray)) {
      return res.status(400).json({ error: "Product list is required" });
    }

    try {
      const wishProducts = await productModel.find({ _id: { $in: productArray } });
      return res.json({ Products: wishProducts });
    } catch (err) {
      console.error("getWishProduct error:", err);
      return res.status(500).json({ error: "Wishlist product failed" });
    }
  }

  async getCartProduct(req, res) {
    const { productArray } = req.body;
    if (!Array.isArray(productArray)) {
      return res.status(400).json({ error: "Product list is required" });
    }

    try {
      const cartProducts = await productModel.find({ _id: { $in: productArray } });
      return res.json({ Products: cartProducts });
    } catch (err) {
      console.error("getCartProduct error:", err);
      return res.status(500).json({ error: "Cart product failed" });
    }
  }

  async postAddReview(req, res) {
    const { pId, uId, rating, review } = req.body;
    if (!pId || !rating || !review || !uId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!req.userDetails || req.userDetails._id.toString() !== uId.toString()) {
      return res.status(403).json({ error: "You can only review from your account" });
    }

    try {
      const product = await productModel.findById(pId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const alreadyReviewed = product.pRatingsReviews.some(
        (item) => item.user && item.user.toString() === uId.toString()
      );
      if (alreadyReviewed) {
        return res.status(409).json({ error: "You already reviewed this product" });
      }

      await productModel.findByIdAndUpdate(pId, {
        $push: { pRatingsReviews: { review, user: uId, rating } },
      });
      return res.json({ success: "Thanks for your review" });
    } catch (err) {
      console.error("postAddReview error:", err);
      return res.status(500).json({ error: "Review failed" });
    }
  }

  async deleteReview(req, res) {
    const { rId, pId } = req.body;
    if (!rId || !pId) {
      return res.status(400).json({ message: "Review id and product id are required" });
    }

    try {
      const product = await productModel.findById(pId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const review = product.pRatingsReviews.id(rId);
      if (!review) return res.status(404).json({ error: "Review not found" });
      if (req.userDetails.role !== 1 && review.user.toString() !== req.userDetails._id.toString()) {
        return res.status(403).json({ error: "You can only delete your review" });
      }

      await productModel.findByIdAndUpdate(pId, { $pull: { pRatingsReviews: { _id: rId } } });
      return res.json({ success: "Your review is deleted" });
    } catch (err) {
      console.error("deleteReview error:", err);
      return res.status(500).json({ error: "Review delete failed" });
    }
  }
}

const productController = new Product();
module.exports = productController;
