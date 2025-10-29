import React, { useState, useEffect, useMemo } from 'react'; // Import useMemo
import Banner from '../components/Shop/Banner';
import Filters from '../components/Shop/Filters'; 
import ProductGrid from '../components/Shop/ProductGrid';
import Pagination from '../components/Shop/Pagination';
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';

function CoursesPage() {
  const [allCourses, setAllCourses] = useState([]); // Store ALL fetched courses
  const [filteredCourses, setFilteredCourses] = useState([]); // Store courses after ALL filters
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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // --- Initial Data Fetch ---
  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGet('/api/categories'),
      apiGet('/api/courses') // Fetch ALL courses
    ]).then(([categoriesData, allCoursesData]) => {
      
      const fetchedCategories = categoriesData?.categories || [];
      setAllCategories(fetchedCategories); 

      const fetchedCourses = Array.isArray(allCoursesData?.courses) ? allCoursesData.courses : (Array.isArray(allCoursesData) ? allCoursesData : []);
      setAllCourses(fetchedCourses); // Store all raw courses

      // --- Calculate Price Range ---
      let min = Infinity;
      let max = 0;
      fetchedCourses.forEach(item => {
        const price = Number(item.discountPrice || item.price || 0);
        if (price < min) min = price;
        if (price > max) max = price;
      });
      const finalMin = min === Infinity ? 0 : Math.floor(min / 10) * 10; 
      const finalMax = max === 0 ? 1000 : Math.ceil(max / 10) * 10;   
      setActualMinPrice(finalMin);
      setActualMaxPrice(finalMax);
      setMinPrice(finalMin); 
      setMaxPrice(finalMax); 
      // --- End Price Range ---

      // Build Category Map (counts based on ALL courses)
      const categoryMap = {
        '': fetchedCourses.length, // 'All Courses' count
      };
      fetchedCategories.forEach(cat => {
        const count = fetchedCourses.filter(c => c.category === cat.name).length; 
        if (count > 0) {
          categoryMap[cat.name] = count;
        }
      });
      setCategoriesMap(categoryMap);
      
    }).catch(error => {
      console.error("Error fetching initial course data:", error);
      setAllCourses([]);
      setCategoriesMap({ '': 0 });
    }).finally(() => {
      setLoading(false); 
    });
  }, []); // Run only once on mount

  // --- Apply Filters and Sort (Client-Side) ---
  useEffect(() => {
    // Start with all courses fetched initially
    let tempFiltered = [...allCourses]; 

    // 1. Filter by Category
    if (selectedCategory) { // Check if category is selected (not '')
        tempFiltered = tempFiltered.filter(course => course.category === selectedCategory);
    }

    // 2. Filter by Price Range
    tempFiltered = tempFiltered.filter(course => {
        const price = Number(course.discountPrice || course.price || 0);
        return price >= minPrice && price <= maxPrice;
    });

    // 3. Sort
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
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); 
      }
    });

    setFilteredCourses(tempFiltered); // Update the state with fully filtered list
    setCurrentPage(1); // Reset page whenever filters change

  }, [selectedCategory, minPrice, maxPrice, sortOrder, allCourses]); // Rerun when filters or base data change


  // --- Pagination Logic ---
  // Calculate items for the current page based on the filtered list
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    return filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredCourses, currentPage, ITEMS_PER_PAGE]);

  // Calculate total pages based on the filtered list
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  // --- Handlers ---
  const handleCategoryChange = (category) => setSelectedCategory(category);
  const handleMinPriceChange = (price) => setMinPrice(price);
  const handleMaxPriceChange = (price) => setMaxPrice(price);
  const handleSortChange = (sortValue) => setSortOrder(sortValue);
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
           {/* Render filters only after initial load */}
          {!loading && (
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
              itemType="course" // Specify item type
            />
          )}
          {/* Placeholder while loading */}
          {loading && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-96 animate-pulse"></div>} 
        </div>
        
        {/* Courses Grid and Pagination */}
        <div className="w-full lg:w-3/4">
          {loading ? (
             <div className="flex justify-center items-center h-64"><Spinner /></div>
          ) : (
            <>
              {/* Product Grid receives paginated items */}
              <ProductGrid 
                  products={currentItems} // Pass paginated courses
                  itemType="course" 
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

export default CoursesPage;