import React, { useEffect, useState } from "react";
import QuantitySelector from "./QuantitySelector";

function ProductInfo({ item, quantity, setQuantity, added, handleAddToCart, itemType = 'product' }) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const isCourse = itemType === 'course';

  const hasDiscount = item?.discountPrice > 0 && item?.discountPrice < item?.price;
  const discountPercentage = hasDiscount ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;

  useEffect(() => {
    // Set default format based on productType, allow selection if 'Both'
    // Only set format for products, not courses
    if (!isCourse) {
      setSelectedFormat(item?.productType === 'Both' ? null : item?.productType);
    }
  }, [item?._id, item?.productType, isCourse]);

  const handleAdd = () => {
    // Check format selection if applicable (only for products, not courses)
    if (!isCourse && (item?.productType === 'Digital' || item?.productType === 'Physical' || item?.productType === 'Both') && !selectedFormat) {
      alert("Please select a format before adding to cart.");
      return;
    }
    
    // Add item to cart, including selected options
    handleAddToCart({
      ...item,
      selectedFormat: isCourse ? undefined : selectedFormat, // Don't include format for courses
      // Ensure quantity is included if the handler expects it
      // quantity: quantity 
    });
  };

  // Check if this is a form-based course (not a price-based purchase)
  const isFormBased = item?.purchaseType === 'form';

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* Use title (course) or name (product) */}
      <h1 className="font-bold text-4xl lg:text-5xl">{item?.title || item?.name}</h1>
      
      {/* Subtitle - Only show for courses */}
      {isCourse && item?.subtitle && (
        <p className="text-lg text-gray-600 pt-1">{item.subtitle}</p>
      )} 

      {/* Pricing - Only show if purchaseType is 'price' */}
      {!isFormBased && (
        <div className="flex items-center space-x-3 pt-2">
          {hasDiscount ? (
            <>
              <span className="font-bold text-4xl lg:text-5xl text-black">₹{item.discountPrice}</span>
              <span className="text-2xl text-gray-400 line-through">₹{item.price}</span>
              <span className="bg-[#FDF2F2] text-red-600 text-sm font-semibold px-3 py-1 rounded-full">-{discountPercentage}%</span>
            </>
          ) : (
            <span className="font-bold text-4xl lg:text-5xl text-black">₹{item?.price}</span>
          )}
        </div>
      )}

      {/* Form-based course message */}
      {isFormBased && (
        <div className="pt-2">
          <p className="text-lg text-gray-700 mb-2">
            Fill out the form below to express your interest in this course.
          </p>
        </div>
      )}



      {/* Format Options - Only show for products (not courses) and price-based items */}
      {!isCourse && !isFormBased && (item?.productType === 'Digital' || item?.productType === 'Physical' || item?.productType === 'Both') && (
        <div className="pt-2"> {/* Added pt-2 for spacing */}
           <h3 className="font-medium text-gray-500 text-base mb-2">Format</h3> {/* Added label */}
           <div className="flex items-center p-1 rounded-full bg-gray-100 w-full max-w-xs"> {/* Added background */}
             {(item?.productType === 'Digital' || item?.productType === 'Both') && (
                <button
                  onClick={() => setSelectedFormat("Digital")}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${ // Adjusted text size/weight
                    selectedFormat === "Digital"
                      ? "bg-white text-red-700 shadow" // Use white background when selected
                      : "bg-transparent text-gray-600 hover:text-gray-800" // Transparent background
                  }`}
                >
                  Digital
                </button>
              )}
              {(item?.productType === 'Physical' || item?.productType === 'Both') && (
                <button
                  onClick={() => setSelectedFormat("Physical")}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${ // Adjusted text size/weight
                    selectedFormat === "Physical"
                      ? "bg-white text-red-700 shadow" // Use white background when selected
                      : "bg-transparent text-gray-600 hover:text-gray-800" // Transparent background
                  }`}
                >
                  Physical
                </button>
              )}
           </div>
        </div>
      )}
      
      {/* Quantity Selector + Cart - Only for price-based courses */}
      {!isFormBased && (
        <div className="pt-4">
          <QuantitySelector
            quantity={quantity}
            increaseQty={() => setQuantity((q) => q + 1)}
            decreaseQty={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
            added={added}
            handleAddToCart={handleAdd} // Use the updated handleAdd
            itemType={itemType} // Pass itemType to QuantitySelector
          />
        </div>
      )}

      {/* Form Button - Only for form-based courses */}
      {isFormBased && item?.formUrl && (
        <div className="pt-4">
          <a
            href={item.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors text-lg font-semibold shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Fill Form
          </a>
        </div>
      )}
    </div>
  );
}

export default ProductInfo;