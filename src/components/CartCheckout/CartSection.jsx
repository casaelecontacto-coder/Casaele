import React from 'react';
import { useCart } from '../../context/CartContext'; 
import { FiTrash2 } from 'react-icons/fi'; 

const DEFAULT_IMAGE = "https://placehold.co/100x80/e5e7eb/4b5563?text=Image";

function CartSection() {
  // Get cart data and functions from context
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();

  // Handler for quantity changes (input field or buttons)
  const handleQuantityChange = (uniqueId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    // Let the context handle validation (removes if < 1 or NaN)
    updateQuantity(uniqueId, qty); 
  };

  // *** DEBUG: Log cartItems received by the component ***
  console.log("CartSection: Rendering with cartItems:", cartItems);

  return (
    <div className="w-full lg:w-3/5 xl:w-2/3">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Shopping Cart</h2>

      {/* Check if cartItems is available and is an array */}
      {!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Your cart is currently empty.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Map over the items */}
          {cartItems.map((item, index) => {
            // --- Robust Property Access ---
            // Use optional chaining and default values extensively
            const uniqueId = item?.uniqueId || `item-${index}`; // Fallback key
            const imageUrl = item?.images?.[0] || item?.thumbnail || item?.imageUrl || DEFAULT_IMAGE;
            const itemName = item?.title || item?.name || 'Unknown Item';
            const itemPrice = Number(item?.discountPrice || item?.price || 0);
            const itemQuantity = Number(item?.quantity || 1); // Default to 1 if missing
            const selectedLevel = item?.selectedLevel;
            const selectedFormat = item?.selectedFormat;
            // --- End Robust Property Access ---
            
            // *** DEBUG: Log each item being rendered ***
             console.log("CartSection: Rendering item:", item);

            return (
              <div key={uniqueId} className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Image */}
                <img 
                  src={imageUrl} 
                  alt={itemName} 
                  className="w-full sm:w-24 h-20 object-cover rounded-md flex-shrink-0" 
                />

                {/* Details */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">{itemName}</h3>
                  {(selectedLevel || selectedFormat) && (
                     <p className="text-sm text-gray-500 mt-1">
                       {selectedLevel && `Level: ${selectedLevel}`}
                       {selectedLevel && selectedFormat && ', '}
                       {selectedFormat && `Format: ${selectedFormat}`}
                     </p>
                  )}
                  {/* Display price, ensure it's a number */}
                  <p className="text-sm text-gray-600 font-medium mt-1">₹{itemPrice.toFixed(2)}</p> 
                </div>

                {/* Quantity and Remove */}
                <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                   {/* Quantity Input/Buttons */}
                   <div className="flex items-center border border-gray-200 rounded">
                     <button
                       onClick={() => handleQuantityChange(uniqueId, itemQuantity - 1)} 
                       className="px-2 py-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                       disabled={itemQuantity <= 1}
                     >
                       -
                     </button>
                     <input
                       type="number"
                       min="1"
                       value={itemQuantity} // Use safe quantity value
                       // Handle direct input change
                       onChange={(e) => handleQuantityChange(uniqueId, e.target.value)} 
                       className="w-12 text-center border-l border-r border-gray-200 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                       aria-label={`Quantity for ${itemName}`}
                     />
                     <button
                       onClick={() => handleQuantityChange(uniqueId, itemQuantity + 1)} 
                       className="px-2 py-1 text-gray-500 hover:text-green-600"
                     >
                       +
                     </button>
                   </div>
                   
                   {/* Remove Button */}
                   <button
                     onClick={() => removeFromCart(uniqueId)} 
                     className="text-gray-400 hover:text-red-600 p-1"
                     title="Remove item"
                   >
                     <FiTrash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            );
          })}

          {/* Cart Total */}
          <div className="bg-white rounded-lg shadow p-4 mt-6 text-right">
             <span className="text-lg font-semibold text-gray-800">
               {/* Ensure totalPrice is calculated correctly in context */}
               Subtotal: ₹{totalPrice.toFixed(2)} 
             </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartSection;