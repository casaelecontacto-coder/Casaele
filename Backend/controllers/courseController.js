import Course from '../models/Course.js';
import mongoose from 'mongoose';

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
            
            // Create regex that matches whole words only (not partial matches)
            // \b ensures word boundaries, so "hand" won't match "handsome" or "shorthand"
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid course ID format' });
        }
        const course = await Course.findById(req.params.id);
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
            description, 
            price, 
            discountPrice, 
            category, 
            instructor, 
            thumbnail, 
            images, 
            level, 
            availableLevels, // <-- Destructure new field
            productType 
        } = req.body;

        // Basic validation (more comprehensive validation is in the model)
        if (!title || !description || price == null || !category) { // Check if price is provided (can be 0)
            return res.status(400).json({ message: 'Title, description, price, and category are required' });
        }

        const newCourse = new Course({
            title,
            description,
            price,
            discountPrice: discountPrice || 0,
            category,
            instructor: instructor || 'CasaDeELE Team',
            thumbnail: thumbnail || '', // Keep thumbnail if still used, otherwise remove
            images: Array.isArray(images) ? images : [], 
            level, // Keep if still relevant
            availableLevels: Array.isArray(availableLevels) ? availableLevels : [], // <-- Save as array, default empty
            productType: productType || 'Digital'
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

        const { 
            title, 
            description, 
            price, 
            discountPrice, 
            category, 
            instructor, 
            thumbnail, 
            images, 
            level, 
            availableLevels, // <-- Destructure new field
            productType,
            isActive // Allow updating isActive status
         } = req.body;

        // Construct update object only with provided fields
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (price != null) updateData.price = price; // Allow setting price to 0
        if (discountPrice != null) updateData.discountPrice = discountPrice;
        if (category) updateData.category = category;
        if (instructor) updateData.instructor = instructor;
        if (thumbnail) updateData.thumbnail = thumbnail; // Keep if used
        if (images) updateData.images = Array.isArray(images) ? images : [];
        if (level) updateData.level = level;
        if (availableLevels) updateData.availableLevels = Array.isArray(availableLevels) ? availableLevels : []; // <-- Update as array
        if (productType) updateData.productType = productType;
        if (typeof isActive === 'boolean') updateData.isActive = isActive; // Update isActive status
        
        updateData.updatedAt = Date.now(); // Manually update updatedAt if pre-save hook isn't used

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, // Use $set to update only provided fields
            { new: true, runValidators: true, context: 'query' } // context needed for some validators on update
        );

        if (updatedCourse) {
            res.json(updatedCourse);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
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