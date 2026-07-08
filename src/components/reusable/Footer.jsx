"use client";
import {
  FaFacebookF,
  FaWhatsapp,
  FaYoutube,
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
            <img src="/logo.jpeg" className="object-contain  rounded-md h-16 w-auto md:h-20" alt="N3D Logo" />
            <p className="text-gray-300 text-sm mt-2 leading-relaxed">
              N3D - Elevate your space with stylish, modern, and timeless decor pieces that bring comfort, beauty and personality to every corner of your home.
            </p>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-red-600 font-bold text-sm uppercase mb-3">Follow Us</h3>
            <div className="flex gap-2">
              <a target="_blank" href="https://www.facebook.com/share/1VftRib4g5/" className="bg-blue-600 text-white p-2 rounded-full hover:opacity-80 transition" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a target="_blank" href="https://chat.whatsapp.com/Jip82V7hmG6JigRAZKuWKt" className="bg-green-500 text-white p-2 rounded-full hover:opacity-80 transition" aria-label="WhatsApp">
                <FaWhatsapp />
              </a>
              <a target="_blank" href="https://youtube.com/@n3d07?si=WGyWF_gbnUaO3Xtl" className="bg-red-600 text-white p-2 rounded-full hover:opacity-80 transition" aria-label="YouTube">
                <FaYoutube />
              </a>
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
            <p className="text-red-500 font-medium pb-1">N3D</p>
            <p>Address : Moh-Dhanpurwa, PO+PS-Sasaram(Rohtas) Bihar, 821115</p>
            <p>Email : nagina3dprinter@gmail.com</p>
            <p>Phone : +91 9155242261</p>
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
              <li><a href="/aboutus" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contactus" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/termncondition" className="hover:text-white transition-colors">Terms And Conditions</a></li>
            </ul>
          </div>

          {/* Column 3 - Supplier CTA */}
          <div>
            <h3 className="text-red-600 font-bold text-sm uppercase mb-4">Partnership</h3>
            <ul className="space-y-3 text-sm">
              <li className="mb-4">
                <a
                  href="https://wa.me/919155242261"
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

      {/* Powered by Section */}
      <div className="border-t border-gray-800 py-4">
        <div className="max-w-[90rem] mx-auto px-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            Powered by 
            <a href="http://techrakshak.com" target="_blank" className="text-red-500 font-semibold hover:text-red-400 transition-colors">Tech Rakshak</a>
          </p>
        </div>
      </div>

      {/* Back To Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed right-4 bottom-6 bg-red-600 text-white px-3 py-2 rounded-md text-xs hover:bg-red-700 shadow-lg transition-colors z-50 uppercase font-bold"
      >
        ↑ Top
      </button>
    </footer>
  );
}