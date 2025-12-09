import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import AuthForm from "../../pages/LogIn";
import { auth, onAuthStateChanged, signOut } from "../../firebase";
import { apiGet } from "../../utils/api";
import { useLanguage } from "../../context/LanguageContext"; // 1. Import Hook

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  
  // 2. Use global context instead of local state
  const { language, setLanguage, t } = useLanguage();
  
  const langDropdownRef = useRef(null);
  const { pathname } = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 3. Update links to use translation keys instead of hardcoded strings
  const links = [
    { name: t("nav.material"), path: "/material" },
    { name: t("nav.school"), path: "/school" },
    { name: t("nav.courses"), path: "/courses" },
    { name: t("nav.products"), path: "/products" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.contact"), path: "/contact" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target)
      ) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langDropdownRef]);

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

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem("authToken");
    setIsAdmin(false);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 sm:px-8 lg:px-16 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/Horizontal_1.svg"
            alt="CasaDeEle Logo"
            className="h-8 w-auto"
          />
        </Link>

        {/* Language Dropdown */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            <span>{language}</span> {/* Display context language */}
            <IoIosArrowDown
              className={`transition-transform duration-200 ${
                isLangOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isLangOpen && (
            <div className="absolute top-full mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => handleLangSelect("Spanish")}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Spanish
              </button>
              <button
                onClick={() => handleLangSelect("English")}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        {links.map((link) => (
          <Link
            key={link.path} // Use path as key since name changes with language
            to={link.path}
            className={`transition-colors ${
              pathname === link.path
                ? "text-black font-semibold"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {link.name}
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className={`transition-colors ${
              pathname.startsWith("/admin")
                ? "text-black font-semibold"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {t("nav.adminDashboard")}
          </Link>
        )}
      </nav>

      {/* Auth button / user dropdown */}
      <div className="hidden md:flex items-center">
        {!currentUser ? (
          <button
            onClick={() => setShowAuth(true)}
            className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800 text-sm"
          >
            {t("nav.loginSignup")}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
            >
              {t("nav.logout")}
            </button>
          </div>
        )}
      </div>

      {/* Hamburger Button (only for mobile) */}
      <button
        className="md:hidden text-gray-600 text-2xl z-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Navbar */}
      {isMenuOpen && (
        <div className="absolute top-0 left-0 w-full h-screen bg-white flex flex-col items-center justify-center gap-8 md:hidden z-40">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-2xl transition-colors ${
                pathname === link.path
                  ? "text-black font-semibold"
                  : "text-gray-500 hover:text-black"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`text-2xl transition-colors ${
                pathname.startsWith("/admin")
                  ? "text-black font-semibold"
                  : "text-gray-500 hover:text-black"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("nav.adminDashboard")}
            </Link>
          )}
        </div>
      )}

      {showAuth && <AuthForm onClose={() => setShowAuth(false)} />}
    </header>
  );
};

export default Header;