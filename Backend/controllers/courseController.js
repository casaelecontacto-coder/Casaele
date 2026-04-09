import Course from '../models/Course.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinaryConfig.js';

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

// Utility to handle validation errors
const handleValidationError = (error, res) => {
    let errors = {};
    Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
    });
    return res.status(400).json({ message: "Validation Error", errors });
};

// @desc    Get all courses with filtering, sorting, pagination
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = Course.find({ isActive: true }); // Default to active courses for public view

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
        
        // Keyword search (searches across title, description, category, and availableLevels) - EXACT WORD MATCHING
        if (keyword && keyword.trim()) {
            const cleanKeyword = keyword.trim();
            const exactWordRegex = new RegExp(`\\b${cleanKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            
            query = query.or([
                { title: exactWordRegex },
                { description: exactWordRegex },
                { category: exactWordRegex },
                { availableLevels: { $in: [exactWordRegex] } }
            ]);
        }
        
        // Legacy search support
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = query.or([
                { title: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]);
        }
        
        // Price filtering
        if (maxPrice) {
            query = query.where('price').lte(parseFloat(maxPrice));
        }

        // Sorting
        let sortOption = { createdAt: -1 }; // Default: newest first
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
        const totalCourses = await Course.countDocuments(query.getFilter()); // Count based on current filter
        const totalPages = Math.ceil(totalCourses / limit);
        const courses = await query.skip(skip).limit(limit);

        res.json({
            courses,
            currentPage: page,
            totalPages,
            totalCourses,
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Server error fetching courses' });
    }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
    try {
        let course;
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            course = await Course.findById(req.params.id);
        }
        if (!course) {
            course = await Course.findOne({ slug: req.params.id });
        }
        if (course) {
            res.json(course);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        console.error('Error fetching course by ID:', error);
        res.status(500).json({ message: 'Server error fetching course' });
    }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Admin (Protected by verifyFirebaseToken)
export const createCourse = async (req, res) => {
    try {
        const {
            title,
            slug: customSlug,
            subtitle,
            description,
            price,
            discountPrice,
            category,
            instructor,
            level,
            availableLevels,
            productType,
            purchaseType,
            formUrl
        } = req.body;

        // --- 2. START IMAGE UPLOAD LOGIC ---
        let imageUrl = ''; // Default
        let imagePublicId = ''; // To store for later deletion

        // Check if a file was uploaded by multer
        if (req.file) {
            // Convert buffer to data URI
            const fileBuffer = req.file.buffer.toString('base64');
            const dataUri = `data:${req.file.mimetype};base64,${fileBuffer}`;

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'lms-courses', // Folder in Cloudinary
                resource_type: 'auto',
            });
            
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
        } else if (req.body.thumbnail) {
            // Fallback if you are still sending a URL in the body
            imageUrl = req.body.thumbnail;
        }
        // --- END IMAGE UPLOAD LOGIC ---


        // Basic validation (more comprehensive validation is in the model)
        if (!title || !description || !category) {
            return res.status(400).json({ message: 'Title, description, and category are required' });
        }

        // Validate purchaseType
        const validPurchaseType = purchaseType || 'price';
        if (!['price', 'form'].includes(validPurchaseType)) {
            return res.status(400).json({ message: 'purchaseType must be either "price" or "form"' });
        }

        // If purchaseType is 'price', price is required
        if (validPurchaseType === 'price' && (price == null || price < 0)) {
            return res.status(400).json({ message: 'Price is required when purchaseType is "price"' });
        }

        // If purchaseType is 'form', formUrl is required
        if (validPurchaseType === 'form' && (!formUrl || !formUrl.trim())) {
            return res.status(400).json({ message: 'Form URL is required when purchaseType is "form"' });
        }

        const baseSlug = customSlug ? generateSlug(customSlug) : generateSlug(title);
        const slug = await ensureUniqueSlug(Course, baseSlug);

        const newCourse = new Course({
            title,
            slug,
            subtitle: subtitle || '',
            description,
            price: validPurchaseType === 'price' ? price : 0, // Only set price if purchaseType is 'price'
            discountPrice: validPurchaseType === 'price' ? (discountPrice || 0) : 0,
            category,
            instructor: instructor || 'CasaDeELE Team',
            thumbnail: imageUrl, // <-- 3. SAVE THE CLOUDINARY URL
            images: [imageUrl], // <-- 4. SAVE THE CLOUDINARY URL (or as needed)
            imagePublicId: imagePublicId, // <-- 5. SAVE THE PUBLIC ID
            level, 
            availableLevels: Array.isArray(availableLevels) ? availableLevels : [],
            productType: productType || 'Digital',
            purchaseType: validPurchaseType,
            formUrl: validPurchaseType === 'form' ? formUrl.trim() : ''
        });

        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return handleValidationError(error, res);
        }
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Server error creating course', error: error.message });
    }
};

// @desc    Update an existing course
// @route   PUT /api/courses/:id
// @access  Admin (Protected by verifyFirebaseToken)
export const updateCourse = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID format' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Construct update object with fields from req.body
        const updateData = { ...req.body };

        // Handle slug update
        if (req.body.slug !== undefined) {
            const baseSlug = generateSlug(req.body.slug || req.body.title || course.title);
            if (baseSlug) updateData.slug = await ensureUniqueSlug(Course, baseSlug, req.params.id);
        }

        // Validate purchaseType if provided
        if (req.body.purchaseType) {
            if (!['price', 'form'].includes(req.body.purchaseType)) {
                return res.status(400).json({ message: 'purchaseType must be either "price" or "form"' });
            }
            
            const validPurchaseType = req.body.purchaseType;
            
            // If switching to 'price', ensure price is provided
            if (validPurchaseType === 'price' && (req.body.price == null || req.body.price < 0)) {
                return res.status(400).json({ message: 'Price is required when purchaseType is "price"' });
            }
            
            // If switching to 'form', ensure formUrl is provided
            if (validPurchaseType === 'form' && (!req.body.formUrl || !req.body.formUrl.trim())) {
                return res.status(400).json({ message: 'Form URL is required when purchaseType is "form"' });
            }
            
            // Clean up fields based on purchaseType
            if (validPurchaseType === 'form') {
                // Clear price fields when switching to form
                updateData.price = 0;
                updateData.discountPrice = 0;
            } else if (validPurchaseType === 'price') {
                // Clear formUrl when switching to price
                updateData.formUrl = '';
            }
        }

        // --- 6. START IMAGE UPDATE LOGIC ---
        // Check if a new file is being uploaded
        if (req.file) {
            // Optional: Delete old image from Cloudinary
            if (course.imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(course.imagePublicId);
                } catch (err) {
                    console.error("Error deleting old image from Cloudinary:", err);
                    // Don't block update if deletion fails, just log it
                }
            }

            // Convert and upload the new file
            const fileBuffer = req.file.buffer.toString('base64');
            const dataUri = `data:${req.file.mimetype};base64,${fileBuffer}`;
            
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'lms-courses',
                resource_type: 'auto',
            });
            
            // 8. Add new image URL and public_id to update data
            updateData.thumbnail = result.secure_url;
            updateData.images = [result.secure_url]; // or push to array
            updateData.imagePublicId = result.public_id;
        }
        // --- END IMAGE UPDATE LOGIC ---
        
        // Manually handle array/boolean fields from body to avoid them being erased
        if (req.body.availableLevels) {
            updateData.availableLevels = Array.isArray(req.body.availableLevels) ? req.body.availableLevels : [];
        } else if (updateData.hasOwnProperty('availableLevels') && !req.body.availableLevels) {
            // If field is present in body but empty (e.g., from form)
            updateData.availableLevels = [];
        }

        if (req.body.images) {
             updateData.images = Array.isArray(req.body.images) ? req.body.images : [];
        }

        if (typeof req.body.isActive === 'boolean') {
            updateData.isActive = req.body.isActive;
        }

        updateData.updatedAt = Date.now(); // Manually update updatedAt

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, // Use $set to update only provided fields
            { new: true, runValidators: true, context: 'query' } // context needed for some validators on update
        );

        res.json(updatedCourse);

    } catch (error) {
         if (error.name === 'ValidationError') {
            return handleValidationError(error, res);
        }
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Server error updating course', error: error.message });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Admin (Protected by verifyFirebaseToken)
export const deleteCourse = async (req, res) => {
    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID format' });
        }

        // --- Optional: Delete image from Cloudinary before deleting from DB ---
        const course = await Course.findById(req.params.id);
        if (course && course.imagePublicId) {
             try {
                await cloudinary.uploader.destroy(course.imagePublicId);
            } catch (err) {
                console.error("Error deleting image from Cloudinary during course delete:", err);
            }
        }
        // --- End of optional Cloudinary delete ---

        const deletedCourse = await Course.findByIdAndDelete(req.params.id);
        if (deletedCourse) {
            res.json({ message: 'Course deleted successfully' });
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Server error deleting course' });
    }
};