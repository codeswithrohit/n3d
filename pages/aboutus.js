import React from 'react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white">
    

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center mb-16">
        <img src="/logo.webp" className="object-contain h-20 w-auto md:h-36"/>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">About Us</h1>
          <p className="text-indigo-600 mt-2 text-lg">Nagina 3D Printer & Co2 Laser Shop</p>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-2xl leading-relaxed text-gray-700">
            We are <span className="font-semibold text-gray-900">N3D</span>, Sasaram’s first dedicated hub for 3D printing, 
            creative design, and custom craftsmanship.
          </p>
        </div>

        {/* Content Cards */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* Left Card */}
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                Located in Dhanpurwa, Sasaram (Rohtas), Bihar, N3D started with a vision to bring modern 3D technology to our community.
              </p>
              <p>
                Today, we specialize in high-quality 3D printing, CO2 laser cutting, neon lights, mandala art, line art, and custom home decor.
              </p>
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">What We Do</h2>
            <ul className="space-y-5 text-gray-600">
              <li className="flex gap-4">
                <span className="text-2xl">🖨️</span>
                <span>Custom 3D Printing</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">💡</span>
                <span>Neon Lights & Signs</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">🎨</span>
                <span>Mandala & Line Art</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">✂️</span>
                <span>CO2 Laser Cutting</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl">🏡</span>
                <span>Personalized Home Decor</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Location & Contact Box */}
        <div className="mt-16 bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-12 text-center">
          <h3 className="text-2xl font-semibold mb-8">Visit Our Workshop</h3>
          
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <p className="text-indigo-400 text-sm uppercase tracking-widest">Address</p>
              <p className="mt-2 text-lg">
                Moh-Dhanpurwa, PO + PS - Sasaram (Rohtas)<br />
                Bihar - 821115
              </p>
            </div>
            
            <div className="pt-6 border-t border-white/20">
              <p className="text-indigo-400 text-sm uppercase tracking-widest">Contact</p>
              <p className="mt-2 text-xl font-medium">+91 91552 42261</p>
              <p className="text-sm text-gray-400 mt-1">nagina3dprinter@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Closing Message */}
        <div className="text-center mt-20">
          <p className="text-gray-500 italic">
            "Bringing creativity and technology together from the heart of Sasaram"
          </p>
          <p className="mt-6 text-sm font-medium text-gray-400">— Team N3D</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;