"use client";

import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { firebase } from '../../../Firebase/config';

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Track how many items to show based on screen size
  const [itemsPerView, setItemsPerView] = useState(3);

  // 1. Fetch Categories and Extract Sliders
  useEffect(() => {
    const fetchCategorySliders = async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('n3dcategories').get();
        
        let dynamicSlides = [];

        snapshot.docs.forEach(doc => {
          const categoryData = doc.data();
          if (categoryData.sliders && categoryData.sliders.length > 0) {
            categoryData.sliders.forEach(sliderUrl => {
              dynamicSlides.push({
                img: sliderUrl,
                title: "LATEST COLLECTION OF",
                highlight: categoryData.name.toUpperCase(),
              });
            });
          }
        });

        setSlides(dynamicSlides);
      } catch (error) {
        console.error("Error fetching sliders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorySliders();
  }, []);

  // 2. Responsive Items Per View
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1); // Mobile
      else if (window.innerWidth < 1024) setItemsPerView(2); // Tablet
      else setItemsPerView(3); // Desktop
    };

    handleResize(); // Call initially
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // The highest index we can scroll to without showing empty space
  const maxIndex = Math.max(0, slides.length - itemsPerView);

  // 3. Handle Auto-Slide Interval
  useEffect(() => {
    if (slides.length <= itemsPerView) return; // Don't auto-scroll if all items fit on screen

    const interval = setInterval(() => {
      setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    
    return () => clearInterval(interval);
  }, [slides.length, itemsPerView, maxIndex]);

  const nextSlide = () => {
    if (slides.length <= itemsPerView) return;
    setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (slides.length <= itemsPerView) return;
    setCurrent((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  // 4. Skeleton Loading State
  if (loading) {
    return (
      <div className="w-full px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
        <div className="flex gap-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className={`relative w-full h-[180px] sm:h-[220px] md:h-[260px] bg-gray-200 dark:bg-neutral-800 animate-pulse rounded-xl overflow-hidden ${i > 0 ? 'hidden md:block' : ''} ${i === 1 ? 'hidden sm:block' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. Empty State
  if (slides.length === 0 && !loading) {
    return null; 
  }

  return (
    <div className="w-full bg-black px-2 sm:px-4 lg:px-8 py-6 max-w-[1500px] mx-auto relative group">
      
      {/* Slider Container Track */}
      <div className="overflow-hidden w-full relative">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * (100 / itemsPerView)}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="shrink-0 px-2"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              {/* Individual Card */}
              <div className="w-full h-[180px] sm:h-[220px] md:h-[260px] rounded-xl overflow-hidden shadow-sm relative bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                <img
                  src={slide.img}
                  alt={slide.highlight}
                  className="w-full h-full object-fit"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows (Matches the Screenshot Style) */}
      {slides.length > itemsPerView && (
        <>
          <button
            onClick={prevSlide}
            className={`absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] text-[#e53e3e] hover:bg-gray-50 hover:scale-105 transition-all z-10 ${
              current === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <FaChevronLeft size={16} className="-ml-0.5" />
          </button>

          <button
            onClick={nextSlide}
            className={`absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] text-[#e53e3e] hover:bg-gray-50 hover:scale-105 transition-all z-10 ${
              current === maxIndex ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <FaChevronRight size={16} className="-mr-0.5" />
          </button>
        </>
      )}

    </div>
  );
}