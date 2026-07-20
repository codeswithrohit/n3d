"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firebase } from "../Firebase/config"; 
import { FaFilter, FaSortAmountDown, FaSearch, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Adjust the number of products per page here

  // ================= DATA FETCHING =================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Categories for the sidebar
        const catSnap = await db.collection("n3dcategories").get();
        const fetchedCats = catSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(fetchedCats);

        // 2. Fetch All Products (for client-side search & filtering)
        const prodSnap = await db.collection("n3dproducts").get();
        const products = prodSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllProducts(products);

        // 3. Setup Initial Suggestions (Fallback if search is empty)
        setSuggestedProducts(products.slice(0, 8));
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
      result = result.filter((p) => {
        const name = p.name || p.productName || "";
        const desc = p.description || "";
        return (
          name.toLowerCase().includes(lowerQuery) ||
          desc.toLowerCase().includes(lowerQuery)
        );
      });
    }

    // 2. Apply Category Filter
    if (selectedCategory !== "ALL") {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // 3. Apply Sorting
    if (sortBy === "PRICE_LOW_HIGH") {
      result.sort((a, b) => {
        const priceA = Number(
          a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || a.price || 0
        );
        const priceB = Number(
          b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || b.price || 0
        );
        return priceA - priceB;
      });
    } else if (sortBy === "PRICE_HIGH_LOW") {
      result.sort((a, b) => {
        const priceA = Number(
          a.variants?.[0]?.offerPrice || a.variants?.[0]?.price || a.price || 0
        );
        const priceB = Number(
          b.variants?.[0]?.offerPrice || b.variants?.[0]?.price || b.price || 0
        );
        return priceB - priceA;
      });
    } else {
      // NEWEST (Default fallback)
      result.reverse();
    }

    setFilteredProducts(result);
    setCurrentPage(1); // Reset to page 1 whenever filters/search change
  }, [query, allProducts, selectedCategory, sortBy]);

  // ================= PAGINATION CALCULATIONS =================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // ================= RENDER HELPERS =================
  const renderProductCard = (item) => {
    const itemPrice = Number(
      item.variants?.[0]?.offerPrice || item.variants?.[0]?.price || item.price || 0
    );
    const itemOldPrice = Number(
      item.variants?.[0]?.price || item.originalPrice || 0
    );
    const discount =
      itemOldPrice > itemPrice
        ? Math.round(((itemOldPrice - itemPrice) / itemOldPrice) * 100)
        : 0;

    return (
      <div
        key={item.id}
        onClick={() => router.push(`/product-detail?id=${item.id}`)}
        className="group cursor-pointer flex flex-col bg-black border border-neutral-800 p-4 rounded-2xl transition-all duration-300 hover:border-neutral-500 hover:-translate-y-1"
      >
        <div className="aspect-square bg-white rounded-xl overflow-hidden relative mb-4 flex items-center justify-center">
          {discount > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-white text-black border border-black text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md shadow-sm">
              {discount}% OFF
            </span>
          )}
          <img
            src={item.images?.[0] || item.image || "/placeholder.png"}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            alt={item.name || item.productName}
          />
        </div>
        <div className="flex flex-col flex-1 border-t border-neutral-800 pt-3">
          <h3 className="text-sm font-bold text-neutral-300 line-clamp-2 leading-snug mb-3">
            {item.name || item.productName}
          </h3>
          <div className="mt-auto flex items-center gap-2 flex-wrap">
            <span className="text-lg font-black text-white">
              ₹{itemPrice.toFixed(2)}
            </span>
            {itemOldPrice > itemPrice && (
              <span className="text-sm font-bold text-neutral-500 line-through">
                ₹{itemOldPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black min-h-screen py-8 px-4 md:px-8 font-sans text-white transition-colors duration-300 pb-24">
      <div className="max-w-[1300px] mx-auto">
        
        {/* ================= HEADER ================= */}
        <div className="mb-8 border-b border-neutral-800 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Search Results</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight line-clamp-1 uppercase">
              {query ? `Results for "${query}"` : "All Products"}
            </h1>
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center justify-center gap-2 bg-neutral-900 text-white h-12 px-6 rounded-xl text-xs font-black uppercase tracking-widest border border-neutral-800 shadow-sm active:bg-neutral-800 transition-all"
            >
              <FaFilter size={12} /> Filters & Sort
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          
          {/* ================= SIDEBAR FILTERS (Desktop) ================= */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6">
            
            {/* Sort Options */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                <FaSortAmountDown size={14} className="text-neutral-500" /> Sort By
              </h3>
              <div className="space-y-3">
                {[
                  { id: "NEWEST", label: "Newest Arrivals" },
                  { id: "PRICE_LOW_HIGH", label: "Price: Low to High" },
                  { id: "PRICE_HIGH_LOW", label: "Price: High to Low" },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        sortBy === opt.id
                          ? "border-white bg-white"
                          : "border-neutral-600 bg-transparent"
                      }`}
                    >
                      {sortBy === opt.id && (
                        <div className="w-2 h-2 bg-black rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                        sortBy === opt.id
                          ? "text-white"
                          : "text-neutral-500 group-hover:text-neutral-300"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                <FaFilter size={14} className="text-neutral-500" /> Categories
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <div
                  onClick={() => setSelectedCategory("ALL")}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      selectedCategory === "ALL"
                        ? "border-white bg-white"
                        : "border-neutral-600 bg-transparent"
                    }`}
                  >
                    {selectedCategory === "ALL" && (
                      <div className="w-2 h-2 bg-black rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                      selectedCategory === "ALL"
                        ? "text-white"
                        : "text-neutral-500 group-hover:text-neutral-300"
                    }`}
                  >
                    All Categories
                  </span>
                </div>

                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        selectedCategory === cat.id
                          ? "border-white bg-white"
                          : "border-neutral-600 bg-transparent"
                      }`}
                    >
                      {selectedCategory === cat.id && (
                        <div className="w-2 h-2 bg-black rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                        selectedCategory === cat.id
                          ? "text-white"
                          : "text-neutral-500 group-hover:text-neutral-300"
                      }`}
                    >
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
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                {loading
                  ? "Searching..."
                  : `Showing ${filteredProducts.length > 0 ? indexOfFirstItem + 1 : 0}-${Math.min(indexOfLastItem, filteredProducts.length)} of ${filteredProducts.length} results`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl animate-pulse"
                  >
                    <div className="aspect-square bg-neutral-900 rounded-xl mb-4"></div>
                    <div className="h-4 bg-neutral-900 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-neutral-900 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredProducts.length === 0 ? (
                  /* ================= EMPTY STATE & SUGGESTIONS ================= */
                  <div className="space-y-12">
                    <div className="text-center py-20 bg-neutral-950 rounded-3xl border border-neutral-800 shadow-sm">
                      <div className="text-5xl text-neutral-700 mb-4 flex justify-center">
                        <FaSearch />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                        No exact matches found
                      </h3>
                      <p className="text-sm font-medium text-neutral-400 max-w-md mx-auto mb-8">
                        We couldn't find anything matching your filters. Try
                        adjusting your search or check out our suggestions below.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory("ALL");
                          setSortBy("NEWEST");
                          router.push("/search");
                        }}
                        className="bg-white text-black text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-neutral-300 transition-colors shadow-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>

                    {/* Suggestions Section */}
                    {suggestedProducts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <h2 className="text-xl font-black uppercase tracking-wider text-white">
                            Suggested For You
                          </h2>
                          <div className="flex-1 h-px bg-neutral-800"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                          {suggestedProducts.map(renderProductCard)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Results */
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {currentProducts.map(renderProductCard)}
                    </div>

                    {/* ================= PAGINATION CONTROLS ================= */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center mt-12 gap-4 border-t border-neutral-800 pt-8">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-5 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-neutral-800 transition-colors flex items-center gap-2"
                        >
                          <FaChevronLeft size={10} /> Prev
                        </button>
                        <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                          Page <span className="text-white">{currentPage}</span> of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-5 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-30 hover:bg-neutral-800 transition-colors flex items-center gap-2"
                        >
                          Next <FaChevronRight size={10} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ================= MOBILE FILTER DRAWER ================= */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[200] flex justify-end md:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          ></div>

          <div className="relative w-[85%] max-w-sm bg-neutral-950 border-l border-neutral-800 h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-black">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-full transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-950">
              {/* Sort Options Mobile */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-4">Sort By</h3>
                <div className="space-y-4">
                  {[
                    { id: "NEWEST", label: "Newest Arrivals" },
                    { id: "PRICE_LOW_HIGH", label: "Price: Low to High" },
                    { id: "PRICE_HIGH_LOW", label: "Price: High to Low" },
                  ].map((opt) => (
                    <div
                      key={`mob-${opt.id}`}
                      onClick={() => setSortBy(opt.id)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          sortBy === opt.id
                            ? "border-white bg-white"
                            : "border-neutral-700 bg-transparent"
                        }`}
                      >
                        {sortBy === opt.id && (
                          <div className="w-2.5 h-2.5 bg-black rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                          sortBy === opt.id
                            ? "text-white"
                            : "text-neutral-400"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter Mobile */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-4">
                  Categories
                </h3>
                <div className="space-y-4">
                  <div
                    onClick={() => setSelectedCategory("ALL")}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        selectedCategory === "ALL"
                          ? "border-white bg-white"
                          : "border-neutral-700 bg-transparent"
                      }`}
                    >
                      {selectedCategory === "ALL" && (
                        <div className="w-2.5 h-2.5 bg-black rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                        selectedCategory === "ALL"
                          ? "text-white"
                          : "text-neutral-400"
                      }`}
                    >
                      All Categories
                    </span>
                  </div>

                  {categories.map((cat) => (
                    <div
                      key={`mob-${cat.id}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          selectedCategory === cat.id
                            ? "border-white bg-white"
                            : "border-neutral-700 bg-transparent"
                        }`}
                      >
                        {selectedCategory === cat.id && (
                          <div className="w-2.5 h-2.5 bg-black rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                          selectedCategory === cat.id
                            ? "text-white"
                            : "text-neutral-400"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutral-800 bg-black">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-300 transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Animation Styles */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

// Next.js 13+ Wrapper for useSearchParams
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-neutral-800 border-t-white"></div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}