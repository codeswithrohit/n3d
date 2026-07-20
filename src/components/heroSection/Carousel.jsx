"use client";

import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { firebase } from '../../../Firebase/config';

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Offers & Extract Sliders (Optimized with Caching)
  useEffect(() => {
    const fetchOfferSliders = async () => {
      // Step A: Check local storage for instant loading
      const cachedSlides = sessionStorage.getItem('cached_carousel_offers');
      if (cachedSlides) {
        setSlides(JSON.parse(cachedSlides));
        setLoading(false); // Instantly remove skeleton loader
      }

      try {
        const db = firebase.firestore();
        // Step B: Fetch fresh data from Firebase n3doffers
        const snapshot = await db.collection('n3doffers').orderBy('createdAt', 'desc').get();
        let dynamicSlides = [];

        snapshot.docs.forEach(doc => {
          const offerData = doc.data();
          // Only push to slider if the offer has an image uploaded
          if (offerData.imageUrl) {
            dynamicSlides.push({
              img: offerData.imageUrl,
              code: offerData.code,
              discount: offerData.discount
            });
          }
        });

        // Step C: Update state and cache ONLY if the data has changed
        if (JSON.stringify(dynamicSlides) !== cachedSlides) {
          setSlides(dynamicSlides);
          sessionStorage.setItem('cached_carousel_offers', JSON.stringify(dynamicSlides));
        }
      } catch (error) {
        console.error("Error fetching offer sliders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferSliders();
  }, []);

  const itemsPerView = 1; // Always show 1 image per view to fit all screens
  const maxIndex = Math.max(0, slides.length - itemsPerView);

  // 2. Handle Auto-Slide Interval
  useEffect(() => {
    if (slides.length <= itemsPerView) return; 

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

  // 3. Skeleton Loading State (Adjusted for Full Width 1 Item)
  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
        <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] bg-gray-200 dark:bg-neutral-800 animate-pulse rounded-2xl overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    );
  }

  // 4. Empty State
  if (slides.length === 0 && !loading) {
    return null; 
  }

  return (
    <div className="w-full bg-black px-2 sm:px-4 lg:px-8 py-6 max-w-[1500px] mx-auto relative group">
      
      {/* Slider Container Track */}
      <div className="overflow-hidden w-full relative rounded-2xl shadow-lg bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <div
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="w-full h-full shrink-0 flex items-center justify-center relative"
            >
              {/* Individual Full-Width Responsive Card */}
              <div className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] relative">
                <img
                  src={slide.img}
                  alt={slide.code}
                  className="w-full h-full object-cover" 
                />
                
              
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > itemsPerView && (
        <>
          <button
            onClick={prevSlide}
            className={`absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-xl text-black hover:bg-white hover:scale-110 transition-all z-10 ${
              current === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <FaChevronLeft size={16} className="-ml-0.5" />
          </button>

          <button
            onClick={nextSlide}
            className={`absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-xl text-black hover:bg-white hover:scale-110 transition-all z-10 ${
              current === maxIndex ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <FaChevronRight size={16} className="-mr-0.5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > itemsPerView && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
           {slides.map((_, dotIndex) => (
             <button
               key={dotIndex}
               onClick={() => setCurrent(dotIndex)}
               className={`transition-all duration-300 rounded-full h-2 ${
                 current === dotIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
               }`}
             />
           ))}
        </div>
      )}

    </div>
  );
}