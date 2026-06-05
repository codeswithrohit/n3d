"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firebase } from "../Firebase/config";
import { FaStar, FaStarHalfAlt, FaChevronDown } from "react-icons/fa";

function SubcategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = firebase.firestore();

  // URL Parameters
  const categoryId = searchParams.get("categoryId");
  const initialSubcategoryId = searchParams.get("subcategoryId");
  const categoryName = searchParams.get("categoryName") || "Collection";
  const subcategoryName = searchParams.get("subcategoryName") || "Products";

  // States
  const [activeSubcatId, setActiveSubcatId] = useState(initialSubcategoryId);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");
  const [brandGalleryOpen, setBrandGalleryOpen] = useState(true);

  // Sync state if URL changes directly
  useEffect(() => {
    if (initialSubcategoryId) {
      setActiveSubcatId(initialSubcategoryId);
    }
  }, [initialSubcategoryId]);

  // Helper functions for pricing
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

  // 1. Fetch Top-Level Categories & Sibling Subcategories for the Sidebar
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        // Fetch categories for the main top list
        const catSnap = await db.collection("n3dcategories").get();
        const fetchedCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCats);

        // Fetch subcategories that belong to the same parent category
        if (categoryId) {
          const subSnap = await db.collection("n3dsubcategories")
            .where("categoryId", "==", categoryId)
            .get();
          const subs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSubcategories(subs);
          
          // If no active subcategory is set, default to the first one found
          if (!activeSubcatId && subs.length > 0) {
            setActiveSubcatId(subs[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      }
    };

    fetchSidebarData();
  }, [categoryId, activeSubcatId, db]);

  // 2. Fetch Products strictly by ACTIVE SUBCATEGORY
  useEffect(() => {
    if (!activeSubcatId) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const prodSnap = await db.collection("products")
          .where("subcategoryId", "==", activeSubcatId)
          .get();
        
        const fetchedProducts = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeSubcatId, db]);

  // 3. Handle Sorting matching the screenshot dropdown
  useEffect(() => {
    let sorted = [...products];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b));
        break;
      case "price-high":
        sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a));
        break;
      case "a-z":
        sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "z-a":
        sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "date-new":
        sorted.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        break;
      case "date-old":
        sorted.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
        break;
      default:
        break;
    }
    setFilteredProducts(sorted);
  }, [sortBy, products]);

  // Find active subcategory name for the header
  const currentSubcatObj = subcategories.find(s => s.id === activeSubcatId);
  const displayTitle = currentSubcatObj ? currentSubcatObj.name : subcategoryName;

  return (
    <div className="min-h-screen bg-white font-sans text-black pb-24">
      
      {/* ================= HEADER / BREADCRUMBS ================= */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-8 pb-4">
        <div className="text-sm text-gray-500 mb-4 uppercase">
          Home <span className="mx-1">&gt;</span> {categoryName} <span className="mx-1">&gt;</span> <span className="text-gray-400">{displayTitle}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide border-b border-gray-200 pb-6">
          {displayTitle}
        </h1>
      </div>

      {/* ================= MAIN LAYOUT (Sidebar + Grid) ================= */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 pt-4">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="flex items-center justify-between font-bold text-sm uppercase tracking-wider mb-4">
            <span>Categories</span>
            <span className="text-xl font-light">-</span>
          </div>
          
          <ul className="space-y-3 text-[15px] text-gray-800 mb-8">
            {categories.slice(0, 5).map(cat => (
              <li 
                key={cat.id} 
                className={`cursor-pointer transition-colors ${categoryId === cat.id ? 'text-red-600 font-semibold' : 'hover:text-red-600'}`}
                onClick={() => router.push(`/category?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`)}
              >
                {cat.name}
              </li>
            ))}
          </ul>

          {/* Subcategories (Sibling Switcher) */}
          {subcategories.length > 0 && (
            <div>
              <div 
                className="flex items-center justify-between font-bold text-sm uppercase tracking-wider mb-4 cursor-pointer"
                onClick={() => setBrandGalleryOpen(!brandGalleryOpen)}
              >
                <span>Subcategories</span>
                <span className="text-xl font-light">{brandGalleryOpen ? '-' : '+'}</span>
              </div>
              
              {brandGalleryOpen && (
                <ul className="space-y-3 text-[15px] text-gray-800 pl-2 border-l-2 border-gray-100 ml-1">
                  {subcategories.map(sub => (
                    <li 
                      key={sub.id} 
                      onClick={() => setActiveSubcatId(sub.id)}
                      className={`cursor-pointer pl-3 transition-all ${
                        activeSubcatId === sub.id 
                          ? 'text-red-600 font-semibold border-l-2 border-red-600 -ml-[2px]' 
                          : 'hover:text-red-600'
                      }`}
                    >
                      {sub.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* --- RIGHT CONTENT (Toolbar & Grid) --- */}
        <main className="flex-1">
          
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-800 font-medium">
            <span>Sort by:</span>
            <div className="relative border border-gray-300 rounded px-3 py-1.5 bg-gray-50 hover:bg-white cursor-pointer w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer appearance-none text-sm"
              >
                <option value="default">Featured</option>
                <option value="default">Most relevant</option>
                <option value="default">Best selling</option>
                <option value="a-z">Alphabetically, A-Z</option>
                <option value="z-a">Alphabetically, Z-A</option>
                <option value="price-low">Price, low to high</option>
                <option value="price-high">Price, high to low</option>
                <option value="date-old">Date, old to new</option>
                <option value="date-new">Date, new to old</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronDown size={10} className="text-gray-500" />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse border border-gray-100 rounded flex flex-col p-2">
                  <div className="bg-gray-200 aspect-square w-full mb-4"></div>
                  <div className="bg-gray-200 h-4 w-1/3 mb-2"></div>
                  <div className="bg-gray-200 h-4 w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => {
                const price = getProductPrice(product);
                const mrp = getProductMRP(product);
                const displayImage = (product.images && product.images.length > 0) 
                  ? product.images[0] 
                  : "/placeholder.png";

                // Mock rating for visual accuracy
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
             <div className="py-20 text-center text-gray-500 text-lg border border-gray-100 rounded bg-gray-50">
                No products found in this subcategory.
             </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SubcategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="text-gray-500 font-medium">Loading Products...</div>
      </div>
    }>
      <SubcategoryContent />
    </Suspense>
  );
}