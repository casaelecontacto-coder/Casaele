import React from 'react';
import { useCurrency } from '../../context/CurrencyContext';

// 1. Added "thumbnail", "availableLevels", and "images" array to the props
export default function Card({
  fileUrl,
  image,
  thumbnail,
  images, // Support for images array from Course model
  imageUrls, // Support for imageUrls array from Product model
  title,
  description,
  tags,
  availableLevels,
  price,
  discountPrice,
  prices, // New multi-currency prices object
  onClick
}) {
  const { getPriceValue, getCurrencySymbol, currency } = useCurrency();

  // 2. Updated displayImage to check for images array, imageUrls array, thumbnail, and other fields
  const displayImage = (images && images.length > 0) 
    ? images[0] 
    : (imageUrls && imageUrls.length > 0)
    ? imageUrls[0]
    : fileUrl || image || thumbnail;

  // 3. Use "availableLevels" as a fallback for "tags"
  const displayTags = tags || availableLevels;

  // *** FIX: Strip HTML tags and limit description length to avoid showing too much text ***
  const plainDescription = description
    ? description.replace(/<[^>]+>/g, '').substring(0, 100).trim() // Limit to 100 characters
    : '';

  // Get currency-aware prices
  const currentPrice = prices?.[currency]?.price || price || 0;
  const currentDiscountPrice = prices?.[currency]?.discountPrice || discountPrice || 0;
  const hasDiscount = currentDiscountPrice > 0 && currentDiscountPrice < currentPrice;

  return (
    <div
      onClick={onClick}
      // Added flex properties to ensure consistent height
      className="bg-white rounded-lg cursor-pointer shadow-md w-full overflow-hidden flex flex-col h-full"
    >
      <img
        src={displayImage || "https://placehold.co/400x300/e5e7eb/4b5563?text=Image"}
        alt={title}
        className="w-full h-48 object-cover flex-shrink-0" // Standardized image height
      />

      <div className="p-4 flex flex-col flex-grow">
        {/* Title is now truncated to a single line */}
        <h3 className="font-semibold text-lg truncate" title={title}>{title}</h3>
        
        {/* Description is now limited to 2 lines */}
        {/* Use plainDescription instead of description */}
        <p className="text-sm text-gray-600 mb-3 mt-1 line-clamp-2 h-10"> 
          {plainDescription}
        </p>

        {/* Tags and Price will be pushed to the bottom */}
        <div className="mt-auto">
          {/* 4. Updated this section to use "displayTags" */}
          {displayTags && Array.isArray(displayTags) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {displayTags.map((tag, idx) => (
                <span key={idx} className="text-xs bg-pink-100 rounded-full px-3 py-1 text-gray-500">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(typeof price === 'number' || typeof currentPrice === 'number') && currentPrice > 0 && (
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-md font-semibold text-gray-800">{getCurrencySymbol()}{currentDiscountPrice}</span>
                  <span className="text-sm text-gray-400 line-through">{getCurrencySymbol()}{currentPrice}</span>
                </>
              ) : (
                <span className="text-md font-semibold text-gray-800">{getCurrencySymbol()}{currentPrice}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}