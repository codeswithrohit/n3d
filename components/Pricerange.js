"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

const Pricerange = () => {
  const router = useRouter();

  const priceRanges = [
    { id: 1, label: "UNDER", price: "249", img: "https://deodap.in/cdn/shop/files/Group_14981811.png?v=1773399085&width=300" },
    { id: 2, label: "UNDER", price: "499", img: "https://deodap.in/cdn/shop/files/Group_14981814.png?v=1773398452&width=300" },
    { id: 3, label: "UNDER", price: "999", img: "https://deodap.in/cdn/shop/files/Group_14981815.png?v=1773398488&width=300" },
    { id: 4, label: "UNDER", price: "1499", img: "https://deodap.in/cdn/shop/files/Group_14981816_a018c298-2fca-4941-8e79-9c62e7068c98.png?v=1773398513&width=300" },
    { id: 4, label: "ABOVE", price: "1999", img: "https://deodap.in/cdn/shop/files/Group_14981816_a018c298-2fca-4941-8e79-9c62e7068c98.png?v=1773398513&width=300" },
  ];

  return (
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-12 sm:py-16 font-sans">
      <h2 className="text-2xl md:text-3xl font-black text-center mb-10 md:mb-12 text-gray-900 tracking-wide">
        Explore Our Range
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {priceRanges.map((item) => (
          <div 
            key={item.id}
            // CHANGED: Pass both the label (type) and the price (amount) in the URL
            onClick={() => router.push(`/price-range?type=${item.label.toLowerCase()}&amount=${item.price}`)}
            className="cursor-pointer group flex items-center justify-center"
          >
            <img 
              src={item.img} 
              alt={`${item.label} ${item.price}`}
              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm hover:drop-shadow-md"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/300x150?text=Product+Range";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pricerange;