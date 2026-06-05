"use client";

import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaSnapchatGhost,
  FaWhatsapp,
  FaYoutube,
  FaApple,
  FaGooglePlay,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#0a101d] text-gray-300 font-sans w-full">
      
      {/* Main Footer Content */}
      <div className="max-w-[90rem] mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12 lg:gap-8">
        
        {/* LEFT COLUMN: Brand, Socials, Payments, Company Info */}
        <div className="w-full lg:w-[35%] flex flex-col gap-5">
          {/* Logo */}
          <div>
            <h2 className="text-3xl font-black italic text-white tracking-wider">
              N<span className="text-[#FFD700]">3D</span>
            </h2>
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>
          </div>

          {/* App Store Buttons */}
          <div className="flex flex-wrap gap-3 mt-2">
            <button className="flex items-center gap-2 bg-black border border-gray-600 rounded-md px-3 py-1.5 hover:border-gray-400 transition-colors">
              <FaGooglePlay className="text-xl text-green-400" />
              <div className="text-left">
                <div className="text-[10px] leading-none text-gray-400">ANDROID APP ON</div>
                <div className="text-sm font-bold leading-none text-white">Google play</div>
              </div>
            </button>
            <button className="flex items-center gap-2 bg-black border border-gray-600 rounded-md px-3 py-1.5 hover:border-gray-400 transition-colors">
              <FaApple className="text-2xl text-white" />
              <div className="text-left">
                <div className="text-[10px] leading-none text-gray-400">Download on the</div>
                <div className="text-sm font-bold leading-none text-white">App Store</div>
              </div>
            </button>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-red-600 font-bold text-sm uppercase mb-3">Follow Us</h3>
            <div className="flex gap-2">
              <a href="#" className="bg-blue-600 text-white p-2 rounded-full hover:opacity-80 transition"><FaFacebookF /></a>
              <a href="#" className="bg-cyan-500 text-white p-2 rounded-full hover:opacity-80 transition"><FaTwitter /></a>
              <a href="#" className="bg-yellow-400 text-white p-2 rounded-full hover:opacity-80 transition"><FaSnapchatGhost /></a>
              <a href="#" className="bg-green-500 text-white p-2 rounded-full hover:opacity-80 transition"><FaWhatsapp /></a>
              <a href="#" className="bg-red-600 text-white p-2 rounded-full hover:opacity-80 transition"><FaYoutube /></a>
            </div>
          </div>

          {/* Payment Icons */}
          <div className="flex gap-2 bg-white/5 p-2 rounded-md w-max">
             <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6 w-auto" />
             <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6 w-auto" />
             <img src="https://img.icons8.com/color/48/maestro.png" alt="Maestro" className="h-6 w-auto" />
             <img src="https://img.icons8.com/color/48/apple-pay.png" alt="Apple Pay" className="h-6 w-auto bg-white rounded" />
             <img src="https://img.icons8.com/color/48/google-pay.png" alt="Google Pay" className="h-6 w-auto bg-white rounded" />
          </div>

          {/* Grey Company Info Box */}
          <div className="bg-[#1f2532] p-4 rounded-md mt-2 text-xs text-gray-400 space-y-1">
            <p className="text-red-500 font-medium pb-1">N3D International Private Limited</p>
            <p>Address : My Company, 42 avenue des Champs</p>
            <p>Email : sales@yourcompany.com</p>
            <p>Phone : 0123456789</p>
          </div>
          
          <p className="text-xs text-gray-500">
            Copyright © {new Date().getFullYear()} N3D. All Rights Reserved.
          </p>
        </div>

        {/* RIGHT COLUMNS: Links Area */}
        <div className="w-full lg:w-[65%] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          
          {/* Column 1 */}
          <div>
            <h3 className="text-red-600 font-bold text-sm uppercase mb-4">Information</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms And Conditions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing Tables</a></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-red-600 font-bold text-sm uppercase mb-4">My Account</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Brands</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Gift Certificates</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Affiliates</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Specials</a></li>
            </ul>
          </div>

          {/* Column 3 - Supplier CTA */}
          <div>
            <h3 className="text-red-600 font-bold text-sm uppercase mb-4">Partnership</h3>
            <ul className="space-y-3 text-sm">
              <li className="mb-4">
                <a
                  href="https://wa.me/917667411501" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 transition-colors uppercase text-xs tracking-wider"
                >
                  <FaWhatsapp className="text-lg" />
                  Become a Supplier
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* BOTTOM ROW: Trust Badges (Matching Screenshot Style) */}
      <div className="border-t border-gray-800 bg-[#0a101d] py-6">
        <div className="max-w-[90rem] mx-auto px-4 flex flex-wrap justify-between items-center gap-6">
          
          {/* Placeholder for trusted seller badge */}
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">100%</div>
             <div className="text-yellow-500 font-bold leading-tight">
               TRUST<br/>SEAL
             </div>
          </div>

          {/* Trust Badges via Image URLs */}
          <img src="https://utils.imimg.com/header/logo-2.0.svg" alt="IndiaMart" className="h-8 brightness-0 invert opacity-80" />
          
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-2xl">✔</span>
            <div className="text-green-500 font-bold uppercase leading-tight">Trusted<br/>Seller</div>
          </div>

          <div className="flex flex-col items-center">
             <span className="text-gray-400 font-bold text-lg">Google</span>
             <div className="text-yellow-400 text-xs">★★★★★</div>
          </div>

          <div className="flex flex-col items-center">
             <span className="text-blue-400 font-bold text-lg">mouthshut<span className="text-white">.com</span></span>
             <div className="text-yellow-400 text-xs">★★★★★</div>
          </div>

          <div className="flex flex-col items-center">
             <span className="text-white font-bold text-xl">amazon</span>
             <div className="text-yellow-400 text-xs">★★★★★</div>
          </div>

        </div>
      </div>

      {/* Back To Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed right-4 bottom-6 bg-red-600 text-white px-3 py-2 rounded-md text-xs hover:bg-red-700 shadow-lg transition-colors z-50 uppercase font-bold"
      >
        ↑ Top
      </button>

    </footer>
  );
}