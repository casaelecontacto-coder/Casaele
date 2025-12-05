import React from 'react';

// 1. Added "thumbnail" and "availableLevels" to the props
export default function Card({ 
  fileUrl, 
  image, 
  thumbnail, 
  title, 
  description, 
  tags, 
  availableLevels, 
  price, 
  discountPrice, 
  onClick 
}) {

  // 2. Updated displayImage to also check for "thumbnail"
  const displayImage = fileUrl || image || thumbnail;

  // 3. Use "availableLevels" as a fallback for "tags"
  const displayTags = tags || availableLevels;

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
        <p className="text-sm text-gray-600 mb-3 mt-1 line-clamp-2 h-10"> 
          {description}
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

          {typeof price === 'number' && (
            <div className="flex items-center gap-2">
              {discountPrice > 0 ? (
                <>
                  <span className="text-md font-semibold text-gray-800">₹{discountPrice}</span>
                  <span className="text-sm text-gray-400 line-through">₹{price}</span>
                </>
              ) : (
                <span className="text-md font-semibold text-gray-800">₹{price}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}