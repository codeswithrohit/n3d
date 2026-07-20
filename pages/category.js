"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firebase } from "../Firebase/config";
import { 
  FaStar, 
  FaStarHalfAlt, 
  FaChevronDown, 
  FaChevronLeft, 
  FaChevronRight,
  FaFilter,
  FaTimes 
} from "react-icons/fa";

function CategoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = firebase.firestore();

  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName") || "NEW ARRIVALS";

  // States
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");
  const [brandGalleryOpen, setBrandGalleryOpen] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Helper functions
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

  // Fetch Sidebar Data
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const catSnap = await db.collection("n3dcategories").get();
        const fetchedCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCats);

        if (categoryId) {
          const subSnap = await db.collection("n3dsubcategories")
            .where("categoryId", "==", categoryId)
            .get();
          const subs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSubcategories(subs);
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      }
    };
    fetchSidebarData();
  }, [categoryId, db]);

  // Fetch Products
  useEffect(() => {
    if (!categoryId) return;
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const prodSnap = await db.collection("n3dproducts")
          .where("categoryId", "==", categoryId)
          .get();

        const fetchedProducts = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryId, db]);

  // Sorting
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
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "date-new":
        sorted.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        break;
      case "date-old":
        sorted.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
        break;
      default:
        break;
    }
    setFilteredProducts(sorted);
    setCurrentPage(1);
  }, [sortBy, products]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);

  const paginate = (page) => setCurrentPage(page);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-20">
      {/* Header / Breadcrumb */}
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 pt-10 pb-6 border-b border-zinc-800">
        <div className="flex items-center text-sm text-zinc-500 mb-3">
          Home <span className="mx-2">›</span> <span className="text-zinc-400 font-medium">{categoryName}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">{categoryName}</h1>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 md:px-10 pt-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-5 py-3 rounded-2xl text-sm font-medium"
          >
            <FaFilter /> Filters
          </button>

          <div className="text-sm text-zinc-400">
            {filteredProducts.length} products
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar - Categories & Subcategories */}
          <aside className={`lg:w-72 shrink-0 transition-all duration-300 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-6 bg-zinc-900 lg:bg-transparent border border-zinc-800 lg:border-none rounded-3xl p-6 lg:p-0">
              {/* Mobile Close Button */}
              <div className="lg:hidden flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={() => setShowMobileFilter(false)} className="text-zinc-400">
                  <FaTimes size={22} />
                </button>
              </div>

              <div className="text-xs uppercase tracking-[2px] font-semibold text-zinc-500 mb-4">CATEGORIES</div>
              <ul className="space-y-2 text-[15px]">
                {categories.slice(0, 10).map((cat) => (
                  <li
                    key={cat.id}
                    className={`cursor-pointer py-3 px-4 rounded-2xl transition-all ${categoryId === cat.id 
                      ? 'bg-white text-black font-medium' 
                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                    onClick={() => {
                      router.push(`/category?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`);
                      setShowMobileFilter(false);
                    }}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>

              {subcategories.length > 0 && (
                <div className="mt-10">
                  <div
                    className="flex items-center justify-between text-xs uppercase tracking-[2px] font-semibold text-zinc-500 mb-4 cursor-pointer"
                    onClick={() => setBrandGalleryOpen(!brandGalleryOpen)}
                  >
                    <span>BRAND GALLERY</span>
                    <span>{brandGalleryOpen ? '−' : '+'}</span>
                  </div>
                  {brandGalleryOpen && (
                    <ul className="space-y-3 text-[15px] text-zinc-400 pl-3">
                      {subcategories.map((sub) => (
                        <li key={sub.id} className="cursor-pointer hover:text-white transition-colors py-1">
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar - Desktop Only */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <p className="text-zinc-400">
                Showing <span className="text-white font-medium">{filteredProducts.length}</span> products
              </p>

              <div className="relative w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3.5 text-sm appearance-none focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="default">Sort: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="a-z">A - Z</option>
                  <option value="z-a">Z - A</option>
                  <option value="date-new">Newest First</option>
                  <option value="date-old">Oldest First</option>
                </select>
                <FaChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Mobile Sort */}
            <div className="lg:hidden mb-6">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3.5 text-sm"
              >
                <option value="default">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="a-z">A - Z</option>
                <option value="z-a">Z - A</option>
                <option value="date-new">Newest First</option>
                <option value="date-old">Oldest First</option>
              </select>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-zinc-900 rounded-3xl overflow-hidden">
                    <div className="aspect-square bg-zinc-800" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-zinc-800 rounded w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                {currentProducts.map((product) => {
                  const price = getProductPrice(product);
                  const mrp = getProductMRP(product);
                  const displayImage = product.images?.[0] || "/placeholder.png";

                  return (
                    <div
                      key={product.id}
                      className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/product-detail?id=${product.id}`)}
                    >
                      <div className="relative aspect-square bg-black flex items-center justify-center p-6 overflow-hidden">
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xl font-bold text-white">₹{price.toFixed(0)}</div>
                          {mrp > price && (
                            <div className="text-xs text-zinc-500 line-through">₹{mrp.toFixed(0)}</div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[42px] text-zinc-200 group-hover:text-white transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-4 text-amber-400">
                          <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
                          <span className="text-xs text-zinc-500 ml-2">(124)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-400">
                No products found in this category.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 border border-zinc-700 rounded-2xl hover:bg-zinc-900 disabled:opacity-40 transition-all"
                >
                  <FaChevronLeft />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`w-11 h-11 rounded-2xl font-medium transition-all ${
                      currentPage === page ? 'bg-white text-black' : 'border border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-3 border border-zinc-700 rounded-2xl hover:bg-zinc-900 disabled:opacity-40 transition-all"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Loading...
      </div>
    }>
      <CategoryContent />
    </Suspense>
  );
}