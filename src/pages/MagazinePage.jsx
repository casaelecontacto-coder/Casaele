import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';
import Pagination from '../components/Shop/Pagination';
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_IMAGE = "https://placehold.co/400x300/e5e7eb/4b5563?text=Magazine";

function MagazinePage() {
  const { getPriceValue, getCurrencySymbol, currency } = useCurrency();
  const [allMagazines, setAllMagazines] = useState([]);
  const [filteredMagazines, setFilteredMagazines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccess, setSelectedAccess] = useState(''); // '' = all, 'free', 'paid'
  const [sortOrder, setSortOrder] = useState('newest');

  // Price state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [actualMinPrice, setActualMinPrice] = useState(0);
  const [actualMaxPrice, setActualMaxPrice] = useState(1000);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Fetch data
  useEffect(() => {
    setLoading(true);
    apiGet('/api/magazines?limit=200')
      .then((data) => {
        const fetched = data.magazines || [];
        setAllMagazines(fetched);

        // Calculate price range from paid magazines
        let min = Infinity;
        let max = 0;
        fetched.forEach(item => {
          if (item.accessType === 'paid') {
            const price = item.prices?.[currency]?.discountPrice || item.prices?.[currency]?.price || item.discountPrice || item.price || 0;
            if (price < min) min = price;
            if (price > max) max = price;
          }
        });
        const finalMin = min === Infinity ? 0 : Math.floor(min / 10) * 10;
        const finalMax = max === 0 ? 1000 : Math.ceil(max / 10) * 10;
        setActualMinPrice(finalMin);
        setActualMaxPrice(finalMax);
        setMinPrice(finalMin);
        setMaxPrice(finalMax);
      })
      .catch((error) => {
        console.error('Error fetching magazines:', error);
        setAllMagazines([]);
      })
      .finally(() => setLoading(false));
  }, [currency]);

  // Build category map
  const categoriesMap = useMemo(() => {
    const map = { '': allMagazines.length };
    allMagazines.forEach(m => {
      if (m.category) {
        map[m.category] = (map[m.category] || 0) + 1;
      }
    });
    return map;
  }, [allMagazines]);

  const sortedCategories = useMemo(() => {
    return Object.keys(categoriesMap).sort((a, b) => {
      if (a === '') return -1;
      if (b === '') return 1;
      return a.localeCompare(b);
    });
  }, [categoriesMap]);

  // Apply filters
  useEffect(() => {
    let temp = [...allMagazines];

    // Category filter
    if (selectedCategory) {
      temp = temp.filter(m => m.category === selectedCategory);
    }

    // Access type filter
    if (selectedAccess) {
      temp = temp.filter(m => (m.accessType || 'free') === selectedAccess);
    }

    // Price filter (only for paid items)
    temp = temp.filter(m => {
      if ((m.accessType || 'free') === 'free') return true;
      const price = m.prices?.[currency]?.discountPrice || m.prices?.[currency]?.price || m.discountPrice || m.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // Sort
    temp.sort((a, b) => {
      const priceA = a.prices?.[currency]?.discountPrice || a.prices?.[currency]?.price || a.discountPrice || a.price || 0;
      const priceB = b.prices?.[currency]?.discountPrice || b.prices?.[currency]?.price || b.discountPrice || b.price || 0;
      switch (sortOrder) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'newest':
        default: return new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0);
      }
    });

    setFilteredMagazines(temp);
    setCurrentPage(1);
  }, [selectedCategory, selectedAccess, minPrice, maxPrice, sortOrder, allMagazines, currency]);

  // Pagination
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMagazines.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMagazines, currentPage]);

  const totalPages = Math.ceil(filteredMagazines.length / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedAccess('');
    setMinPrice(actualMinPrice);
    setMaxPrice(actualMaxPrice);
    setSortOrder('newest');
  };

  const handleMinChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value <= maxPrice) setMinPrice(value);
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= minPrice) setMaxPrice(value);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-20 mt-10 mb-10">

        {/* Filters Sidebar */}
        <div className="w-full lg:w-1/4 lg:sticky lg:top-24 h-fit">
          {!loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiFilter className="w-5 h-5 text-gray-500" />
                  Filters
                </h3>
                <button onClick={handleClearFilters} className="text-sm text-red-600 hover:text-red-800">
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-base font-medium text-gray-800 mb-3">Categories</h4>
                <ul className="space-y-2">
                  {sortedCategories.map((key) => (
                    <li key={key}>
                      <button
                        onClick={() => setSelectedCategory(key)}
                        className={`w-full text-left flex justify-between items-center px-3 py-2 rounded-md transition-colors text-sm ${
                          selectedCategory === key
                            ? 'bg-red-50 text-red-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>{key === '' ? 'All Magazines' : key}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          selectedCategory === key ? 'bg-red-200' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {categoriesMap[key] || 0}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Access Type Filter */}
              <div className="mb-6">
                <h4 className="text-base font-medium text-gray-800 mb-3">Access</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: '', label: 'All' },
                    { key: 'free', label: 'Free' },
                    { key: 'paid', label: 'Paid' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedAccess(key)}
                      className={`px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
                        selectedAccess === key
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              {allMagazines.some(m => m.accessType === 'paid') && (
                <div className="mb-6">
                  <h4 className="text-base font-medium text-gray-800 mb-3">Price Range</h4>
                  <div className="flex items-center justify-between mb-2 text-sm text-gray-700 font-medium">
                    <span>{getCurrencySymbol()}{minPrice}</span>
                    <span>{getCurrencySymbol()}{maxPrice}</span>
                  </div>
                  <div className="mb-2">
                    <input id="minPriceSlider" type="range" min={actualMinPrice} max={actualMaxPrice} value={minPrice} onChange={handleMinChange} step={10} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                  </div>
                  <div>
                    <input id="maxPriceSlider" type="range" min={actualMinPrice} max={actualMaxPrice} value={maxPrice} onChange={handleMaxChange} step={10} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                    <span>Min: {getCurrencySymbol()}{actualMinPrice}</span>
                    <span>Max: {getCurrencySymbol()}{actualMaxPrice}</span>
                  </div>
                </div>
              )}

              {/* Sort */}
              <div>
                <h4 className="text-base font-medium text-gray-800 mb-3">Sort By</h4>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-96 animate-pulse"></div>
          )}
        </div>

        {/* Magazine Grid */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64"><Spinner /></div>
          ) : (
            <>
              {/* Grid - same style as ProductGrid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {currentItems.length > 0 ? (
                  currentItems.map((magazine) => {
                    const imageUrl = magazine.coverImageUrl || DEFAULT_IMAGE;
                    const isFree = (magazine.accessType || 'free') === 'free';
                    const currentPrice = magazine.prices?.[currency]?.price || magazine.price || 0;
                    const currentDiscountPrice = magazine.prices?.[currency]?.discountPrice || magazine.discountPrice || 0;
                    const displayPrice = currentDiscountPrice > 0 && currentDiscountPrice < currentPrice ? currentDiscountPrice : currentPrice;

                    return (
                      <Link
                        key={magazine._id}
                        to={`/magazine/${magazine.slug || magazine._id}`}
                        className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img src={imageUrl} alt={magazine.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 sm:p-5">
                          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">
                            {magazine.category || 'Magazine'}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
                            {magazine.title}
                          </h3>
                          {magazine.description && (
                            <div className="text-sm text-gray-600 mb-3 line-clamp-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: magazine.description }} />
                          )}
                          <div className="flex items-center justify-between">
                            {isFree ? (
                              <span className="text-xl font-bold text-green-600">Free</span>
                            ) : (
                              <span className="text-xl font-bold text-gray-900">
                                {getCurrencySymbol()}{displayPrice}
                              </span>
                            )}
                            <span className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors duration-200 opacity-0 group-hover:opacity-100">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center col-span-full py-12 text-gray-500">
                    No magazines match your current filters.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 sm:mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={handlePageChange}
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

export default MagazinePage;
