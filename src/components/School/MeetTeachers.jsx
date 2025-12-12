import React, { useState, useEffect, useContext, useRef } from "react";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import { HomePageContext } from "../../context/HomePageContext";
import { useApiCache } from "../../context/ApiCacheContext";

const MeetTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const homePageContext = useContext(HomePageContext);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(4);

  const descriptionCharLimit = 100;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerRow(4);
      else if (width >= 768) setItemsPerRow(2);
      else setItemsPerRow(1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { fetchCached, getCached, clearCache } = useApiCache();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) {
      return;
    }

    const fetchTeachers = async () => {
      // Try to use context data first (for Home page optimization)
      if (homePageContext?.homeData?.teachers) {
        setTeachers(Array.isArray(homePageContext.homeData.teachers) ? homePageContext.homeData.teachers : []);
        setLoading(false);
        fetchedRef.current = true;
        return;
      }

      // Use cached fetch to prevent duplicates
      fetchedRef.current = true;
      setLoading(true);
      
      try {
        // Check cache first
        const cached = getCached('/api/teachers');
        if (cached && cached.data) {
          setTeachers(Array.isArray(cached.data) ? cached.data : []);
          setLoading(false);
          return;
        }

        // Fetch using cache
        const result = await fetchCached('/api/teachers');
        if (result.data) {
          setTeachers(Array.isArray(result.data) ? result.data : []);
        } else {
          setTeachers([]);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();

    // Listen for teacher updates (when admin adds/updates teachers)
    const reload = () => {
      // Clear cache and reload
      clearCache('/api/teachers');
      fetchedRef.current = false;
      fetchTeachers();
    };
    window.addEventListener('teachers:updated', reload);
    return () => window.removeEventListener('teachers:updated', reload);
  }, [homePageContext, fetchCached, getCached, clearCache])

  const prev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? teachers.length - itemsPerRow : prevIndex - 1
    );
  };

  const next = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex >= teachers.length - itemsPerRow ? 0 : prevIndex + 1
    );
  };

  const visibleTeachers = (teachers || []).slice(
    currentIndex,
    currentIndex + itemsPerRow
  );

  const truncateDescription = (text) => {
    if (!text) return '';
    return text.length > descriptionCharLimit 
      ? text.substring(0, descriptionCharLimit).trim() + '...' 
      : text;
  };

  return (
    <div className="w-full bg-[#FDF2F2] mb-16 py-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="font-bold text-4xl sm:text-5xl text-gray-800 mb-20">
          Meet Our Teachers
        </h1>

        <div className="relative flex items-center justify-center px-6 sm:px-24">
          {/* Left Arrow */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border border-gray-400 rounded-full p-3 shadow-sm hover:bg-white/50 transition-colors z-10"
            aria-label="Previous Teachers"
          >
            <GoArrowLeft className="text-gray-500 text-2xl" />
          </button>

          {/* Teachers Row */}
          <div className="flex gap-4 md:gap-6 w-full justify-center overflow-hidden">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : visibleTeachers.map((teacher, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center px-2"
                style={{
                  flex:
                    itemsPerRow === 1
                      ? "0 0 100%"
                      : `0 0 ${100 / itemsPerRow}%`,
                }}
              >
                <img
                  src={teacher.photoUrl}
                  alt={teacher.name}
                  className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full mb-6 object-cover shadow-md"
                />
                <div className="w-2/3 border-t border-gray-300 mb-6"></div>
                <h2 className="font-semibold text-xl sm:text-2xl text-gray-800">
                  {teacher.name}
                </h2>
                <p className="text-sm sm:text-base text-gray-500 mt-3 px-2">
                  {truncateDescription(teacher.description)}
                  {teacher.description && teacher.description.length > descriptionCharLimit && (
                    <button
                      onClick={() => setSelectedTeacher(teacher)}
                      className="text-blue-600 hover:text-blue-800 ml-1 font-semibold cursor-pointer"
                    >
                      more
                    </button>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border border-gray-400 rounded-full p-3 shadow-sm hover:bg-white/50 transition-colors z-10"
            aria-label="Next Teachers"
          >
            <GoArrowRight className="text-gray-500 text-2xl" />
          </button>
        </div>
      </div>

      {selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Teacher Information</h2>
              <button onClick={() => setSelectedTeacher(null)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedTeacher.photoUrl}
                  alt={selectedTeacher.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800">{selectedTeacher.name}</h3>
                  {selectedTeacher.email && <p className="text-sm text-gray-600">{selectedTeacher.email}</p>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">About</p>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">{selectedTeacher.description}</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-2">
              <button onClick={() => setSelectedTeacher(null)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetTeachers;
