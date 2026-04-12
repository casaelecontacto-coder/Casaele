import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';

function MagazineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCurrencySymbol, currency } = useCurrency();
  const { addToCart, isItemAdded } = useCart();

  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedMagazines, setRelatedMagazines] = useState([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMagazine(null);
    setRelatedMagazines([]);

    const fetchMagazine = apiGet(`/api/magazines/${id}`);
    const fetchAll = apiGet('/api/magazines?limit=100');

    Promise.all([fetchMagazine, fetchAll])
      .then(([magazineData, allData]) => {
        setMagazine(magazineData);

        const allMagazines = allData.magazines || [];
        const related = allMagazines
          .filter(m => m._id !== magazineData._id)
          .slice(0, 4);
        setRelatedMagazines(related);
      })
      .catch((err) => {
        console.error('Failed to fetch magazine:', err);
        setMagazine(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (magazine) {
      setAdded(isItemAdded(magazine._id));
    }
  }, [magazine, isItemAdded]);

  const handleAddToCart = () => {
    addToCart({
      ...magazine,
      name: magazine.title,
      itemType: 'magazine',
      quantity: 1,
    });
    setAdded(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="text-center p-20 font-semibold text-gray-700">
        Magazine not found. It might have been removed or the link is incorrect.
      </div>
    );
  }

  const isFree = (magazine.accessType || 'free') === 'free';
  const currentPrice = magazine.prices?.[currency]?.price || magazine.price || 0;
  const currentDiscountPrice = magazine.prices?.[currency]?.discountPrice || magazine.discountPrice || 0;
  const hasDiscount = currentDiscountPrice > 0 && currentDiscountPrice < currentPrice;
  const discountPercentage = hasDiscount ? Math.round(((currentPrice - currentDiscountPrice) / currentPrice) * 100) : 0;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto pt-10 pb-20">

        {/* Top section: Image and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">

          {/* Left: Cover Image */}
          <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-gray-200 relative">
            {magazine.coverImageUrl ? (
              <img
                src={magazine.coverImageUrl}
                alt={magazine.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="w-full flex flex-col space-y-5">
            <h1 className="font-bold text-4xl lg:text-5xl">{magazine.title}</h1>

            {magazine.category && (
              <span className="inline-block w-fit px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {magazine.category}
              </span>
            )}

            {magazine.description && (
              <p className="text-lg text-gray-600 pt-1">{magazine.description}</p>
            )}

            {/* Pricing */}
            <div className="flex items-center space-x-3 pt-2">
              {isFree ? (
                <span className="font-bold text-4xl lg:text-5xl text-green-600">Free</span>
              ) : hasDiscount ? (
                <>
                  <span className="font-bold text-4xl lg:text-5xl text-black">{getCurrencySymbol()}{currentDiscountPrice}</span>
                  <span className="text-2xl text-gray-400 line-through">{getCurrencySymbol()}{currentPrice}</span>
                  <span className="bg-[#FDF2F2] text-red-600 text-sm font-semibold px-3 py-1 rounded-full">-{discountPercentage}%</span>
                </>
              ) : (
                <span className="font-bold text-4xl lg:text-5xl text-black">{getCurrencySymbol()}{currentPrice}</span>
              )}
            </div>

            {/* Date */}
            <p className="text-sm text-gray-400">
              Published: {new Date(magazine.publishedAt || magazine.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {/* Read / Open PDF Button - always visible for free, visible after purchase for paid */}
              {isFree && magazine.pdfUrl && (
                <a
                  href={magazine.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[rgba(173,21,24,1)] text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Magazine
                </a>
              )}

              {/* Buy Button for paid magazines */}
              {!isFree && (
                <button
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-semibold shadow-md w-full max-w-xs transition-colors ${
                    added
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-[rgba(173,21,24,1)] text-white hover:bg-red-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {added ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    )}
                  </svg>
                  {added ? 'Added to Cart!' : 'Buy Magazine'}
                </button>
              )}

              {/* Download PDF Button for free magazines */}
              {isFree && magazine.pdfUrl && (
                <a
                  href={magazine.pdfUrl}
                  download
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        {magazine.description && (
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">About this Magazine</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{magazine.description}</p>
          </div>
        )}

        {/* Related Magazines - same layout as LikeSection */}
        {relatedMagazines.length > 0 && (
          <div className="w-full">
            <h1 className="font-bold text-3xl sm:text-4xl mb-8 text-center">You might also like</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedMagazines.map((m) => {
                const mFree = (m.accessType || 'free') === 'free';
                const mPrice = m.prices?.[currency]?.discountPrice || m.prices?.[currency]?.price || m.discountPrice || m.price || 0;

                return (
                  <div
                    key={m._id}
                    onClick={() => navigate(`/magazine/${m.slug || m._id}`)}
                    className="cursor-pointer group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={m.coverImageUrl || "https://placehold.co/400x300/e5e7eb/4b5563?text=Magazine"}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">
                        {m.category || 'Magazine'}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-700 transition-colors mb-2">
                        {m.title}
                      </h3>
                      <span className="text-base font-bold text-gray-900">
                        {mFree ? <span className="text-green-600">Free</span> : `${getCurrencySymbol()}${mPrice}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MagazineDetail;
