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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Adjust this number to show more/less items per page

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
        // Fetch all products
        const prodSnap = await db.collection("n3dproducts").get();
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
        setCurrentPage(1); // Reset to first page when new data loads
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

  // 3. Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Handle Sort Change (Reset to page 1)
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // Page Title formatting
  const pageTitle = type === "under" ? `Products Under Rs. ${amount}` : `Products Above Rs. ${amount}`;

  return (
    <div className="min-h-screen bg-black font-sans text-white pb-24 transition-colors duration-300">
      
      {/* HEADER / BREADCRUMBS */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-8 pb-4">
        <div className="text-sm text-neutral-400 mb-4 uppercase font-bold tracking-widest">
          Home <span className="mx-1">&gt;</span> Shop By Price <span className="mx-1">&gt;</span> <span className="text-neutral-600">{pageTitle}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide border-b border-neutral-800 pb-6">
          {pageTitle}
        </h1>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-4">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-neutral-800 pb-4">
           <div className="text-sm text-neutral-400 font-bold uppercase tracking-widest">
             Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedProducts.length)} of {sortedProducts.length} results
           </div>

          <div className="flex items-center gap-2 text-sm text-white font-bold uppercase tracking-widest">
            <span>Sort by:</span>
            <div className="relative border border-neutral-700 rounded px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 cursor-pointer w-48 transition-colors">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full bg-transparent outline-none cursor-pointer appearance-none text-xs font-bold uppercase tracking-widest text-white"
              >
                <option value="default" className="bg-black">Featured</option>
                <option value="a-z" className="bg-black">Alphabetically, A-Z</option>
                <option value="z-a" className="bg-black">Alphabetically, Z-A</option>
                <option value="price-low" className="bg-black">Price, low to high</option>
                <option value="price-high" className="bg-black">Price, high to low</option>
                <option value="date-new" className="bg-black">Date, new to old</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronDown size={10} className="text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse border border-neutral-800 bg-neutral-950 rounded flex flex-col p-2">
                <div className="bg-neutral-800 aspect-square w-full mb-4 rounded"></div>
                <div className="bg-neutral-800 h-4 w-1/3 mb-2 rounded"></div>
                <div className="bg-neutral-800 h-4 w-full rounded"></div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {currentProducts.map((product) => {
                const price = getProductPrice(product);
                const mrp = getProductMRP(product);
                const displayImage = (product.images && product.images.length > 0) 
                  ? product.images[0] 
                  : "/placeholder.png";

                const ratingCount = product.reviews?.length || Math.floor(Math.random() * 50) + 5;

                return (
                  <div 
                    key={product.id} 
                    className="group border border-neutral-800 hover:border-neutral-500 rounded cursor-pointer overflow-hidden flex flex-col transition-all bg-black"
                    onClick={() => router.push(`/product-detail?id=${product.id}`)}
                  >
                    {/* Image */}
                    <div className="relative aspect-square flex items-center justify-center">
                      <img
                        src={displayImage}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col flex-1 border-t border-neutral-800">
                      {/* Price Section */}
                      <div className="flex items-end gap-2 mb-1.5 flex-wrap">
                        <span className="text-[16px] font-black text-white">Rs. {price.toFixed(2)}</span>
                        {mrp > price && (
                          <span className="text-[12px] text-neutral-500 line-through mb-[2px] font-bold">
                            MRP Rs. {mrp.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex text-neutral-300 text-sm">
                          <FaStar />
                          <FaStar />
                          <FaStar />
                          <FaStar />
                          <FaStarHalfAlt />
                        </div>
                        <span className="text-xs text-neutral-500 font-bold">({ratingCount})</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm text-neutral-300 font-bold leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-12 gap-4 border-t border-neutral-800 pt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-neutral-800 transition-colors"
                >
                  Prev
                </button>
                <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">
                  Page <span className="text-white">{currentPage}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
           <div className="py-24 text-center border border-neutral-800 rounded-xl bg-neutral-900 flex flex-col items-center justify-center shadow-lg">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">No products found</h3>
              <p className="text-neutral-400 font-medium text-sm">We couldn't find any products in this price range right now.</p>
              <button 
                onClick={() => router.push('/')}
                className="mt-6 px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-neutral-300 transition-colors text-xs"
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
      <div className="min-h-screen flex items-center justify-center bg-black text-white transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-white"></div>
      </div>
    }>
      <PriceRangeContent />
    </Suspense>
  );
}