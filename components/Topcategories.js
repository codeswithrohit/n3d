"use client";

import React, { useState, useEffect, useRef } from 'react';
import { firebase } from '../Firebase/config';
import { useRouter } from 'next/navigation';

const Topcategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Reference for the horizontal scrolling container
  const sliderRef = useRef(null);

  // 1. Fetch Categories (Optimized with Caching)
  useEffect(() => {
    const fetchCategories = async () => {
      // Step A: Check local cache for instant loading
      const cachedCategories = sessionStorage.getItem('cached_top_categories');
      if (cachedCategories) {
        setCategories(JSON.parse(cachedCategories));
        setLoading(false); // Instantly remove skeleton loader
      }

      try {
        const db = firebase.firestore();
        // Step B: Fetch fresh data from Firebase in the background
        const snapshot = await db.collection('n3dcategories').orderBy('createdAt', 'desc').get();
        
        const fetchedCats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Step C: Update UI and cache ONLY if the database data is different from the cache
        if (JSON.stringify(fetchedCats) !== cachedCategories) {
          setCategories(fetchedCats);
          sessionStorage.setItem('cached_top_categories', JSON.stringify(fetchedCats));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Scroll handler for Left/Right arrow buttons
  const scroll = (direction) => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      // Scroll by roughly 75% of the visible container width
      const scrollAmount = clientWidth * 0.75; 
      
      sliderRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 2. Skeleton Loader (Horizontal Sliding Style)
  if (loading) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-10 font-sans">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-wide">
            Top Categories
          </h2>
        </div>
        
        <div className="flex gap-4 sm:gap-6 overflow-x-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[140px] sm:w-[180px] md:w-[220px] flex-shrink-0 animate-pulse flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-200 dark:bg-neutral-800 rounded-2xl mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-8 font-sans relative group/section">
      
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white dark:text-white tracking-wide relative inline-block">
          Top Categories
          <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-red-600 rounded-full"></span>
        </h2>

        {/* Slider Navigation Buttons */}
        {categories.length > 3 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 shadow-md active:scale-95"
              aria-label="Scroll Left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-300 shadow-md active:scale-95"
              aria-label="Scroll Right"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Left-to-Right Horizontal Slider Container */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-1 hide-scrollbar"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none'  /* IE and Edge */
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                router.push(`/category?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`);
              }}
              className="w-[140px] sm:w-[170px] md:w-[200px] lg:w-[220px] flex-shrink-0 snap-start flex flex-col items-center group cursor-pointer"
            >
              {/* Image Card Container */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#e0f2fe] dark:bg-neutral-900 border border-neutral-800/50 shadow-sm group-hover:shadow-xl group-hover:border-neutral-700 transition-all duration-300 mb-3.5">
                <img
                  src={cat.logo || (cat.sliders && cat.sliders[0]) || "/placeholder-category.png"} 
                  alt={cat.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500 ease-out"
                />

                {/* Badge Overlay */}
                {cat.badge && (
                  <div className="absolute bottom-2 left-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-r-md shadow-md">
                    {cat.badge}
                  </div>
                )}
              </div>

              {/* Category Name */}
              <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-neutral-300 text-center group-hover:text-white transition-colors capitalize line-clamp-1 w-full px-1">
                {cat.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
      
      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div className="text-center text-gray-500 bg-neutral-900/40 border border-neutral-800/60 rounded-2xl py-12 my-4">
          No categories found. Please add them from the admin panel.
        </div>
      )}

      {/* Global CSS to hide webkit scrollbars while keeping scroll functionality */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

export default Topcategories;