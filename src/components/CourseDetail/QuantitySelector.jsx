import React from 'react';
import { FiMinus, FiPlus, FiShoppingCart, FiCheck } from 'react-icons/fi';
// 1. Re-import useNavigate
import { useNavigate } from 'react-router-dom';

function QuantitySelector({
  quantity,
  increaseQty,
  decreaseQty,
  added, // Use the 'added' prop again
  handleAddToCart, 
}) {
  // 2. Re-initialize navigate
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Quantity Adjuster (no changes) */}
      <div className="flex items-center border border-gray-300 rounded-full px-3 py-2">
        <button onClick={decreaseQty} className="text-gray-600 hover:text-red-600 disabled:opacity-50" disabled={quantity <= 1} aria-label="Decrease quantity"> <FiMinus className="w-5 h-5" /></button>
        <span className="font-semibold text-lg text-gray-900 w-10 text-center mx-2">{quantity}</span>
        <button onClick={increaseQty} className="text-gray-600 hover:text-red-600" aria-label="Increase quantity"> <FiPlus className="w-5 h-5" /></button>
      </div>

      {/* --- RESTORED CONDITIONAL BUTTON --- */}
      {/* Check the 'added' prop */}
      {added ? ( 
        // Button to navigate to cart after item is added
        <button
          // onClick navigates to cart
          onClick={() => navigate('/cart-checkout')} 
          className="flex-1 sm:flex-initial w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiCheck className="w-5 h-5" />
          Added! Go to Cart
        </button>
      ) : (
        // Button to add the item to the cart
        <button
          onClick={handleAddToCart} // Calls parent function which now only calls addToCart + setAdded
          className="flex-1 sm:flex-initial w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <FiShoppingCart className="w-5 h-5" />
          Add To Cart
        </button>
      )}
      {/* --- END RESTORED BUTTON --- */}
    </div>
  );
}

export default QuantitySelector;