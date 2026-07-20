import React from 'react';

const Gstinvoice = () => {
  // Updated Data Arrays with live image URLs
  const socialMetrics = [
    { id: 1, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg', metric: '90,00,000+', label: 'Downloads', borderColor: 'border-black' },
    { id: 2, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', metric: '1,59,309+', label: 'Subscribers', borderColor: 'border-red-500' },
    { id: 3, imgUrl: 'https://deodap.in/cdn/shop/files/Frame_43.png?v=1714374638', metric: '1,11,000', label: 'Followers', borderColor: 'border-yellow-400' },
    { id: 4, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg', metric: '117,900', label: 'Followers', borderColor: 'border-blue-500' },
    { id: 5, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg', metric: '18,812+', label: 'Followers', borderColor: 'border-blue-400' },
    { id: 6, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg', metric: '72,000+', label: 'Followers', borderColor: 'border-green-500' },
  ];

  const marketplaces = [
    { id: 1, name: 'Amazon', imgUrl: 'https://deodap.in/cdn/shop/files/e57ef7499fee378aff0b2032b5e5db25-optimized.webp?v=1746164723', borderColor: 'border-orange-400' },
    { id: 2, name: 'Flipkart', imgUrl: 'https://deodap.in/cdn/shop/files/flipkart_1.svg?v=1712740557', borderColor: 'border-blue-500' },
    { id: 3, name: 'Meesho', imgUrl: 'https://deodap.in/cdn/shop/files/Vector_2.svg?v=1712740595', borderColor: 'border-pink-500' },
    { id: 4, name: 'TradeIndia', imgUrl: 'https://deodap.in/cdn/shop/files/Group_46.svg?v=1712740587', borderColor: 'border-red-600' },
    { id: 5, name: 'IndiaMart', imgUrl: 'https://deodap.in/cdn/shop/files/IndiaMart.webp?v=1744346342', borderColor: 'border-indigo-800' },
    { id: 6, name: 'Justdial', imgUrl: 'https://deodap.in/cdn/shop/files/justdial-seeklogo_1.svg?v=1764768137', borderColor: 'border-blue-600' },
  ];

  return (
    <div className="w-full font-sans bg-gray-50 flex flex-col">
      
      {/* --- SECTION 1: GST Banner --- */}
      <section className="bg-blue-800 text-white py-16 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-wide">
          GST Invoice & Bulk Discounts
        </h1>
        {/* Subtle divider line */}
        <div className="h-px w-full max-w-3xl bg-white/30 my-4"></div>
        <p className="text-lg md:text-xl max-w-4xl text-gray-100">
          Save up to 18% more with GST input credit and avail discounts on multi-unit purchases.
        </p>
      </section>

      {/* --- SECTION 2: Promo Banners --- */}
      <section className="max-w-screen-2xl mx-auto w-full my-8 px-4 flex flex-col xl:flex-row gap-6">
        
        {/* Left Promo: Dropshipping Webinar */}
        <div className="flex-1 bg-gray-950 text-white rounded-lg overflow-hidden flex flex-col sm:flex-row relative">
          <img src='https://deodap.in/cdn/shop/files/Dropshipping_Webinar_1300x500px.jpg_4.jpg?v=1771928942' className='h-full w-full object-cover' alt="Dropshipping Webinar" />
        </div>

        {/* Right Promo: Wholesale Mall */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden p-6 flex flex-col sm:flex-row items-center gap-8 shadow-sm">
          <img src='https://deodap.in/cdn/shop/files/unnamed_1.png?v=1756293304' className='h-full w-full object-contain' alt="Wholesale Mall" />
        </div>

      </section>

      {/* --- SECTION 3: Socials & Marketplaces --- */}
      <section className="flex flex-col lg:flex-row justify-center items-start gap-12 p-8 bg-white font-sans max-w-screen-2xl mx-auto w-full border-t mt-8">
        
        {/* Left Section: Find us on */}
        <div className="flex-1 w-full max-w-2xl">
          <h2 className="text-xl font-bold text-center mb-8">Find us on</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {socialMetrics.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-3 bg-white rounded-full border ${item.borderColor} shadow-sm hover:shadow-md transition`}
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-full overflow-hidden shrink-0">
                  <img src={item.imgUrl} alt={item.label} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 leading-tight">{item.metric}</span>
                  <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical Divider (Visible on large screens) */}
        <div className="hidden lg:block w-px bg-gray-200 h-64 mt-12"></div>

        {/* Right Section: Also Available On */}
        <div className="flex-1 w-full max-w-2xl">
          <h2 className="text-xl font-bold text-center mb-8">Also Available On</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {marketplaces.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-center p-4 h-16 bg-white rounded-lg border ${item.borderColor} shadow-sm hover:shadow-md transition`}
              >
                <img src={item.imgUrl} alt={item.name} className="h-full max-h-8 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
};

export default Gstinvoice;