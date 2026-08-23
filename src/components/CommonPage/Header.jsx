import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaShoppingCart } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import AuthForm from "../../pages/LogIn";
import { auth, onAuthStateChanged, signOut } from "../../firebase";
import { apiGet } from "../../utils/api";
import { useLanguage } from "../../context/LanguageContext"; // 1. Import Hook
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // 2. Use global context instead of local state
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const { currency, setCurrency, currencyConfig } = useCurrency();

  const langDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const { pathname } = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 3. Update links to use translation keys instead of hardcoded strings
  // `static: true` marks routes served as plain static HTML (via a Vercel
  // rewrite) rather than by a React Router route. Those must use a real <a>
  // tag so the browser does a full navigation instead of a client-side
  // transition, which would bypass the rewrite entirely.
  const links = [
    { name: t("nav.material"), path: "/material", static: true },
    { name: t("nav.school"), path: "/school" },
    { name: t("nav.courses"), path: "/courses" },
    { name: t("nav.products"), path: "/products", static: true },
    { name: t("nav.magazine"), path: "/magazine" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.contact"), path: "/contact" },
    { name: "DELE Course", path: "/dele-course", static: true },
    { name: "Library", path: "/library", static: true },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target)
      ) {
        setIsLangOpen(false);
      }
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target)
      ) {
        setIsCurrencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langDropdownRef, currencyDropdownRef]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u || null);
      if (u) {
        const token = localStorage.getItem("authToken");
        if (token) {
          try {
            await apiGet("/api/admins/check-status");
            setIsAdmin(true);
          } catch (error) {
            setIsAdmin(false);
            localStorage.removeItem("authToken");
          }
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        localStorage.removeItem("authToken");
      }
    });
    return () => unsub();
  }, []);

  const handleLangSelect = (lang) => {
    setLanguage(lang); // 4. Update global context
    setIsLangOpen(false);
  };

  const handleCurrencySelect = (curr) => {
    setCurrency(curr);
    setIsCurrencyOpen(false);
  };

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem("authToken");
    setIsAdmin(false);
  };

  // Shared classes so the nav's look matches the static pages' own header
  // (Home / Material / Products / DELE Course / Library) -- same cream
  // sticky bar, ink text, red hover-lift, pill CTA.
  const navLinkClass = (active) =>
    `font-body transition-all duration-200 ease-out hover:-translate-y-0.5 hover:-rotate-1 hover:text-casa-red ${
      active ? "text-casa-red font-bold" : "text-casa-ink"
    }`;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 sm:px-8 lg:px-16 py-4 bg-casa-cream/90 backdrop-blur-md border-b border-black/10 font-body">
      <div className="flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/Horizontal_1.svg"
            alt="CasaDeEle Logo"
            className="h-8 w-auto"
          />
        </a>

        {/* Language Dropdown */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-casa-ink/60 hover:text-casa-red transition-colors"
          >
            <span>{language}</span> {/* Display context language */}
            <IoIosArrowDown
              className={`transition-transform duration-200 ${
                isLangOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isLangOpen && (
            <div className="absolute top-full mt-2 w-36 bg-casa-creamLight rounded-xl shadow-lg border border-black/10 py-1 z-10">
              <button
                onClick={() => handleLangSelect("Spanish")}
                className="block w-full text-left px-4 py-2 text-sm text-casa-ink hover:bg-casa-red/10 hover:text-casa-red"
              >
                Spanish
              </button>
              <button
                onClick={() => handleLangSelect("English")}
                className="block w-full text-left px-4 py-2 text-sm text-casa-ink hover:bg-casa-red/10 hover:text-casa-red"
              >
                English
              </button>
            </div>
          )}
        </div>

        {/* Currency Dropdown */}
        <div className="relative" ref={currencyDropdownRef}>
          <button
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-casa-ink/60 hover:text-casa-red transition-colors"
          >
            <span>{currencyConfig[currency]?.symbol} {currency}</span>
            <IoIosArrowDown
              className={`transition-transform duration-200 ${
                isCurrencyOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isCurrencyOpen && (
            <div className="absolute top-full mt-2 w-36 bg-casa-creamLight rounded-xl shadow-lg border border-black/10 py-1 z-10">
              <button
                onClick={() => handleCurrencySelect("USD")}
                className="block w-full text-left px-4 py-2 text-sm text-casa-ink hover:bg-casa-red/10 hover:text-casa-red"
              >
                $ USD
              </button>
              <button
                onClick={() => handleCurrencySelect("EUR")}
                className="block w-full text-left px-4 py-2 text-sm text-casa-ink hover:bg-casa-red/10 hover:text-casa-red"
              >
                € EUR
              </button>
              <button
                onClick={() => handleCurrencySelect("INR")}
                className="block w-full text-left px-4 py-2 text-sm text-casa-ink hover:bg-casa-red/10 hover:text-casa-red"
              >
                ₹ INR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        {links.map((link) =>
          link.static ? (
            <a
              key={link.path}
              href={link.path}
              className={navLinkClass(pathname === link.path)}
            >
              {link.name}
            </a>
          ) : (
            <Link
              key={link.path} // Use path as key since name changes with language
              to={link.path}
              className={navLinkClass(pathname === link.path)}
            >
              {link.name}
            </Link>
          )
        )}

        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className={navLinkClass(pathname.startsWith("/admin"))}
          >
            {t("nav.adminDashboard")}
          </Link>
        )}
      </nav>

      {/* Cart and Auth section */}
      <div className="hidden md:flex items-center gap-4">
        {/* Cart Icon with Badge */}
        <Link to="/cart-checkout" className="relative">
          <FaShoppingCart className="text-2xl text-casa-ink hover:text-casa-red transition-colors" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-casa-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>

        {/* Auth button / user dropdown */}
        {!currentUser ? (
          <button
            onClick={() => setShowAuth(true)}
            className="px-5 py-2.5 rounded-full bg-casa-red text-white font-bold text-sm shadow-[0_3px_0_#6f1216] transition-all duration-200 hover:bg-casa-redDark hover:translate-y-px hover:shadow-[0_2px_0_#6f1216]"
          >
            {t("nav.loginSignup")}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-casa-ink/80">
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-casa-ink/5 hover:bg-casa-ink/10 text-casa-ink text-sm font-medium transition-colors"
            >
              {t("nav.logout")}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Cart and Hamburger */}
      <div className="md:hidden flex items-center gap-4 z-50">
        {/* Cart Icon for Mobile Header */}
        <Link to="/cart-checkout" className="relative">
          <FaShoppingCart className="text-xl text-casa-ink" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-casa-red text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>

        {/* Hamburger Button */}
        <button
          className="text-casa-ink text-2xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navbar */}
      {isMenuOpen && (
        <div className="absolute top-0 left-0 w-full h-screen bg-casa-cream flex flex-col items-center justify-center gap-8 md:hidden z-40 font-body">
          {links.map((link) =>
            link.static ? (
              <a
                key={link.path}
                href={link.path}
                className={`text-2xl ${navLinkClass(pathname === link.path)}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={`text-2xl ${navLinkClass(pathname === link.path)}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            )
          )}

          {/* Cart Link for Mobile */}
          <Link
            to="/cart-checkout"
            className={`text-2xl flex items-center gap-2 ${navLinkClass(
              pathname === "/cart-checkout"
            )}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <FaShoppingCart />
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="bg-casa-red text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`text-2xl ${navLinkClass(
                pathname.startsWith("/admin")
              )}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("nav.adminDashboard")}
            </Link>
          )}

          {!currentUser ? (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setShowAuth(true);
              }}
              className="px-6 py-3 rounded-full bg-casa-red text-white font-bold shadow-[0_3px_0_#6f1216]"
            >
              {t("nav.loginSignup")}
            </button>
          ) : (
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="px-6 py-3 rounded-full bg-casa-ink/5 text-casa-ink font-medium"
            >
              {t("nav.logout")}
            </button>
          )}
        </div>
      )}

      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </header>
  );
};

export default Header;
