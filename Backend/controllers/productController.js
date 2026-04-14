import Product from '../models/Product.js';
import mongoose from 'mongoose';

function generateSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureUniqueSlug(Model, slug, excludeId = null) {
  let candidate = slug;
  let counter = 1;
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Model.findOne(query);
    if (!existing) return candidate;
    candidate = `${slug}-${counter++}`;
  }
}

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

        const showAll = req.query.all === 'true';
        let query = Product.find(showAll ? {} : { isActive: { $ne: false } });

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
        let product;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            product = await Product.findById(req.params.id).populate('embedIds');
        }
        // Fallback: try slug lookup
        if (!product) {
            product = await Product.findOne({ slug: req.params.id }).populate('embedIds');
        }
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
            slug: customSlug,
            description,
            price,
            discountPrice,
            category,
            imageUrls,
            availableLevels,
            productType,
            digitalFiles,
            downloadSettings,
            prices,
            subscriptionUrl,
            subscriptionLabel,
            embedIds,
            embeds
        } = req.body;

        if (!name || !description || price == null || !category) {
            return res.status(400).json({ message: 'Name, description, price, and category are required' });
        }

        // Handle inline embed creation (same pattern as Materials)
        let finalEmbedIds = Array.isArray(embedIds) ? [...embedIds] : [];
        if (embeds && Array.isArray(embeds) && embeds.length > 0) {
            const Embed = (await import('../models/Embed.js')).default;
            for (const embedData of embeds) {
                if (embedData.title && embedData.type && embedData.embedCode) {
                    const embed = await Embed.create({
                        title: embedData.title,
                        type: embedData.type,
                        embedCode: embedData.embedCode
                    });
                    finalEmbedIds.push(embed._id);
                }
            }
        }

        const baseSlug = customSlug ? generateSlug(customSlug) : generateSlug(name);
        const slug = await ensureUniqueSlug(Product, baseSlug);

        const newProduct = new Product({
            name,
            slug,
            description,
            price,
            discountPrice: discountPrice || 0,
            category,
            imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
            embedIds: finalEmbedIds,
            availableLevels: Array.isArray(availableLevels) ? availableLevels : [],
            productType: productType || 'Digital',
            digitalFiles: Array.isArray(digitalFiles) ? digitalFiles : [],
            downloadSettings: downloadSettings || { maxDownloads: 3, linkExpiryDays: 30 },
            prices: prices || { USD: { price: 0, discountPrice: 0 }, EUR: { price: 0, discountPrice: 0 }, INR: { price: 0, discountPrice: 0 } },
            subscriptionUrl: subscriptionUrl || '',
            subscriptionLabel: subscriptionLabel || 'Subscribe'
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
            slug: customSlug,
            description,
            price,
            discountPrice,
            category,
            imageUrls,
            availableLevels,
            productType,
            isActive,
            digitalFiles,
            downloadSettings,
            prices,
            subscriptionUrl,
            subscriptionLabel,
            embedIds,
            embeds
        } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (customSlug !== undefined) {
            const baseSlug = generateSlug(customSlug || name || '');
            if (baseSlug) updateData.slug = await ensureUniqueSlug(Product, baseSlug, req.params.id);
        }
        if (description) updateData.description = description;
        if (price != null) updateData.price = price;
        if (discountPrice != null) updateData.discountPrice = discountPrice;
        if (category) updateData.category = category;

        if (imageUrls) {
            updateData.imageUrls = Array.isArray(imageUrls) ? imageUrls : [];
        }

        if (availableLevels) updateData.availableLevels = Array.isArray(availableLevels) ? availableLevels : [];
        if (productType) updateData.productType = productType;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        // Digital product fields
        if (digitalFiles !== undefined) {
            updateData.digitalFiles = Array.isArray(digitalFiles) ? digitalFiles : [];
        }
        if (downloadSettings) {
            updateData.downloadSettings = downloadSettings;
        }

        // Multi-currency prices
        if (prices) {
            updateData.prices = prices;
        }

        // Subscription fields
        if (subscriptionUrl !== undefined) updateData.subscriptionUrl = subscriptionUrl;
        if (subscriptionLabel !== undefined) updateData.subscriptionLabel = subscriptionLabel;

        // Embeds
        if (embedIds !== undefined) {
            let finalEmbedIds = Array.isArray(embedIds) ? [...embedIds] : [];
            if (embeds && Array.isArray(embeds) && embeds.length > 0) {
                const Embed = (await import('../models/Embed.js')).default;
                for (const embedData of embeds) {
                    if (!embedData._id && embedData.title && embedData.type && embedData.embedCode) {
                        const embed = await Embed.create({
                            title: embedData.title,
                            type: embedData.type,
                            embedCode: embedData.embedCode
                        });
                        finalEmbedIds.push(embed._id);
                    }
                }
            }
            updateData.embedIds = finalEmbedIds;
        }

        updateData.updatedAt = Date.now();

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