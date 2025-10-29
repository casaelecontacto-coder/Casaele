import React, { useState, useEffect, useMemo } from 'react'; // Import useMemo
import Banner from '../components/Shop/Banner';
import Filters from '../components/Shop/Filters';
import ProductGrid from '../components/Shop/ProductGrid';
import Pagination from '../components/Shop/Pagination';
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';

function ProductsPage() {
  const [allProducts, setAllProducts] = useState([]); // Store ALL fetched products
  const [filteredProducts, setFilteredProducts] = useState([]); // Store products after ALL filters
  const [loading, setLoading] = useState(true); // Combined loading state
  
  // Category State
  const [allCategories, setAllCategories] = useState([]); 
  const [categoriesMap, setCategoriesMap] = useState({}); 
  const [selectedCategory, setSelectedCategory] = useState(''); // '' for 'All'
  
  // Price State
  const [minPrice, setMinPrice] = useState(0); 
  const [maxPrice, setMaxPrice] = useState(1000); 
  const [actualMinPrice, setActualMinPrice] = useState(0);
  const [actualMaxPrice, setActualMaxPrice] = useState(1000); 

  // Sort State
  const [sortOrder, setSortOrder] = useState('newest'); 
  
  // Level State
  const [selectedLevels, setSelectedLevels] = useState([]); // Array of selected levels
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // --- Initial Data Fetch ---
  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGet('/api/categories'),
      apiGet('/api/products') // Fetch ALL products
    ]).then(([categoriesData, allProductsData]) => {
      
      const fetchedCategories = categoriesData?.categories || [];
      setAllCategories(fetchedCategories); 

      const fetchedProducts = Array.isArray(allProductsData?.products) ? allProductsData.products : (Array.isArray(allProductsData) ? allProductsData : []);
      setAllProducts(fetchedProducts); // Store all raw products

      // --- Calculate Price Range ---
      let min = Infinity;
      let max = 0;
      fetchedProducts.forEach(item => {
        const price = Number(item.discountPrice || item.price || 0);
        if (price < min) min = price;
        if (price > max) max = price;
      });
      // Handle case with no products or free products
      const finalMin = min === Infinity ? 0 : Math.floor(min / 10) * 10; // Round down to nearest 10
      const finalMax = max === 0 ? 1000 : Math.ceil(max / 10) * 10;   // Round up to nearest 10
      setActualMinPrice(finalMin);
      setActualMaxPrice(finalMax);
      setMinPrice(finalMin); // Initialize filter min
      setMaxPrice(finalMax); // Initialize filter max
      // --- End Price Range ---

      // Build Category Map (counts based on ALL products)
      const categoryMap = {
        '': fetchedProducts.length, // 'All Products' count
      };
      fetchedCategories.forEach(cat => {
        const count = fetchedProducts.filter(p => p.category === cat.name).length; 
        if (count > 0) {
          categoryMap[cat.name] = count;
        }
      });
      setCategoriesMap(categoryMap);
      
    }).catch(error => {
      console.error("Error fetching initial product data:", error);
      setAllProducts([]);
      setCategoriesMap({ '': 0 });
    }).finally(() => {
      setLoading(false); // Stop loading only after all calculations are done
    });
  }, []); // Run only once on mount

  // --- Apply Filters and Sort (Client-Side) ---
  useEffect(() => {
    let tempFiltered = [...allProducts];

    // 1. Filter by Category
    if (selectedCategory) { // Check if category is selected (not '')
        tempFiltered = tempFiltered.filter(product => product.category === selectedCategory);
    }

    // 2. Filter by Price Range
    tempFiltered = tempFiltered.filter(product => {
        const price = Number(product.discountPrice || product.price || 0);
        return price >= minPrice && price <= maxPrice;
    });

    // 3. Filter by Level
    if (selectedLevels.length > 0) {
        tempFiltered = tempFiltered.filter(product => {
            const productLevels = product.availableLevels || [];
            return selectedLevels.some(level => productLevels.includes(level));
        });
    }

    // 4. Sort
    tempFiltered.sort((a, b) => {
      const priceA = Number(a.discountPrice || a.price || 0);
      const priceB = Number(b.discountPrice || b.price || 0);
      switch (sortOrder) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'newest':
        default:
           // Assuming createdAt exists, otherwise sort doesn't work for 'newest'
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); 
      }
    });

    setFilteredProducts(tempFiltered); // Update the state with fully filtered list
    setCurrentPage(1); // Reset page whenever filters change

  }, [selectedCategory, minPrice, maxPrice, sortOrder, selectedLevels, allProducts]); // Rerun when filters or base data change


  // --- Pagination Logic ---
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    return filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // --- Handlers ---
  // Handlers now just update state, the useEffect above handles the filtering
  const handleCategoryChange = (category) => setSelectedCategory(category);
  const handleMinPriceChange = (price) => setMinPrice(price);
  const handleMaxPriceChange = (price) => setMaxPrice(price);
  const handleSortChange = (sortValue) => setSortOrder(sortValue);
  const handleLevelChange = (levels) => setSelectedLevels(levels);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); 
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Banner /> 
      <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-20 mt-10 mb-10">
        
        {/* Filters Sidebar */}
        <div className="w-full lg:w-1/4 lg:sticky lg:top-24 h-fit">
          {!loading && ( // Render filters only after initial load (to have price range)
            <Filters
              categoryData={categoriesMap} 
              selectedCategory={selectedCategory} 
              setSelectedCategory={handleCategoryChange} 
              // Min Price Props
              minPrice={minPrice}
              setMinPrice={handleMinPriceChange}
              actualMinPrice={actualMinPrice}
              // Max Price Props
              maxPrice={maxPrice}
              setMaxPrice={handleMaxPriceChange} 
              actualMaxPrice={actualMaxPrice}
              // Sort Props
              sortOrder={sortOrder}
              setSortOrder={handleSortChange} 
              // Level Props
              selectedLevels={selectedLevels}
              setSelectedLevels={handleLevelChange}
              allProducts={allProducts}
              itemType="product" 
            />
          )}
           {loading && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-96 animate-pulse"></div>} {/* Placeholder */}
        </div>
        
        {/* Products Grid and Pagination */}
        <div className="w-full lg:w-3/4">
          {loading ? (
             <div className="flex justify-center items-center h-64"><Spinner /></div>
          ) : (
            <>
              {/* Product Grid now receives the paginated items */}
              <ProductGrid 
                  products={currentItems} // Pass paginated items
                  itemType="product" 
              /> 
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 sm:mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;