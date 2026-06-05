"use client";

import { useState, useEffect } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function ProductSection({
  title,
  categoryId,
  themeColor = "#ef4444", // Default to a nice red if not provided
  banner,
  categories = [],
  products = [],
  featuredProduct,
  isLoading = false,
}) {
  const [filter, setFilter] = useState("default");
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Smart Category ID Extraction
  const resolvedCategoryId = categoryId || (products?.length > 0 ? products[0].categoryId : "unknown");

  // Ensure banner.center is always an array
  const centerBanners = Array.isArray(banner?.center) ? banner.center : banner?.center ? [banner.center] : [];

  // --- AUTO SLIDE LOGIC ---
  useEffect(() => {
    if (centerBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % centerBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [centerBanners.length]);

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || a.price || 0;
    const priceB = b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || b.price || 0;
    if (filter === "price-low") return priceA - priceB;
    if (filter === "price-high") return priceB - priceA;
    if (filter === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    return 0;
  });

  const renderStars = (rating = 0, reviewCount = 0) => {
    const displayCount = reviewCount || Math.floor(Math.random() * 50) + 5; 
    return (
      <div className="flex items-center gap-1.5 mb-2 mt-1">
        <div className="flex text-[#f59e0b] text-sm">
          {[1, 2, 3, 4, 5].map((star) => (
            star <= Math.round(rating) 
              ? <FaStar key={star} /> 
              : <FaRegStar key={star} className="text-gray-300" />
          ))}
        </div>
        <span className="text-xs text-gray-500">({displayCount})</span>
      </div>
    );
  };

  // ==========================================
  // SKELETON LOADER
  // ==========================================
  if (isLoading || (!title && products.length === 0)) {
    return (
      <div className="mx-auto mt-12 max-w-[1500px] px-4 sm:px-6 lg:px-8 bg-white">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
          <div className="h-8 sm:h-10 w-48 sm:w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Banner Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="md:col-span-3 lg:col-span-4 h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-200 rounded animate-pulse"></div>
          <div className="hidden md:block md:col-span-1 h-full bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-64 h-64 bg-gray-200 rounded flex-shrink-0 animate-pulse"></div>
          <div className="flex-1 flex overflow-hidden gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-44 sm:w-48 md:w-56 flex-shrink-0 flex flex-col gap-3 border border-gray-100 rounded p-2 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN COMPONENT RENDER
  // ==========================================
  return (
    <div className="mx-auto mt-12 font-sans px-4 sm:px-6 lg:px-8 max-w-[1500px] bg-white text-black">
      
      {/* --- MODERN HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-3 gap-4 border-gray-200">
        <h2 
          className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wide flex items-center gap-3"
          style={{ color: themeColor }}
        >
          {title}
          <div className="h-2 w-2 rounded-full hidden sm:block" style={{ backgroundColor: themeColor }}></div>
        </h2>

        {/* Pill-shaped modern filters */}
        <div className="flex gap-2 text-[10px] sm:text-sm font-semibold bg-gray-50 p-1 rounded-full border border-gray-200">
          <button 
            onClick={() => setFilter("default")} 
            className={`px-4 py-1.5 rounded-full transition-colors ${filter === "default" ? "bg-white shadow border border-gray-200 text-black" : "text-gray-500 hover:text-black"}`}
          >
            New
          </button>
          <button 
            onClick={() => setFilter("rating")} 
            className={`px-4 py-1.5 rounded-full transition-colors ${filter === "rating" ? "bg-white shadow border border-gray-200 text-black" : "text-gray-500 hover:text-black"}`}
          >
            Top Rated
          </button>
          <button 
            onClick={() => setFilter("price-low")} 
            className={`px-4 py-1.5 rounded-full transition-colors ${filter === "price-low" ? "bg-white shadow border border-gray-200 text-black" : "text-gray-500 hover:text-black"}`}
          >
            Price
          </button>
        </div>
      </div>

      {/* --- BANNER & FEATURED PRODUCT --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 mt-6 gap-4 sm:gap-6 items-stretch">
        
        {/* Center Slider */}
        <div className="md:col-span-3 lg:col-span-4 h-full relative rounded overflow-hidden border border-gray-200 group">
          <div 
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {centerBanners.map((src, index) => (
              <div key={index} className="min-w-full h-full flex-shrink-0 relative">
                <img 
                  src={src} 
                  className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover" 
                  alt={`Slide ${index}`} 
                />
              </div>
            ))}
          </div>
          
          {/* Clickable Dots */}
          {centerBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/80 border border-gray-200 px-3 py-1.5 rounded-full">
              {centerBanners.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === i ? "bg-black w-6" : "bg-gray-400 w-2 hover:bg-black"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Featured Product */}
        {featuredProduct && (
          <div 
            className="md:col-span-1 hidden md:flex flex-col justify-between p-5 bg-white border border-gray-200 rounded cursor-pointer hover:border-gray-300 hover:shadow-md transition-all duration-300 group relative"
            onClick={() => router.push(`/product-detail?id=${featuredProduct.id}`)}
          >
            <div 
              className="absolute top-4 left-4 text-white text-[10px] font-black px-2.5 py-1 uppercase rounded tracking-wider z-10"
              style={{ backgroundColor: themeColor }}
            >
              Featured
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4 relative bg-[#f8f8f8] mt-2 rounded">
              <img 
                src={featuredProduct.image} 
                className="max-h-40 lg:max-h-48 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                alt={featuredProduct.title} 
              />
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{featuredProduct.title}</p>
              {renderStars(featuredProduct.rating, featuredProduct.reviewCount)}
              <div className="mt-2 flex items-end gap-2 flex-wrap">
                <span className="font-bold text-lg text-red-600">Rs. {Number(featuredProduct.price).toFixed(2)}</span>
                {featuredProduct.oldPrice > featuredProduct.price && (
                  <span className="text-[12px] text-gray-500 line-through mb-[2px]">MRP Rs. {Number(featuredProduct.oldPrice).toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SIDEBAR & HORIZONTAL PRODUCTS --- */}
      <div className="flex flex-col lg:flex-row mt-6 gap-6">
        
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0 hidden lg:block bg-white border border-gray-200 rounded p-5">
          <h3 className="font-bold mb-4 text-gray-900 text-sm tracking-wider uppercase border-b border-gray-100 pb-3">Explore More</h3>
          <ul className="space-y-1">
            {categories.map((cat, idx) => {
              const subcatId = cat.id || cat;
              const subcatName = cat.name || cat;
              
              return (
                <li 
                  key={idx} 
                  onClick={() => {
                    const url = `/subactegory?categoryId=${resolvedCategoryId}&subcategoryId=${subcatId}&categoryName=${encodeURIComponent(title)}&subcategoryName=${encodeURIComponent(subcatName)}`;
                    router.push(url);
                  }} 
                  className="cursor-pointer group flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 hover:text-red-600 transition-colors"
                >
                  <span className="text-[14px] text-gray-700 group-hover:text-red-600 transition-colors">
                    {subcatName}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Product Scroll */}
        <div className="flex-1 flex overflow-x-auto flex-nowrap gap-4 sm:gap-6 pb-6 pt-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sortedProducts.map((item) => {
            const price = Number(item.variants?.[0]?.offerPrice || item.variants?.[0]?.price || item.price || 0);
            const oldPrice = Number(item.variants?.[0]?.price || item.originalPrice || 0);
            const image = item.images?.[0] || "/placeholder.png";
            const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/product-detail?id=${item.id}`)}
                className="group w-44 sm:w-48 md:w-56 flex-shrink-0 snap-start flex flex-col cursor-pointer border border-gray-200 hover:border-gray-300 rounded overflow-hidden bg-white transition-all"
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-[#f8f8f8] p-4 flex items-center justify-center">
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm tracking-wider">
                      {discount}% OFF
                    </div>
                  )}
                  <img 
                    src={image} 
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                    alt={item.name} 
                  />
                </div>
                
                {/* Details */}
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex items-end gap-2 mb-1.5 flex-wrap">
                    <span className="text-[15px] sm:text-[16px] font-bold text-red-600">Rs. {price.toFixed(2)}</span>
                    {oldPrice > price && (
                      <span className="text-[11px] sm:text-[12px] text-gray-500 line-through mb-[2px]">MRP Rs. {oldPrice.toFixed(2)}</span>
                    )}
                  </div>
                  
                  {renderStars(item.averageRating || 0, item.reviewCount)}
                  
                  <h3 className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}