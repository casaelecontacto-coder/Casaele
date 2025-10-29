const express = require("express")
const router = express.Router()
const { auth, isAdmin } = require("../middlewares/auth")
const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} = require("../controllers/Category")

// Category routes
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/getAllCategories", getAllCategories)
router.delete("/deleteCategory/:id", auth, isAdmin, deleteCategory)
router.put("/updateCategory/:id", auth, isAdmin, updateCategory)

module.exports = router
