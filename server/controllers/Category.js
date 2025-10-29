const Category = require("../models/Category")

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        const categoryDetails = await Category.create({
            name: name,
            description: description
        })
        return res.status(200).json({
            success: true,
            message: "Category created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({})
        res.status(200).json({
            success: true,
            data: categories
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const category = await Category.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, message: "Category updated successfully", data: category });
    } catch (error) {
        console.error("UpdateCategoryError:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Category ID is required" });
        }
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("DeleteCategoryError:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
