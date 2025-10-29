import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Utility to handle validation errors (can be shared or duplicated)
const handleValidationError = (error, res) => {
    let errors = {};
    Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
    });
    return res.status(400).json({ message: "Validation Error", errors });
};

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = Product.find({}); // Add isActive check if needed: { isActive: true }

        // Enhanced filtering support for Explore/Keyword modes
        const { 
            category, 
            subCategory, 
            theme, 
            level, 
            country, 
            keyword,
            search, // Legacy support
            maxPrice 
        } = req.query;

        // Category filter (maps to Room/Category)
        if (category && category !== 'Room/Category') {
            query = query.where('category').equals(category);
        }
        
        // Sub Category filter (maps to availableLevels or tags)
        if (subCategory && subCategory !== 'Sub Category') {
            query = query.where('availableLevels').in([new RegExp(subCategory, 'i')]);
        }
        
        // Theme filter (maps to category or availableLevels)
        if (theme && theme !== 'Theme/Genre') {
            query = query.or([
                { category: { $regex: theme, $options: 'i' } },
                { availableLevels: { $in: [new RegExp(theme, 'i')] } }
            ]);
        }
        
        // Level filter (maps to availableLevels)
        if (level && level !== 'Level') {
            query = query.where('availableLevels').in([new RegExp(level, 'i')]);
        }
        
        // Country filter (maps to category or availableLevels)
        if (country && country !== 'Country') {
            query = query.or([
                { category: { $regex: country, $options: 'i' } },
                { availableLevels: { $in: [new RegExp(country, 'i')] } }
            ]);
        }
        
        // Keyword search (searches across name, description, category, and availableLevels) - EXACT WORD MATCHING
        if (keyword && keyword.trim()) {
            const cleanKeyword = keyword.trim();
            
            // Create regex that matches whole words only (not partial matches)
            // \b ensures word boundaries, so "hand" won't match "handsome" or "shorthand"
            const exactWordRegex = new RegExp(`\\b${cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            
            query = query.or([
                { name: exactWordRegex },
                { description: exactWordRegex },
                { category: exactWordRegex },
                { availableLevels: { $in: [exactWordRegex] } }
            ]);
        }
        
        // Legacy search support
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = query.or([
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]);
        }
        
        // Price filtering
        if (maxPrice) {
            query = query.where('price').lte(parseFloat(maxPrice));
        }

        // Sorting
        let sortOption = { createdAt: -1 }; 
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price-asc':
                    sortOption = { price: 1 };
                    break;
                case 'price-desc':
                    sortOption = { price: -1 };
                    break;
                case 'newest':
                default:
                    sortOption = { createdAt: -1 };
            }
        }
        query = query.sort(sortOption);

        // Pagination
        const totalProducts = await Product.countDocuments(query.getFilter());
        const totalPages = Math.ceil(totalProducts / limit);
        const products = await query.skip(skip).limit(limit);

        res.json({
            products, // Ensure consistent response structure
            currentPage: page,
            totalPages,
            totalProducts,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
     try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Server error fetching product' });
    }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin (Protected by verifyFirebaseToken)
export const createProduct = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            price, 
            discountPrice, 
            category, 
            imageUrl, 
            availableLevels, // <-- Destructure new field
            productType 
        } = req.body;

        if (!name || !description || price == null || !category) {
            return res.status(400).json({ message: 'Name, description, price, and category are required' });
        }

        const newProduct = new Product({
            name,
            description,
            price,
            discountPrice: discountPrice || 0,
            category,
            imageUrl: imageUrl || '',
            availableLevels: Array.isArray(availableLevels) ? availableLevels : [], // <-- Save as array
            productType: productType || 'Digital'
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return handleValidationError(error, res);
        }
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error creating product', error: error.message });
    }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Admin (Protected by verifyFirebaseToken)
export const updateProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const { 
            name, 
            description, 
            price, 
            discountPrice, 
            category, 
            imageUrl, 
            availableLevels, // <-- Destructure new field
            productType,
            isActive // Allow updating isActive if added to Product model
         } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price != null) updateData.price = price;
        if (discountPrice != null) updateData.discountPrice = discountPrice;
        if (category) updateData.category = category;
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (availableLevels) updateData.availableLevels = Array.isArray(availableLevels) ? availableLevels : []; // <-- Update as array
        if (productType) updateData.productType = productType;
        if (typeof isActive === 'boolean') updateData.isActive = isActive; // If Product has isActive

        updateData.updatedAt = Date.now(); // If model doesn't use timestamps: true or pre-save hook

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true, runValidators: true, context: 'query' }
        );

        if (updatedProduct) {
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
         if (error.name === 'ValidationError') {
            return handleValidationError(error, res);
        }
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error updating product', error: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin (Protected by verifyFirebaseToken)
export const deleteProduct = async (req, res) => {
     try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (deletedProduct) {
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error deleting product' });
    }
};