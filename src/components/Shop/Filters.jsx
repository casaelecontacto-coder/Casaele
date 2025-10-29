import React from 'react';
import { FiFilter } from 'react-icons/fi';

// Updated props 
function Filters({ 
    categoryData = {}, 
    selectedCategory, 
    setSelectedCategory, 
    // Min Price
    minPrice,
    setMinPrice,
    actualMinPrice,
    // Max Price
    maxPrice, 
    setMaxPrice,        
    actualMaxPrice,
    // Sort
    sortOrder,          
    setSortOrder,       
    // Level
    selectedLevels = [],
    setSelectedLevels,
    allProducts = [],
    itemType            
}) {
  
  const allItemsKey = ''; 
  const allItemsLabel = itemType === 'course' ? 'All Courses' : 'All Products';

  const sortedCategories = Object.keys(categoryData).sort((a, b) => {
      if (a === allItemsKey) return -1; 
      if (b === allItemsKey) return 1;
      return a.localeCompare(b); 
  });

  // Handler to ensure min price doesn't exceed max price
  const handleMinChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value <= maxPrice) {
      setMinPrice(value);
    }
  };

  // Handler to ensure max price doesn't go below min price
  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= minPrice) {
      setMaxPrice(value);
    }
  };

  // Extract available levels from all products
  const availableLevels = React.useMemo(() => {
    const levelSet = new Set();
    allProducts.forEach(product => {
      if (product.availableLevels && Array.isArray(product.availableLevels)) {
        product.availableLevels.forEach(level => levelSet.add(level));
      }
    });
    return Array.from(levelSet).sort();
  }, [allProducts]);

  // Count products for each level
  const levelCounts = React.useMemo(() => {
    const counts = {};
    availableLevels.forEach(level => {
      counts[level] = allProducts.filter(product => 
        product.availableLevels && product.availableLevels.includes(level)
      ).length;
    });
    return counts;
  }, [availableLevels, allProducts]);

  // Handle level toggle
  const handleLevelToggle = (level) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiFilter className="w-5 h-5 text-gray-500" />
          Filters
        </h3>
        {/* Optional Clear Filters Button */}
         <button 
           onClick={() => {
             setSelectedCategory(allItemsKey); 
             setMinPrice(actualMinPrice); // Reset min price
             setMaxPrice(actualMaxPrice); // Reset max price
             setSortOrder('newest'); 
             setSelectedLevels([]); // Clear selected levels
            }} 
           className="text-sm text-red-600 hover:text-red-800"
         >
           Clear All
         </button>
      </div>

      {/* Categories Filter */}
      <div className="mb-6">
        <h4 className="text-base font-medium text-gray-800 mb-3">Category</h4>
        <ul className="space-y-2">
          {sortedCategories.map((categoryKey) => {
            const categoryLabel = categoryKey === allItemsKey ? allItemsLabel : categoryKey; 
            return (
              <li key={categoryKey}>
                <button
                  onClick={() => setSelectedCategory(categoryKey)} 
                  className={`w-full text-left flex justify-between items-center px-3 py-2 rounded-md transition-colors text-sm ${
                    selectedCategory === categoryKey 
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{categoryLabel}</span> 
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                     selectedCategory === categoryKey ? 'bg-red-200' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {categoryData[categoryKey] || 0}
                  </span>
                </button>
              </li>
            );
            })}
        </ul>
      </div>

      {/* Level Filter */}
      {availableLevels.length > 0 && (
        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-800 mb-3">Level</h4>
          <div className="flex flex-wrap gap-2">
            {availableLevels.map((level) => (
              <label
                key={level}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors cursor-pointer text-sm ${
                  selectedLevels.includes(level)
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={() => handleLevelToggle(level)}
                  className="rounded accent-red-600 focus:ring-red-500"
                />
                <span className="font-medium">{level}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  selectedLevels.includes(level) ? 'bg-red-200' : 'bg-gray-200 text-gray-500'
                }`}>
                  {levelCounts[level] || 0}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* --- Combined Price Range Filter --- */}
      <div className="mb-6">
        <h4 className="text-base font-medium text-gray-800 mb-3">Price Range</h4>
        
        {/* Display Current Range */}
        <div className="flex items-center justify-between mb-2 text-sm text-gray-700 font-medium">
           <span>₹{minPrice}</span>
           <span>₹{maxPrice}</span>
        </div>

        {/* Min Price Slider */}
        <div className='mb-2'> {/* Added margin below min slider */}
          <label htmlFor="minPriceSlider" className="sr-only">Minimum Price</label>
          <input
            id="minPriceSlider"
            type="range"
            min={actualMinPrice}
            max={actualMaxPrice} 
            value={minPrice}
            onChange={handleMinChange} // Use specific handler
            step={10} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 range-thumb:bg-red-700"
          />
        </div>
        
        {/* Max Price Slider */}
        <div>
           <label htmlFor="maxPriceSlider" className="sr-only">Maximum Price</label>
           <input
             id="maxPriceSlider"
             type="range"
             min={actualMinPrice} 
             max={actualMaxPrice}
             value={maxPrice}
             onChange={handleMaxChange} // Use specific handler
             step={10} 
             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 range-thumb:bg-red-700"
           />
        </div>
        
        {/* Display Actual Range */}
         <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
            <span>Min: ₹{actualMinPrice}</span>
            <span>Max: ₹{actualMaxPrice}</span>
         </div>
      </div>
      {/* --- End Price Range Filter --- */}


      {/* Sort Order */}
      <div> 
        <h4 className="text-base font-medium text-gray-800 mb-3">Sort By</h4>
        <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 bg-white" 
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div> 
    </div>
  );
}

export default Filters;