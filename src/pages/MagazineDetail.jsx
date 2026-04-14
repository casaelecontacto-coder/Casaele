import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../utils/api';
import Spinner from '../components/Common/Spinner';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthForm from './LogIn';

const FlipbookViewer = lazy(() => import('../components/Magazine/FlipbookViewer'));

function MagazineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCurrencySymbol, currency } = useCurrency();
  const { addToCart, isItemAdded } = useCart();
  const { currentUser } = useAuth();

  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedMagazines, setRelatedMagazines] = useState([]);
  const [added, setAdded] = useState(false);

  // Access control
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  // Login modal
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMagazine(null);
    setRelatedMagazines([]);
    setHasAccess(false);

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

  // Check access for paid magazines when user or magazine changes
  useEffect(() => {
    if (!magazine) return;
    if ((magazine.accessType || 'free') === 'free') {
      setHasAccess(true);
      return;
    }
    // Paid magazine - check if user has purchased
    if (!currentUser) {
      setHasAccess(false);
      return;
    }
    setCheckingAccess(true);
    apiGet(`/api/magazines/${magazine._id}/access`)
      .then(data => setHasAccess(data.hasAccess === true))
      .catch(() => setHasAccess(false))
      .finally(() => setCheckingAccess(false));
  }, [magazine, currentUser]);

  useEffect(() => {
    if (magazine) {
      setAdded(isItemAdded(magazine._id));
    }
  }, [magazine, isItemAdded]);

  const handleAddToCart = () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }
    addToCart({
      ...magazine,
      name: magazine.title,
      itemType: 'magazine',
      quantity: 1,
    });
    setAdded(true);
  };

  const handleReadClick = () => {
    if (!currentUser) { setShowLogin(true); return; }
    if (!isFree && !hasAccess) return;
    document.getElementById('flipbook-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadClick = () => {
    if (!currentUser) { setShowLogin(true); return; }
    if (!isFree && !hasAccess) return;
    // Open PDF
    if (pdfProxyUrl) {
      const token = localStorage.getItem('authToken');
      if (isFree) {
        window.open(pdfProxyUrl, '_blank');
      } else if (token) {
        // For paid, we need authenticated fetch
        fetch(pdfProxyUrl, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => {
            if (!res.ok) throw new Error('Access denied');
            return res.blob();
          })
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${magazine.title || 'magazine'}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          })
          .catch(() => alert('Could not download. Please ensure you have purchased this magazine.'));
      }
    }
  };

  const handleComplementaryDownload = () => {
    if (!currentUser) { setShowLogin(true); return; }
    const token = localStorage.getItem('authToken');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://amrit-project-lms.onrender.com';
    fetch(`${API_BASE}/api/magazines/${magazine._id}/material`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Access denied');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = magazine.complementaryMaterialName || 'material.zip';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Could not download complementary material.'));
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
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://amrit-project-lms.onrender.com';
  const pdfProxyUrl = magazine.pdfUrl ? `${API_BASE}/api/magazines/${magazine._id}/pdf` : null;
  const currencyPrice = magazine.prices?.[currency]?.price;
  const currencyDiscount = magazine.prices?.[currency]?.discountPrice;
  const currentPrice = (currencyPrice && currencyPrice > 0) ? currencyPrice : (magazine.price || 0);
  const currentDiscountPrice = (currencyDiscount && currencyDiscount > 0) ? currencyDiscount : (magazine.discountPrice || 0);
  const hasDiscount = currentDiscountPrice > 0 && currentDiscountPrice < currentPrice;
  const discountPercentage = hasDiscount ? Math.round(((currentPrice - currentDiscountPrice) / currentPrice) * 100) : 0;

  // Can user view content? Must be logged in. Paid also requires purchase.
  const canViewContent = currentUser ? (isFree ? true : hasAccess) : false;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-10 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto pt-10 pb-20">

        {/* Top section: Image and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">

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

            {/* Action Buttons: Donate, Subscribe, Pre-order */}
            {(magazine.donateLink || magazine.subscribeLink || magazine.preorderLink) && (
              <div className="flex flex-wrap gap-3 pt-2">
                {magazine.donateLink && (
                  <a
                    href={magazine.donateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Donate
                  </a>
                )}
                {magazine.subscribeLink && (
                  <a
                    href={magazine.subscribeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Subscribe
                  </a>
                )}
                {magazine.preorderLink && (
                  <a
                    href={magazine.preorderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Pre-order Physical Copy
                  </a>
                )}
              </div>
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

            {/* Main Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {/* Buy Button for paid magazines */}
              {!isFree && !hasAccess && (
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

              {/* Login prompt - required for all magazines */}
              {!currentUser && (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login to Read
                </button>
              )}

              {/* Read / Open / Download buttons - shown when user has access */}
              {canViewContent && pdfProxyUrl && (
                <>
                  <button
                    onClick={handleReadClick}
                    className="flex items-center justify-center gap-2 bg-[rgba(173,21,24,1)] text-white px-8 py-4 rounded-full hover:bg-red-700 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Read Magazine
                  </button>

                  <button
                    onClick={handleDownloadClick}
                    className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                </>
              )}

              {/* Complementary Material Download */}
              {magazine.complementaryMaterialUrl && currentUser && (
                <button
                  onClick={handleComplementaryDownload}
                  className="flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-full hover:bg-teal-700 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download Complementary Material
                </button>
              )}

              {magazine.complementaryMaterialUrl && !currentUser && (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-full hover:bg-teal-700 transition-colors text-lg font-semibold shadow-md w-full max-w-xs"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Login to Download Material
                </button>
              )}

              {/* Access checking state */}
              {checkingAccess && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Spinner /> Checking access...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flipbook Viewer - shown when user has access */}
        {canViewContent && pdfProxyUrl && (
          <div className="mb-16" id="flipbook-section">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Read Magazine</h3>
            <Suspense fallback={
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner />
                  <p className="text-gray-500 text-sm">Loading flipbook viewer...</p>
                </div>
              </div>
            }>
              <FlipbookViewer
                pdfUrl={isFree ? pdfProxyUrl : undefined}
                title={magazine.title}
                {...(!isFree && {
                  pdfUrl: pdfProxyUrl,
                  fetchOptions: { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
                })}
              />
            </Suspense>
          </div>
        )}

        {/* Login prompt where flipbook would be */}
        {!currentUser && pdfProxyUrl && (
          <div className="mb-16 bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Login required to read</h3>
            <p className="text-gray-500 mb-6">Please log in or create an account to read and download this magazine.</p>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-[rgba(173,21,24,1)] hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-colors shadow-md"
            >
              Login / Signup
            </button>
          </div>
        )}

        {/* About this Magazine - Description */}
        {magazine.description && (
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">About this Magazine</h3>
            <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: magazine.description }} />
          </div>
        )}

        {/* Related Magazines */}
        {relatedMagazines.length > 0 && (
          <div className="w-full">
            <h1 className="font-bold text-3xl sm:text-4xl mb-8 text-center">You might also like</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedMagazines.map((m) => {
                const mFree = (m.accessType || 'free') === 'free';
                const mCurrPrice = m.prices?.[currency]?.price;
                const mCurrDiscount = m.prices?.[currency]?.discountPrice;
                const mPrice = (mCurrDiscount && mCurrDiscount > 0) ? mCurrDiscount : ((mCurrPrice && mCurrPrice > 0) ? mCurrPrice : (m.discountPrice || m.price || 0));

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

      {/* Login Modal */}
      {showLogin && <AuthForm onClose={() => setShowLogin(false)} />}
    </div>
  );
}

export default MagazineDetail;
