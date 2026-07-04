const fs = require("fs");
const path = require("path");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");

const customizeUploadDir = path.join(__dirname, "..", "public", "uploads", "customize");

const removeUploadedFile = (filename) => {
  if (!filename) return;
  const safeName = path.basename(filename);
  const filePath = path.join(customizeUploadDir, safeName);
  if (!filePath.startsWith(customizeUploadDir)) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") console.error("Slider image delete error:", err.message);
  });
};

class Customize {
  async getImages(req, res) {
    try {
      const Images = await customizeModel.find({});
      return res.json({ Images });
    } catch (err) {
      console.error("getImages error:", err);
      return res.status(500).json({ error: "Failed to load slider images" });
    }
  }

  async uploadSlideImage(req, res) {
    const image = req.file ? req.file.filename : "";
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    try {
      const newCustomize = new customizeModel({ slideImage: image });
      await newCustomize.save();
      return res.status(201).json({ success: "Image uploaded successfully" });
    } catch (err) {
      removeUploadedFile(image);
      console.error("uploadSlideImage error:", err);
      return res.status(500).json({ error: "Image upload failed" });
    }
  }

  async deleteSlideImage(req, res) {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Image id is required" });
    }

    try {
      const deletedSlideImage = await customizeModel.findByIdAndDelete(id);
      if (!deletedSlideImage) return res.status(404).json({ error: "Image not found" });
      removeUploadedFile(deletedSlideImage.slideImage);
      return res.json({ success: "Image deleted successfully" });
    } catch (err) {
      console.error("deleteSlideImage error:", err);
      return res.status(500).json({ error: "Image delete failed" });
    }
  }

  async getAllData(req, res) {
    try {
      const Categories = await categoryModel.countDocuments({});
      const Products = await productModel.countDocuments({});
      const Orders = await orderModel.countDocuments({});
      const Users = await userModel.countDocuments({});
      return res.json({ Categories, Products, Orders, Users });
    } catch (err) {
      console.error("getAllData error:", err);
      return res.status(500).json({ error: "Failed to load dashboard data" });
    }
  }
}

const customizeController = new Customize();
module.exports = customizeController;
