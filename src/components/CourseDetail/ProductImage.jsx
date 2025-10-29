import React from 'react';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';

// Default placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/600x500/e5e7eb/4b5563?text=Image";

function ProductImage({ item }) { // Receives either a course or a product object as 'item'
  let displayImages = [];

  // --- THIS IS THE FIX ---
  // Check multiple possible image fields in order of preference:
  // 1. 'images' array (for Courses with multiple images)
  // 2. 'imageUrl' string (for Products with a single image)
  // 3. 'thumbnail' string (fallback for older data, if any)
  if (item?.images?.length > 0) {
    displayImages = item.images; // Use the array directly
  } else if (item?.imageUrl) {
    displayImages = [item.imageUrl]; // Put the single product image URL into an array
  } else if (item?.thumbnail) {
    displayImages = [item.thumbnail]; // Fallback for older data
  }
  // --- END OF FIX ---

  // If after checking all fields, we still have no images, use the placeholder
  if (displayImages.length === 0) {
    displayImages.push(PLACEHOLDER_IMAGE);
  }

  return (
    <div className="w-full">
      <Carousel
        showArrows={displayImages.length > 1} // Show arrows only if multiple images
        infiniteLoop={displayImages.length > 1} // Loop only if multiple images
        showThumbs={displayImages.length > 1} // Show thumbs only if multiple images
        thumbWidth={80}
        className="product-carousel"
        // Prevent interaction if only placeholder is shown
        emulateTouch={displayImages.length > 1 && displayImages[0] !== PLACEHOLDER_IMAGE}
        showStatus={false} // Hide the "1 of X" status
      >
        {displayImages.map((img, index) => (
          <div key={index}>
            <img
              src={img}
              // Use title (course) or name (product) for alt text
              alt={`${item?.title || item?.name || 'Product Image'} ${index + 1}`} 
              className="w-full h-auto object-cover rounded-2xl aspect-[6/5]"
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}

export default ProductImage;