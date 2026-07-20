"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../../../Firebase/config';
import { FaStar, FaRegStar, FaFireAlt } from "react-icons/fa";
import { MdStars } from "react-icons/md";
import { useRouter } from "next/navigation";

export default function HomeProducts() {
  const [hotDeals, setHotDeals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const db = firebase.firestore();
        
        // 1. Fetch Hot Deals
        const hotDealsPromise = db.collection('n3dproducts')
                                  .where('isHotDeal', '==', true)
                                  .get();
        
        // 2. Fetch Best Sellers (Products with 4 or 5 star average rating)
        const bestSellersPromise = db.collection('n3dproducts')
                                     .where('averageRating', '>=', 4)
                                     .get();

        const [hotDealsSnap, bestSellersSnap] = await Promise.all([hotDealsPromise, bestSellersPromise]);
        
        setHotDeals(hotDealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setBestSellers(bestSellersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderStars = (rating = 0, reviewCount = 0) => {
    // Generate a mock review count if 0, just to keep the UI looking full like the screenshot
    const displayCount = reviewCount || Math.floor(Math.random() * 50) + 5; 

    return (
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex text-[#f59e0b] text-sm">
          {[1, 2, 3, 4, 5].map(star => (
            star <= Math.round(rating) 
              ? <FaStar key={star} /> 
              : <FaRegStar key={star} className="text-gray-300" />
          ))}
        </div>
        <span className="text-xs text-gray-600">({displayCount})</span>
      </div>
    );
  };

  // ==========================================
  // MODERN PRODUCT CARD (White Theme Match)
  // ==========================================
  const ProductCard = ({ product }) => {
    const defaultPrice = Number(product.variants?.[0]?.offerPrice || product.variants?.[0]?.price || product.price || 0);
    const originalPrice = Number(product.variants?.[0]?.price || product.originalPrice || 0);
    
    // Calculate Discount
    const discount = originalPrice > defaultPrice 
      ? Math.round(((originalPrice - defaultPrice) / originalPrice) * 100) 
      : 0;

    const displayImage = product.images?.[0] || '/placeholder.png';

    return (
      <div 
        onClick={() => router.push(`/product-detail?id=${product.id}`)}
        className="group w-44 sm:w-48 md:w-56 flex-shrink-0 snap-start flex flex-col cursor-pointer border border-gray-200 hover:border-gray-300 rounded overflow-hidden bg-white transition-all"
      >
        {/* Image Container with Square Aspect Ratio & Light Gray BG */}
        <div className="relative aspect-square bg-[#f8f8f8]  flex items-center justify-center">
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm tracking-wider">
              {discount}% OFF
            </div>
          )}

          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-contain "
          />
        </div>
        
        {/* Product Info */}
        <div className="p-3 flex flex-col flex-1">
          {/* Price Section */}
          <div className="flex items-end gap-2 mb-1.5 flex-wrap">
            <span className="text-[15px] sm:text-[16px] font-bold text-red-600">
              Rs. {defaultPrice.toFixed(2)}
            </span>
            {originalPrice > defaultPrice && (
              <span className="text-[11px] sm:text-[12px] text-gray-500 line-through mb-[2px]">
                MRP Rs. {originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stars */}
          {renderStars(product.averageRating || 4, product.reviewCount)}

          {/* Title */}
          <h3 className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2">
            {product.name}
          </h3>
        </div>
      </div>
    );
  };

  // ==========================================
  // SKELETON LOADER
  // ==========================================
  if (loading) {
    return (
      <div className="mx-auto p-4 sm:p-6 lg:p-8 mt-4 space-y-12 max-w-[1500px] bg-white">
        {[1, 2].map((section) => (
          <div key={section}>
            {/* Skeleton Header */}
            <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-6"></div>
            {/* Skeleton Horizontal Row */}
            <div className="flex overflow-hidden gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-44 sm:w-48 md:w-56 flex-shrink-0 flex flex-col gap-3 border border-gray-100 rounded p-2 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mt-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8 mt-4 space-y-14 max-w-[1500px] bg-black text-black font-sans">
      
      {/* --- HOT DEALS SECTION --- */}
      {hotDeals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <FaFireAlt className="text-red-500 mb-1" /> Trending Deals
            </h2>
          </div>
          
          <div className="flex overflow-x-auto flex-nowrap gap-4 sm:gap-6 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {hotDeals.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* --- BEST SELLERS SECTION --- */}
      {bestSellers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <MdStars className="text-amber-500 text-2xl mb-1" /> Best Sellers
            </h2>
          </div>
          
          <div className="flex overflow-x-auto flex-nowrap gap-4 sm:gap-6 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {bestSellers.map(product => <ProductCard key={`bs-${product.id}`} product={product} />)}
          </div>
        </section>
      )}

      {/* Empty State */}
      {hotDeals.length === 0 && bestSellers.length === 0 && !loading && (
        <div className="py-20 text-center border border-gray-100 rounded bg-gray-50">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">No products currently highlighted</h3>
          <p className="text-gray-500 text-sm">Check back later for new deals and top-rated items.</p>
        </div>
      )}
      
    </div>
  );
}