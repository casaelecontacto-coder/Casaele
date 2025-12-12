import React, { useState, useEffect, useContext, useRef } from "react";
import { HomePageContext } from "../../context/HomePageContext";
import { useApiCache } from "../../context/ApiCacheContext";

function PicksSection() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const homePageContext = useContext(HomePageContext);
  const { fetchCached, getCached } = useApiCache();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current) {
      return;
    }

    // Try to use context data first (for Home page optimization)
    if (homePageContext?.homeData?.picks) {
      setPicks(homePageContext.homeData.picks || []);
      setLoading(false);
      fetchedRef.current = true;
      return;
    }

    // Use cached fetch to prevent duplicates
    const fetchPicks = async () => {
      fetchedRef.current = true;
      try {
        // Check cache first
        const cached = getCached('/api/picks');
        if (cached && cached.data) {
          setPicks(cached.data || []);
          setLoading(false);
          return;
        }

        // Fetch using cache
        const result = await fetchCached('/api/picks');
        if (result.data) {
          setPicks(result.data || []);
        } else {
          setPicks([]);
        }
      } catch (error) {
        console.error('Error fetching picks:', error);
        setPicks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPicks();
  }, [homePageContext, fetchCached, getCached]);

  const handleButtonClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };
  return (
    <div className="text-center bg-[#FDF2F2] py-12">
      {/* Top Small Image */}
      <div className="flex justify-center mb-6">
        <img
          src="/Home/Group 2.svg"
          alt="Ele's Picks Banner"
          className="w-12 sm:w-14 md:w-16 lg:w-20 h-auto mx-auto"
        />
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-semibold mb-10 px-4">
        Ele's picks of the month
      </h1>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 px-4">
        {loading ? (
          <div className="flex justify-center items-center w-full py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : picks.length > 0 ? (
          picks.map((pick, i) => (
            <div
              key={pick._id}
              className="bg-white rounded-lg shadow-lg flex flex-col w-full sm:w-[45%] md:w-[30%] max-w-xs"
            >
              <img
                src={pick.imageUrl}
                alt={pick.title}
                className="w-full object-cover rounded-t-lg mb-4 h-48"
              />
              <div className="px-4 pb-6 flex flex-col flex-1">
                <h2 className="text-2xl font-semibold text-left mb-2">
                  {pick.title}
                </h2>
                <p className="text-black font-light text-base mb-6 text-left">
                  {pick.description}
                </p>
                <button
                  onClick={() => handleButtonClick(pick.externalLink)}
                  className="bg-[rgba(173,21,24,1)] hover:bg-red-700 text-white py-2 px-6 rounded-full w-full transition text-xl mt-auto">
                  Try It!
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-lg py-12">
            No picks available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}

export default PicksSection;
