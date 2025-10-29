// import Banner from '../models/Banner.js';

// // @route   GET /api/banners
// // @desc    Get all banners
// // @access  Admin
// export async function getBanners(req, res) {
//   try {
//     const { 
//       page = 1, 
//       limit = 10, 
//       position, 
//       isActive,
//       search,
//       sortBy = 'order',
//       sortOrder = 'asc'
//     } = req.query;

//     const query = {};
    
//     if (position) query.position = position;
//     if (isActive !== undefined) query.isActive = isActive === 'true';
//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { caption: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

//     const banners = await Banner.find(query)
//       .sort(sortOptions)
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Banner.countDocuments(query);

//     res.status(200).json({
//       banners,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     console.error('Error fetching banners:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// }

// // @route   GET /api/banners/:id
// // @desc    Get single banner
// // @access  Admin
// export async function getBannerById(req, res) {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) {
//       return res.status(404).json({ message: 'Banner not found' });
//     }
//     res.status(200).json(banner);
//   } catch (error) {
//     console.error('Error fetching banner:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// }

// // @route   POST /api/banners
// // @desc    Create new banner
// // @access  Admin
// export async function createBanner(req, res) {
//   try {
//     const banner = new Banner(req.body);
//     await banner.save();
//     res.status(201).json({ message: 'Banner created successfully', banner });
//   } catch (error) {
//     console.error('Error creating banner:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// }

// // @route   PUT /api/banners/:id
// // @desc    Update banner
// // @access  Admin
// export async function updateBanner(req, res) {
//   try {
//     const banner = await Banner.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );
//     if (!banner) {
//       return res.status(404).json({ message: 'Banner not found' });
//     }
//     res.status(200).json({ message: 'Banner updated successfully', banner });
//   } catch (error) {
//     console.error('Error updating banner:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// }

// // @route   DELETE /api/banners/:id
// // @desc    Delete banner
// // @access  Admin
// export async function deleteBanner(req, res) {
//   try {
//     const banner = await Banner.findByIdAndDelete(req.params.id);
//     if (!banner) {
//       return res.status(404).json({ message: 'Banner not found' });
//     }
//     res.status(200).json({ message: 'Banner deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting banner:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// }

// // @route   PUT /api/banners/:id/toggle
// // @desc    Toggle banner active status
// // @access  Admin
// export async function toggleBannerStatus(req, res) {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) {
//       return res.status(404).json({ message: 'Banner not found' });
//     }
    
//     banner.isActive = !banner.isActive;
//     await banner.save();
    
//     res.status(200).json({ 
//       message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`, 
//       banner 
//     });
//   } catch (error) {
//     console.error('Error toggling banner status:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// }
