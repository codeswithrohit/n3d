"use client";

import React, { useState, useEffect, useRef } from 'react';
import { firebase } from '../Firebase/config';
import { 
  FaRegEye, 
  FaChevronLeft, 
  FaChevronRight, 
  FaTimes,
  FaVideo,
  FaDownload,
  FaHeart,
  FaShareAlt
} from 'react-icons/fa';

const Influencer = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Create an array of refs to control the play/pause state of each video
  const videoRefs = useRef([]);

  // Fetch Videos from Firestore
  useEffect(() => {
    const db = firebase.firestore();
    const unsubscribe = db.collection('n3dinfluencer_videos')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const videoData = snapshot.docs.map(doc => {
          const data = doc.data();
          const mockOriginalPrice = Math.floor(Math.random() * 1000) + 199;
          const mockDiscount = Math.floor(Math.random() * 50) + 30;
          const mockPrice = Math.floor(mockOriginalPrice * (1 - mockDiscount / 100));
          const mockViews = Math.random() > 0.5 
            ? `${Math.floor(Math.random() * 90) + 10}K` 
            : `${Math.floor(Math.random() * 5) + 1}L`;

          return {
            id: doc.id,
            title: data.title || 'Amazing Product',
            videoUrl: data.videoUrl,
            views: mockViews,
            price: mockPrice,
            originalPrice: mockOriginalPrice,
            discount: mockDiscount,
            likes: Math.floor(Math.random() * 900) + 100
          };
        });
        
        setVideos(videoData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching videos: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeIndex]);

  // Handle Play/Pause based on which slide is active
  useEffect(() => {
    videoRefs.current.forEach((vid, index) => {
      if (vid) {
        if (index === activeIndex) {
          vid.currentTime = 0; // Restart video when sliding to it
          vid.play().catch(err => console.log("Auto-play prevented", err));
        } else {
          vid.pause(); // Pause all inactive videos
        }
      }
    });
  }, [activeIndex]);

  // Modal Navigation
  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (activeIndex < videos.length - 1) setActiveIndex(prev => prev + 1);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (activeIndex > 0) setActiveIndex(prev => prev - 1);
  };

  const closeModal = () => {
    setActiveIndex(null);
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-10 font-sans">
      
      {/* Section Title */}
      <h2 className="text-2xl md:text-3xl text-white text-center mb-8 text-gray-900 dark:text-white tracking-wide">
        Top Pick By Influencers
      </h2>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-[180px] sm:w-[220px] shrink-0 animate-pulse">
              <div className="w-full aspect-[9/16] bg-gray-200 dark:bg-neutral-800 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        /* Video Grid / Carousel */
        <div className="flex gap-4 sm:gap-5 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-6">
          {videos.map((video, index) => (
            <div 
              key={video.id} 
              className="w-[180px] sm:w-[220px] shrink-0 snap-start cursor-pointer group"
              onClick={() => setActiveIndex(index)}
            >
              {/* Thumbnail Container */}
              <div className="relative w-full aspect-[9/16] bg-gray-100 dark:bg-neutral-900 rounded-xl overflow-hidden mb-3 shadow-sm">
                {/* View Count Badge */}
                <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <FaRegEye size={12} /> {video.views}
                </div>

                <video 
                  src={`${video.videoUrl}#t=0.1`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  muted 
                  playsInline
                  preload="metadata"
                />
                
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="bg-white/30 backdrop-blur-md rounded-full p-3">
                      <FaVideo className="text-white ml-1" size={24} />
                   </div>
                </div>
              </div>

             
            </div>
          ))}
          
          {videos.length === 0 && (
            <div className="w-full text-center py-10 text-gray-500">
              No influencer videos found.
            </div>
          )}
        </div>
      )}

      {/* ================= FULL SCREEN MODAL WITH "PEEKING" SIDE VIDEOS ================= */}
      {activeIndex !== null && (
        <div 
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-white hover:text-red-500 bg-black/40 hover:bg-white/20 rounded-full p-3 transition-colors"
          >
            <FaTimes size={24} />
          </button>

          {/* Left Arrow */}
          {activeIndex > 0 && (
            <button 
              onClick={handlePrev}
              className="hidden sm:flex absolute left-4 md:left-12 lg:left-24 z-50 bg-white/10 hover:bg-white text-white hover:text-black w-12 h-12 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all"
            >
              <FaChevronLeft size={20} className="-ml-1" />
            </button>
          )}

          {/* Right Arrow */}
          {activeIndex < videos.length - 1 && (
            <button 
              onClick={handleNext}
              className="hidden sm:flex absolute right-4 md:right-12 lg:right-24 z-50 bg-white/10 hover:bg-white text-white hover:text-black w-12 h-12 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all"
            >
              <FaChevronRight size={20} className="-mr-1" />
            </button>
          )}

          {/* Video Track Container (Full Width) */}
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            
            {videos.map((video, index) => {
              // Calculate distance from active video
              const offset = index - activeIndex;
              
              // Only render videos that are currently on screen or immediately next to it for performance
              if (Math.abs(offset) > 2) return null;

              return (
                <div 
                  key={video.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // If clicking a side video, navigate to it
                    if (offset !== 0) {
                      offset > 0 ? handleNext() : handlePrev();
                    }
                  }}
                  className={`absolute top-1/2 left-1/2 w-full max-w-[380px] sm:max-w-[420px] aspect-[9/16] transition-all duration-500 ease-out flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 ${
                    offset !== 0 ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    // Centered, then shifted horizontally by 115% of its width per index offset
                    transform: `translate(calc(-50% + ${offset * 115}%), -50%) scale(${offset === 0 ? 1 : 0.85})`,
                    // Side videos are darkened and slightly transparent
                    opacity: offset === 0 ? 1 : 0.4,
                    filter: offset === 0 ? 'none' : 'brightness(50%) blur(1px)',
                    zIndex: offset === 0 ? 40 : 30,
                  }}
                >
                  <video 
                    ref={el => videoRefs.current[index] = el}
                    src={`${video.videoUrl}#t=0.1`}
                    className="w-full h-full object-cover"
                    loop 
                    playsInline
                    controls={offset === 0} // Only show controls for the active video
                  />

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}

export default Influencer;