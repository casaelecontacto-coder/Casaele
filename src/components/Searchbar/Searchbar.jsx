import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiGet } from "../../utils/api";

function Searchbar({ onSearch, activeButton }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState({
    room: "Room/Category",
    subcategory: "Sub Category",
    theme: "Theme/Genre",
    level: "Level",
    country: "Country",
  });
  const [searchText, setSearchText] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    subCategories: [],
    themes: [],
    levels: [],
    countries: []
  });
  const location = useLocation();

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await apiGet('/api/materials/filter-options');
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // New useEffect hook to handle navigation state
  useEffect(() => {
    if (location.state && location.state.keyword) {
      setSearchText(location.state.keyword);
    }
  }, [location.state]);

  
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleSelect = (menuKey, value) => {
    setSelectedMenu((prev) => ({ ...prev, [menuKey]: value }));
    setOpenMenu(null);
  };

  const handleSearch = () => {
    if (activeButton === "Explore") {
      // In Explore mode, pass filter object with selected values
      const filters = {
        category: selectedMenu.room !== "Room/Category" ? selectedMenu.room : null,
        subCategory: selectedMenu.subcategory !== "Sub Category" ? selectedMenu.subcategory : null,
        theme: selectedMenu.theme !== "Theme/Genre" ? selectedMenu.theme : null,
        level: selectedMenu.level !== "Level" ? selectedMenu.level : null,
        country: selectedMenu.country !== "Country" ? selectedMenu.country : null,
        keyword: searchText.trim() || null
      };
      
      // Remove null values to clean up the filter object
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== null && value !== "")
      );
      
      onSearch(cleanFilters);
    } else {
      // In Keyword mode, only search if there's actual text
      const keyword = searchText.trim();
      if (keyword) {
        onSearch({ keyword });
      } else {
        // If no keyword, don't search (or show message)
        console.log("No keyword provided for search");
        return;
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Dynamic dropdown options from API
  const getDropdownItems = (type) => {
    switch (type) {
      case 'room':
        return filterOptions.categories || [];
      case 'subcategory':
        return filterOptions.subCategories || [];
      case 'theme':
        return filterOptions.themes || [];
      case 'level':
        return filterOptions.levels || [];
      case 'country':
        return filterOptions.countries || [];
      default:
        return [];
    }
  };

  const renderMenuItem = (menuKey, children = null, isLast = false) => (
    <div className="relative h-full flex items-center group">
      <div
        onClick={() => toggleMenu(menuKey)}
        className="h-full px-4 flex items-center text-gray-600 font-medium cursor-pointer relative hover:bg-white hover:shadow-md transition-all duration-150 z-10"
      >
        {selectedMenu[menuKey]}
      </div>
      {!isLast && (
        <span className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-[1px] bg-gray-400 group-hover:hidden z-0"></span>
      )}
      {openMenu === menuKey && children}
    </div>
  );

  // ✅ MobileSearch with dropdowns like desktop, screen ke andar
  const MobileSearch = () => (
    <div className="flex flex-col w-full bg-gray-200 rounded-3xl shadow-md p-3 space-y-3 relative">
      {activeButton === "Explore" && (
        <>
          {/* Room */}
          <div className="relative w-full">
            <div
              onClick={() => toggleMenu("room")}
              className="w-full bg-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              {selectedMenu.room}
            </div>
            {openMenu === "room" && (
              <div className="absolute left-0 top-12 w-full max-h-60 overflow-auto bg-white shadow-lg rounded-lg z-30 p-2">
                {["Music", "Videos", "Podcast", "Resources/Chapters",
                  "Spanish for corporate", "Spanish for health professionals",
                  "Spanish for IB students"].map(item => (
                    <div
                      key={item}
                      className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelect("room", item)}
                    >
                      {item}
                    </div>
                  ))}
              </div>
            )}
          </div>
          {/* Subcategory */}
          <div className="relative w-full">
            <div
              onClick={() => toggleMenu("subcategory")}
              className="w-full bg-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              {selectedMenu.subcategory}
            </div>
            {openMenu === "subcategory" && (
              <div className="absolute left-0 top-12 w-full max-h-60 overflow-auto bg-white shadow-lg rounded-lg z-30 p-2">
                {["Active learning", "For leisure", "Short movies", "Long movies", "Reels / Shorts"].map(item => (
                  <div
                    key={item}
                    className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect("subcategory", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Theme */}
          <div className="relative w-full">
            <div
              onClick={() => toggleMenu("theme")}
              className="w-full bg-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              {selectedMenu.theme}
            </div>
            {openMenu === "theme" && (
              <div className="absolute left-0 top-12 w-full max-h-60 overflow-auto bg-white shadow-lg rounded-lg z-30 p-2">
                {["Type 1", "Type 2", "Type 3", "Type 4"].map(item => (
                  <div
                    key={item}
                    className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect("theme", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Level */}
          <div className="relative w-full">
            <div
              onClick={() => toggleMenu("level")}
              className="w-full bg-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              {selectedMenu.level}
            </div>
            {openMenu === "level" && (
              <div className="absolute left-0 top-12 w-full max-h-60 overflow-auto bg-white shadow-lg rounded-lg z-30 p-4 grid grid-cols-3 gap-3">
                {getDropdownItems('level').map((level, index) => (
                  <div
                    key={index}
                    className="w-full text-center py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect("level", level)}
                  >
                    {level}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Country */}
          <div className="relative w-full">
            <div
              onClick={() => toggleMenu("country")}
              className="w-full bg-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              {selectedMenu.country}
            </div>
            {openMenu === "country" && (
              <div className="absolute left-0 top-12 w-full max-h-60 overflow-auto bg-white shadow-lg rounded-lg z-30 p-2">
                {getDropdownItems('country').map((country, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect("country", country)}
                  >
                    {country}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Keyword input */}
      {activeButton === "Keyword" && (
        <input
          type="text"
          placeholder="Search by keyword..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full rounded-lg p-2 outline-none"
        />
      )}

      {/* Search button */}
      <button
        className="bg-red-700 text-white rounded-xl p-2 w-full"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  );

  return (
    <div className="flex justify-center mt-10 w-full">
      {/* Desktop: hidden on small screens */}
      <div className="hidden sm:flex items-center bg-gray-200 rounded-3xl shadow-md w-[930px] h-14 px-4">
        {activeButton === "Explore" ? (
          <>
            {renderMenuItem(
              "room",
              <div className="absolute top-20 left-0 w-64 bg-white shadow-lg rounded-xl p-4 z-20">
                {getDropdownItems('room').map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-100"
                    onClick={() => handleSelect("room", category)}
                  >
                    <span className="text-gray-700 font-medium">{category}</span>
                  </div>
                ))}
              </div>
            )}
            {renderMenuItem(
              "subcategory",
              <div className="absolute top-20 left-0 w-64 bg-white shadow-lg rounded-xl p-4 z-20">
                {getDropdownItems('subcategory').map((item, index) => (
                  <div
                    key={index}
                    className="cursor-pointer hover:bg-gray-100 p-2"
                    onClick={() => handleSelect("subcategory", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
            {renderMenuItem(
              "theme",
              <div className="absolute top-20 left-0 w-40 bg-white shadow-lg rounded-xl p-4 z-20">
                {getDropdownItems('theme').map((item, index) => (
                  <div
                    key={index}
                    className="cursor-pointer hover:bg-gray-100 p-2"
                    onClick={() => handleSelect("theme", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
            {renderMenuItem(
              "level",
              <div className="absolute grid-cols-2 gap-3 justify-center grid top-20 left-0 w-[166px] bg-white shadow-lg rounded-xl h-[189px] px-7 py-4 z-20">
                {getDropdownItems('level').map((level, index) => (
                  <img
                    key={index}
                    src={`/Searchbar/${level}.svg`}
                    alt={level}
                    className="w-8 h-8 cursor-pointer"
                    onClick={() => handleSelect("level", level)}
                  />
                ))}
              </div>
            )}
            {renderMenuItem(
              "country",
              <div className="absolute top-20 left-0 w-[230px] bg-white shadow-lg rounded-xl p-4 z-20">
                {getDropdownItems('country').map((country, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 rounded-md px-3 py-2"
                    onClick={() => handleSelect("country", country)}
                  >
                    <span className="text-gray-700">{country}</span>
                  </div>
                ))}
              </div>,
              true
            )}
          </>
        ) : (
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full bg-transparent outline-none px-2"
          />
        )}
        <div className="ml-auto flex items-center">
          <button className="p-3" onClick={handleSearch}>
            <img src="/Searchbar/Button.svg" alt="search" />
          </button>
        </div>
      </div>
      {/* Mobile: visible only on small screens */}
      <div className="sm:hidden w-full px-4">
        <MobileSearch />
      </div>
    </div>
  );
}

export default Searchbar;