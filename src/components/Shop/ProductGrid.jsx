import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';

const DEFAULT_IMAGE = "https://placehold.co/400x300/e5e7eb/4b5563?text=Image";

// Receives paginated products and itemType
function ProductGrid({ products, itemType }) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {products && products.length > 0 ? (
        products.map((product) => {
          const detailUrl = itemType === 'course' 
              ? `/course-detail/${product._id}` 
              : `/product-detail/${product._id}`; 

          const imageUrl = (product.images && product.images[0]) || product.thumbnail || product.imageUrl || DEFAULT_IMAGE;
          const title = product.title || product.name;

          return (
            <Link 
              key={product._id} 
              to={detailUrl} 
              className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Card content */}
              <div className="aspect-[4/3] overflow-hidden">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4 sm:p-5">
                 <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">
                   {product.category || (itemType === 'course' ? 'Course' : 'Product')} 
                 </span>
                 <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
                   {title} 
                 </h3>
                 <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                   {product.description}
                 </p>
                 <div className="flex items-center justify-between">
                   <span className="text-xl font-bold text-gray-900">
                     ₹{product.discountPrice || product.price || 0}
                   </span>
                   <button 
                     onClick={(e) => { e.preventDefault(); console.log("Add to cart:", title); }}
                     className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors duration-200 opacity-0 group-hover:opacity-100"
                     aria-label="Add to cart"
                   >
                     <FiShoppingCart className="w-5 h-5" />
                   </button>
                 </div>
              </div>
            </Link>
          );
        })
      ) : (
         <div className="text-center col-span-full py-12 text-gray-500">
             {/* Updated message */}
            No {itemType === 'course' ? 'courses' : 'products'} match your current filters.
         </div>
      )}
    </div>
  );
}

export default ProductGrid;