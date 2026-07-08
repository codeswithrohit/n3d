"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Gallery = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data from Firestore
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection("n3dgallery")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSlides(items);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching gallery:", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // 2. Auto-Sliding Logic
  useEffect(() => {
    if (slides.length === 0) return;

    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(slideInterval);
  }, [currentIndex, slides.length]);

  // 3. Navigation Handlers
  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  // 4. Loading & Empty States
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex justify-center items-center h-[50vh] bg-gray-50 text-gray-500">
        No images found in the gallery.
      </div>
    );
  }

  return (
    <div className="w-full bg-black px-4 sm:px-6 lg:px-8 ">
      {/* Slider Container */}
      <div className="relative h-[40vh] sm:h-[50vh] lg:h-[70vh] w-full rounded-2xl overflow-hidden shadow-xl group">
        
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image */}
            <img 
              src={slide.imageUrl} 
              alt={slide.title} 
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            {/* Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16 text-white transform transition-transform duration-700 translate-y-0">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-md">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 drop-shadow max-w-3xl line-clamp-2">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Left Arrow */}
        <button 
          onClick={prevSlide}
          className="hidden group-hover:block absolute top-[50%] -translate-y-[-50%] left-4 sm:left-8 text-2xl rounded-full p-3 bg-black/30 hover:bg-black/60 text-white cursor-pointer z-20 transition-all backdrop-blur-sm"
        >
          <FaChevronLeft size={20} />
        </button>

        {/* Right Arrow */}
        <button 
          onClick={nextSlide}
          className="hidden group-hover:block absolute top-[50%] -translate-y-[-50%] right-4 sm:right-8 text-2xl rounded-full p-3 bg-black/30 hover:bg-black/60 text-white cursor-pointer z-20 transition-all backdrop-blur-sm"
        >
          <FaChevronRight size={20} />
        </button>

        {/* Dots Indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, slideIndex) => (
            <div
              key={slideIndex}
              onClick={() => goToSlide(slideIndex)}
              className={`transition-all duration-300 cursor-pointer rounded-full ${
                currentIndex === slideIndex 
                  ? 'bg-white w-8 h-2.5 sm:h-3' 
                  : 'bg-white/50 w-2.5 h-2.5 sm:w-3 sm:h-3 hover:bg-white/80'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Gallery;