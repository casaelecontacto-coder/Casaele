import React, { useEffect, useState } from "react";
import QuantitySelector from "./QuantitySelector";

function ProductInfo({ item, quantity, setQuantity, added, handleAddToCart }) {
  const [selectedFormat, setSelectedFormat] = useState(null);

  const hasDiscount = item?.discountPrice > 0 && item?.discountPrice < item?.price;
  const discountPercentage = hasDiscount ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;

  useEffect(() => {
    // Set default format based on productType, allow selection if 'Both'
    setSelectedFormat(item?.productType === 'Both' ? null : item?.productType);
  }, [item?._id, item?.productType]);

  const handleAdd = () => {
    // Check format selection if applicable
    if ((item?.productType === 'Digital' || item?.productType === 'Physical' || item?.productType === 'Both') && !selectedFormat) {
      alert("Please select a format before adding to cart.");
      return;
    }
    
    // Add item to cart, including selected options
    handleAddToCart({
      ...item,
      selectedFormat,
      // Ensure quantity is included if the handler expects it
      // quantity: quantity 
    });
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      {/* Use title (course) or name (product) */}
      <h1 className="font-bold text-4xl lg:text-5xl">{item?.title || item?.name}</h1> 

      {/* Pricing */}
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



      {/* Format Options */}
      {(item?.productType === 'Digital' || item?.productType === 'Physical' || item?.productType === 'Both') && (
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
      
      {/* Quantity Selector + Cart */}
      <div className="pt-4">
        <QuantitySelector
          quantity={quantity}
          increaseQty={() => setQuantity((q) => q + 1)}
          decreaseQty={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
          added={added}
          handleAddToCart={handleAdd} // Use the updated handleAdd
        />
      </div>
    </div>
  );
}

export default ProductInfo;