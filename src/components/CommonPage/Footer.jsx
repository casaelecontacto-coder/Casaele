import React from 'react'
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white px-6 md:px-12 lg:px-20 py-12 mt-12">
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm text-gray-600">

        {/* Left Side - Brand Info */}
        <div className="pl-2 md:pl-6 lg:pl-10">
          <h3 className="font-bold text-2xl mb-4 text-gray-800">CasaDeEle</h3>
          <p className="text-gray-600 mb-4">
            Learn Spanish with Ele, your friendly alien guide, through
            interactive rooms and engaging content.
          </p>
          <div className="text-gray-600">
            <p>
              <span className="font-semibold">Visión de:</span>
              <a href="https://www.linkedin.com/in/amrit-goyal-9980b1128/" target="_blank" rel="noopener noreferrer" className="ml-1 hover:underline">
                Amrit Goyal
              </a>
            </p>
            <p>
              {/* <span className="font-semibold">Diseño web:</span> El quipo */}
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex flex-wrap items-center gap-3 mt-6 text-gray-500">
            <a href="https://www.instagram.com/casa_de_ele/" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com/casa_de_ele/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fab fa-instagram"></i>
            </a>
            {/* X (Twitter new icon) */}
            <a href="https://x.com/AmritGoyal74560" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fa-brands fa-x-twitter"></i>
            </a>
            <a href="https://www.linkedin.com/company/casa-de-ele/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a href="https://www.youtube.com/@CasadeELE" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="https://in.pinterest.com/ELEconAmrit/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fab fa-pinterest"></i>
            </a>
            {/* Spotify added */}
            <a href="https://open.spotify.com/show/1mFJ1S3vUJ8ekIMwkNhdy4?si=5fe4e841eded4695" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 hover:bg-red-600 hover:text-white transition">
              <i className="fab fa-spotify"></i>
            </a>
          </div>
        </div>

        {/* Right Side - Explore + Learning + Support */}
        <div className="grid m-auto grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Explore */}
          <div>
            <h3 className="font-bold mb-3">Explore</h3>
            <ul className="space-y-2">
              <li><a href="/material">All Rooms</a></li>
              <li><a href="/courses">Courses</a></li>
              <li><a href="/about">About Ele</a></li>
              <li><a href="/products">Shop</a></li>
              <li><a href="#newsletter">Newsletter</a></li>
            </ul>
          </div>



          {/* Support */}
          <div>
            <h3 className="font-bold mb-3">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/">How to use</Link></li>
              <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar (Full Width Border) */}
      <div className="w-full border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 pt-8 flex justify-center items-center text-sm text-gray-500 text-center">
          <p>
            © 2025 CasaDeEle. All rights reserved. Made with love for Spanish
            learners worldwide.
          </p>
        </div>
      </div>

    </footer>
  )
}

export default Footer
