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
  }, [query, allProducts, selectedCategory, sortBy]);

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
        className="group cursor-pointer flex flex-col bg-white border border-gray-100 p-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      >
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative mb-4">
          {discount > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
              {discount}% OFF
            </span>
          )}
          <img
            src={item.images?.[0] || item.image || "/placeholder.png"}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            alt={item.name || item.productName}
          />
        </div>
        <div className="flex flex-col flex-1">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-3">
            {item.name || item.productName}
          </h3>
          <div className="mt-auto flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900">
              ₹{itemPrice.toFixed(2)}
            </span>
            {itemOldPrice > itemPrice && (
              <span className="text-sm font-medium text-gray-400 line-through">
                ₹{itemOldPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 md:px-8 font-sans transition-colors duration-300">
      <div className="max-w-[1300px] mx-auto">
        {/* ================= HEADER ================= */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <p className="text-sm font-medium text-gray-500 mb-2">Search Results</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight line-clamp-1">
              {query ? `Results for "${query}"` : "All Products"}
            </h1>
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center justify-center gap-2 bg-white text-gray-700 h-12 px-6 rounded-xl text-sm font-semibold border border-gray-200 shadow-sm active:bg-gray-50 transition-all"
            >
              <FaFilter size={14} /> Filters & Sort
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          {/* ================= SIDEBAR FILTERS (Desktop) ================= */}
          <aside className="hidden md:block w-64 shrink-0 space-y-6">
            {/* Sort Options */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaSortAmountDown size={14} className="text-gray-400" /> Sort By
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
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {sortBy === opt.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        sortBy === opt.id
                          ? "text-blue-600 font-medium"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaFilter size={14} className="text-gray-400" /> Categories
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <div
                  onClick={() => setSelectedCategory("ALL")}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      selectedCategory === "ALL"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {selectedCategory === "ALL" && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      selectedCategory === "ALL"
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 group-hover:text-gray-900"
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
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedCategory === cat.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? "text-blue-600 font-medium"
                          : "text-gray-600 group-hover:text-gray-900"
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
              <p className="text-sm font-medium text-gray-500">
                {loading
                  ? "Searching..."
                  : `Showing ${filteredProducts.length} results`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 p-4 rounded-2xl animate-pulse"
                  >
                    <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {filteredProducts.length === 0 ? (
                  /* ================= EMPTY STATE & SUGGESTIONS ================= */
                  <div className="space-y-12">
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <div className="text-5xl text-gray-300 mb-4 flex justify-center">
                        <FaSearch />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No exact matches found
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        We couldn't find anything matching your filters. Try
                        adjusting your search or check out our suggestions below.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory("ALL");
                          setSortBy("NEWEST");
                          router.push("/search");
                        }}
                        className="bg-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Clear All Filters
                      </button>
                    </div>

                    {/* Suggestions Section */}
                    {suggestedProducts.length > 0 && (
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <h2 className="text-xl font-bold text-gray-900">
                            Suggested For You
                          </h2>
                          <div className="flex-1 h-px bg-gray-200"></div>
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
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          ></div>

          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Sort Options Mobile */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Sort By</h3>
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
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {sortBy === opt.id && (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors ${
                          sortBy === opt.id
                            ? "text-blue-600 font-medium"
                            : "text-gray-600"
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
                <h3 className="text-sm font-bold text-gray-900 mb-4">
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
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedCategory === "ALL" && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        selectedCategory === "ALL"
                          ? "text-blue-600 font-medium"
                          : "text-gray-600"
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
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selectedCategory === cat.id && (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors ${
                          selectedCategory === cat.id
                            ? "text-blue-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
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
        /* Optional custom scrollbar for categories to make it clean */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}