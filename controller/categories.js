const { toTitleCase } = require("../config/function");
const categoryModel = require("../models/categories");
const fs = require("fs");
const path = require("path");

const categoryUploadDir = path.join(__dirname, "..", "public", "uploads", "categories");

const removeUploadedFile = (filename) => {
  if (!filename) return;
  const safeName = path.basename(filename);
  const filePath = path.join(categoryUploadDir, safeName);
  if (!filePath.startsWith(categoryUploadDir)) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") console.error("Category image delete error:", err.message);
  });
};

class Category {
  async getAllCategory(req, res) {
    try {
      const Categories = await categoryModel.find({}).sort({ _id: -1 });
      return res.json({ Categories });
    } catch (err) {
      console.error("getAllCategory error:", err);
      return res.status(500).json({ error: "Failed to load categories" });
    }
  }

  async postAddCategory(req, res) {
    let { cName, cDescription, cStatus } = req.body;
    const cImage = req.file ? req.file.filename : "";

    cName = (cName || "").trim();
    cDescription = (cDescription || "").trim();
    cStatus = (cStatus || "").trim();

    if (!cName || !cDescription || !cStatus || !cImage) {
      removeUploadedFile(cImage);
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      cName = toTitleCase(cName);
      const checkCategoryExists = await categoryModel.findOne({ cName });
      if (checkCategoryExists) {
        removeUploadedFile(cImage);
        return res.status(409).json({ error: "Category already exists" });
      }

      const newCategory = new categoryModel({ cName, cDescription, cStatus, cImage });
      await newCategory.save();
      return res.status(201).json({ success: "Category created successfully" });
    } catch (err) {
      removeUploadedFile(cImage);
      console.error("postAddCategory error:", err);
      return res.status(500).json({ error: "Category creation failed" });
    }
  }

  async postEditCategory(req, res) {
    const { cId, cDescription, cStatus } = req.body;
    if (!cId || !cDescription || !cStatus) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const edit = await categoryModel.findByIdAndUpdate(
        cId,
        { cDescription, cStatus, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      if (!edit) return res.status(404).json({ error: "Category not found" });
      return res.json({ success: "Category edited successfully" });
    } catch (err) {
      console.error("postEditCategory error:", err);
      return res.status(500).json({ error: "Category update failed" });
    }
  }

  async getDeleteCategory(req, res) {
    const { cId } = req.body;
    if (!cId) {
      return res.status(400).json({ error: "Category id is required" });
    }

    try {
      const deletedCategory = await categoryModel.findByIdAndDelete(cId);
      if (!deletedCategory) return res.status(404).json({ error: "Category not found" });
      removeUploadedFile(deletedCategory.cImage);
      return res.json({ success: "Category deleted successfully" });
    } catch (err) {
      console.error("getDeleteCategory error:", err);
      return res.status(500).json({ error: "Category delete failed" });
    }
  }
}

const categoryController = new Category();
module.exports = categoryController;
