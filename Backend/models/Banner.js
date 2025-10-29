// import mongoose from 'mongoose';

// const bannerSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   caption: { type: String },
//   imageUrl: { type: String, required: true }, // Cloudinary URL
//   link: { type: String }, // Optional link for banner
//   isActive: { type: Boolean, default: true },
//   position: { 
//     type: String, 
//     enum: ['hero', 'top', 'middle', 'bottom'], 
//     default: 'hero' 
//   },
//   order: { type: Number, default: 0 },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// bannerSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const Banner = mongoose.model('Banner', bannerSchema);
// export default Banner;





//depreceated file