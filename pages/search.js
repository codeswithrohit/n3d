"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firebase } from "../Firebase/config"; // Adjust path as needed
import { FaFilter, FaSortAmountDown, FaSearch, FaTimes } from "react-icons/fa";

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const db = firebase.firestore();

  // ================= STATES =================
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ================= DATA FETCHING =================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Categories for the sidebar
        const catSnap = await db.collection("categories").get();
        const fetchedCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCats);

        // 2. Fetch All Products (for client-side search & filtering)
        const prodSnap = await db.collection("products").get();
        const products = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProducts(products);

        // 3. Setup Initial Suggestions (Fallback if search is empty)
        setSuggestedProducts(products.slice(0, 6));

      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db]);

  // ================= SEARCH & FILTER LOGIC =================
  useEffect(() => {
    let result = [...allProducts];

    // 1. Apply Search Query
    if (query.trim() !== "") {
      const lowerQuery = query.toLowerCase();
      result = result.filter(p => {
        const name = p.name || p.productName || "";
        const desc = p.description || "";
        return name.toLowerCase().includes(lowerQuery) || desc.toLowerCase().includes(lowerQuery);
      });
    }

    // 2. Apply Category Filter
    if (selectedCategory !== "ALL") {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // 3. Apply Sorting
    if (sortBy === "PRICE_LOW_HIGH") {
      result.sort((a, b) => {
        const priceA = Number(a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || a.price || 0);
        const priceB = Number(b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || b.price || 0);
        return priceA - priceB;
      });
    } else if (sortBy === "PRICE_HIGH_LOW") {
      result.sort((a, b) => {
        const priceA = Number(a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || a.price || 0);
        const priceB = Number(b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || b.price || 0);
        return priceB - priceA;
      });
    } else {
      // NEWEST (Default fallback)
      result.reverse(); 
    }

    setFilteredProducts(result);
  }, [query, allProducts, selectedCategory, sortBy]);

  // ================= RENDER HELPERS =================
  const renderProductCard = (item) => {
    const itemPrice = Number(item.variants?.[0]?.offerPrice || item.variants?.[0]?.price || item.price || 0);
    const itemOldPrice = Number(item.variants?.[0]?.price || item.originalPrice || 0);
    const discount = itemOldPrice > itemPrice ? Math.round(((itemOldPrice - itemPrice) / itemOldPrice) * 100) : 0;

    return (
      <div 
        key={item.id} 
        onClick={() => router.push(`/product-detail?id=${item.id}`)} 
        className="group cursor-pointer flex flex-col border-2 border-black p-3 rounded-2xl transition-transform hover:-translate-y-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="aspect-square bg-white border-2 border-black mb-3 rounded-xl overflow-hidden relative">
          {discount > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-white text-black text-[9px] font-black px-2 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              -{discount}%
            </span>
          )}
          <img 
            src={item.images?.[0] || item.image || "/placeholder.png"} 
            className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-500 bg-white" 
            alt={item.name || item.productName} 
          />
        </div>
        <div className="flex flex-col flex-1 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-black line-clamp-2 leading-snug mb-2">
            {item.name || item.productName}
          </h3>
          <div className="mt-auto flex items-end gap-2 flex-wrap">
             <span className="text-sm font-black text-black">₹{itemPrice.toFixed(2)}</span>
             {itemOldPrice > itemPrice && (
               <span className="text-[10px] font-bold text-black line-through mb-[1px] opacity-60">₹{itemOldPrice.toFixed(2)}</span>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen py-8 px-4 md:px-8 font-sans transition-colors duration-300">
      <div className="max-w-[1300px] mx-auto">
        
        {/* ================= HEADER ================= */}
        <div className="mb-8 border-b-4 border-black pb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2">Search Results</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter line-clamp-1">
              {query ? `"${query}"` : "ALL PRODUCTS"}
            </h1>
            
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center justify-center gap-2 bg-white text-black h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            >
              <FaFilter size={12} /> Filters & Sort
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          
          {/* ================= SIDEBAR FILTERS (Desktop) ================= */}
          <aside className="hidden md:block w-64 shrink-0 space-y-8">
            
            {/* Sort Options */}
            <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-5 flex items-center gap-2 border-b-2 border-black pb-2">
                <FaSortAmountDown size={12} /> Sort By
              </h3>
              <div className="space-y-4">
                {[
                  { id: "NEWEST", label: "Newest Arrivals" },
                  { id: "PRICE_LOW_HIGH", label: "Price: Low to High" },
                  { id: "PRICE_HIGH_LOW", label: "Price: High to Low" }
                ].map(opt => (
                  <div 
                    key={opt.id} 
                    onClick={() => setSortBy(opt.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-colors ${sortBy === opt.id ? 'bg-white border-black' : 'border-black bg-white'}`}>
                      {sortBy === opt.id && <div className="w-2.5 h-2.5 bg-black" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${sortBy === opt.id ? 'text-black' : 'text-black opacity-60 group-hover:opacity-100'}`}>
                      {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-5 flex items-center gap-2 border-b-2 border-black pb-2">
                <FaFilter size={12} /> Categories
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                
                <div 
                  onClick={() => setSelectedCategory("ALL")}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-colors ${selectedCategory === "ALL" ? 'bg-white border-black' : 'border-black bg-white'}`}>
                    {selectedCategory === "ALL" && <div className="w-2.5 h-2.5 bg-black" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedCategory === "ALL" ? 'text-black' : 'text-black opacity-60 group-hover:opacity-100'}`}>
                    ALL CATEGORIES
                  </span>
                </div>

                {categories.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-colors ${selectedCategory === cat.id ? 'bg-white border-black' : 'border-black bg-white'}`}>
                      {selectedCategory === cat.id && <div className="w-2.5 h-2.5 bg-black" />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedCategory === cat.id ? 'text-black' : 'text-black opacity-60 group-hover:opacity-100'}`}>
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ================= RESULTS GRID ================= */}
          <main className="flex-1">
            
            {/* Toolbar Status */}
            <div className="flex items-center justify-between mb-6">
               <p className="text-xs font-black uppercase tracking-widest text-black bg-white px-4 py-2 rounded border-2 border-black">
                 {loading ? "SEARCHING..." : `SHOWING ${filteredProducts.length} RESULTS`}
               </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse border-4 border-black p-4 rounded-2xl bg-white">
                    <div className="aspect-square bg-black opacity-10 mb-4 rounded-xl"></div>
                    <div className="h-4 bg-black opacity-20 w-3/4 rounded mb-3"></div>
                    <div className="h-4 bg-black opacity-20 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredProducts.length === 0 ? (
                  
                  /* ================= EMPTY STATE & SUGGESTIONS ================= */
                  <div className="space-y-12">
                    <div className="text-center py-20 bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-6xl mb-6">🔍</div>
                      <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-4">No exact matches found</h3>
                      <p className="text-xs font-black text-black opacity-70 max-w-md mx-auto uppercase tracking-widest leading-relaxed">
                        We couldn't find anything matching your filters. Check out some of our top picks below.
                      </p>
                      <button 
                        onClick={() => {
                          setSelectedCategory("ALL");
                          setSortBy("NEWEST");
                          router.push("/search");
                        }}
                        className="mt-8 bg-white text-black text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-colors"
                      >
                        CLEAR ALL FILTERS
                      </button>
                    </div>

                    {/* Suggestions Section */}
                    {suggestedProducts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-6 mb-8">
                           <h2 className="text-2xl font-black uppercase tracking-tighter text-black">SUGGESTED PRODUCTS</h2>
                           <div className="flex-1 h-1 bg-black"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                          {suggestedProducts.map(renderProductCard)}
                        </div>
                      </div>
                    )}
                  </div>

                ) : (
                  /* Standard Results */
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(renderProductCard)}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ================= MOBILE FILTER DRAWER ================= */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[200] flex justify-end md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setShowMobileFilters(false)}></div>
          
          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 border-l-4 border-black animate-slide-in-right">
            
            <div className="flex items-center justify-between p-6 border-b-4 border-black bg-white">
              <h3 className="text-lg font-black uppercase tracking-widest text-black">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-3 bg-white text-black hover:bg-black hover:text-white rounded-full border-2 border-black transition-colors">
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-white">
              {/* Sort Options Mobile */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-black mb-6 border-b-2 border-black pb-2">Sort By</h3>
                <div className="space-y-5">
                  {[
                    { id: "NEWEST", label: "Newest Arrivals" },
                    { id: "PRICE_LOW_HIGH", label: "Price: Low to High" },
                    { id: "PRICE_HIGH_LOW", label: "Price: High to Low" }
                  ].map(opt => (
                    <div 
                      key={`mob-${opt.id}`} 
                      onClick={() => setSortBy(opt.id)}
                      className="flex items-center gap-4 cursor-pointer group"
                    >
                      <div className={`w-6 h-6 rounded-none border-2 flex items-center justify-center transition-colors ${sortBy === opt.id ? 'bg-white border-black' : 'border-black bg-white'}`}>
                        {sortBy === opt.id && <div className="w-3 h-3 bg-black" />}
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${sortBy === opt.id ? 'text-black' : 'text-black opacity-60 group-hover:opacity-100'}`}>
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter Mobile */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-black mb-6 border-b-2 border-black pb-2">Categories</h3>
                <div className="space-y-5">
                  
                  <div 
                    onClick={() => setSelectedCategory("ALL")}
                    className="flex items-center gap-4 cursor-pointer group"
                  >
                    <div className={`w-6 h-6 rounded-none border-2 flex items-center justify-center transition-colors ${selectedCategory === "ALL" ? 'bg-white border-black' : 'border-black bg-white'}`}>
                      {selectedCategory === "ALL" && <div className="w-3 h-3 bg-black" />}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${selectedCategory === "ALL" ? 'text-black' : 'text-black opacity-60 group-hover:opacity-100'}`}>
                      All Categories
                    </span>
                  </div>

                  {categories.map(cat => (
                    <div 
                      key={`mob-${cat.id}`} 
                      onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-4 cursor-pointer group"
                    >
                      <div className={`w-6 h-6 rounded-none border-2 flex items-center justify-center transition-colors ${selectedCategory === cat.id ? 'bg-white border-black' : 'border-black bg-white'}`}>
                        {selectedCategory === cat.id && <div className="w-3 h-3 bg-black" />}
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${selectedCategory === cat.id ? 'text-black' : 'text-black opacity-60 group-hover:opacity-100'}`}>
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t-4 border-black bg-white">
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-14 bg-white text-black hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Animation Styles */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// Next.js 13+ Wrapper for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-none h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}