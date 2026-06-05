"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firebase } from "../Firebase/config";
import { FaStar, FaStarHalfAlt, FaChevronDown } from "react-icons/fa";

function PriceRangeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = firebase.firestore();

  // Get URL Parameters
  const type = searchParams.get("type") || "under"; // "under" or "above"
  const amountParam = searchParams.get("amount") || "99";
  const amount = Number(amountParam);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");

  // Helper functions for pricing (handles variants just like your category page)
  const getProductPrice = (product) => {
    if (product?.variants && product.variants.length > 0) {
      return Number(product.variants[0].sellingPrice || product.variants[0].price || 0);
    }
    return Number(product.price || 0); 
  };

  const getProductMRP = (product) => {
    if (product?.variants && product.variants.length > 0) {
      return Number(product.variants[0].mrp || product.variants[0].originalPrice || 0);
    }
    return Number(product.originalPrice || 0); 
  };

  // 1. Fetch and Filter Products
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        // Fetch all products (or a limited batch if your DB is huge)
        const prodSnap = await db.collection("products").get();
        const allProducts = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter products client-side to accurately calculate nested variant prices
        const filtered = allProducts.filter((product) => {
          const price = getProductPrice(product);
          
          if (type === "under") {
            return price > 0 && price <= amount;
          } else if (type === "above") {
            return price >= amount;
          }
          return false;
        });

        setProducts(filtered);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [type, amount, db]);

  // 2. Handle Sorting
  let sortedProducts = [...products];
  switch (sortBy) {
    case "price-low":
      sortedProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
      break;
    case "price-high":
      sortedProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
      break;
    case "a-z":
      sortedProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    case "z-a":
      sortedProducts.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      break;
    case "date-new":
      sortedProducts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      break;
    case "date-old":
      sortedProducts.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      break;
    default:
      break;
  }

  // Page Title formatting
  const pageTitle = type === "under" ? `Products Under Rs. ${amount}` : `Products Above Rs. ${amount}`;

  return (
    <div className="min-h-screen bg-white font-sans text-black pb-24">
      
      {/* HEADER / BREADCRUMBS */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-8 pb-4">
        <div className="text-sm text-gray-500 mb-4 uppercase">
          Home <span className="mx-1">&gt;</span> Shop By Price <span className="mx-1">&gt;</span> <span className="text-gray-400">{pageTitle}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide border-b border-gray-200 pb-6">
          {pageTitle}
        </h1>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-4">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
           <div className="text-sm text-gray-600 font-medium">
             Showing {sortedProducts.length} results
           </div>

          <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
            <span>Sort by:</span>
            <div className="relative border border-gray-300 rounded px-3 py-1.5 bg-gray-50 hover:bg-white cursor-pointer w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer appearance-none text-sm"
              >
                <option value="default">Featured</option>
                <option value="a-z">Alphabetically, A-Z</option>
                <option value="z-a">Alphabetically, Z-A</option>
                <option value="price-low">Price, low to high</option>
                <option value="price-high">Price, high to low</option>
                <option value="date-new">Date, new to old</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronDown size={10} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse border border-gray-100 rounded flex flex-col p-2">
                <div className="bg-gray-200 aspect-square w-full mb-4"></div>
                <div className="bg-gray-200 h-4 w-1/3 mb-2"></div>
                <div className="bg-gray-200 h-4 w-full"></div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {sortedProducts.map((product) => {
              const price = getProductPrice(product);
              const mrp = getProductMRP(product);
              const displayImage = (product.images && product.images.length > 0) 
                ? product.images[0] 
                : "/placeholder.png";

              const ratingCount = product.reviews?.length || Math.floor(Math.random() * 50) + 5;

              return (
                <div 
                  key={product.id} 
                  className="group border border-gray-200 hover:border-gray-300 rounded cursor-pointer overflow-hidden flex flex-col transition-all bg-white"
                  onClick={() => router.push(`/product-detail?id=${product.id}`)}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-[#f8f8f8] p-4 flex items-center justify-center">
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Price Section */}
                    <div className="flex items-end gap-2 mb-1.5 flex-wrap">
                      <span className="text-[16px] font-bold text-[#dc2626]">Rs. {price.toFixed(2)}</span>
                      {mrp > price && (
                        <span className="text-[12px] text-gray-500 line-through mb-[2px]">
                          MRP Rs. {mrp.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex text-[#f59e0b] text-sm">
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStarHalfAlt />
                      </div>
                      <span className="text-xs text-gray-600">({ratingCount})</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm text-gray-800 leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="py-24 text-center border border-gray-100 rounded bg-gray-50 flex flex-col items-center justify-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500">We couldn't find any products in this price range right now.</p>
              <button 
                onClick={() => router.push('/')}
                className="mt-6 px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors text-sm"
              >
                Go Back Home
              </button>
           </div>
        )}
      </div>
    </div>
  );
}

export default function PriceRangePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="text-gray-500 font-medium">Loading Products...</div>
      </div>
    }>
      <PriceRangeContent />
    </Suspense>
  );
}