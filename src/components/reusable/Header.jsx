"use client";
import { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaShoppingCart,
  FaSearch,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { firebase } from "../../../Firebase/config";

export default function Header() {
  const router = useRouter();
  const db = firebase.firestore();

  // ================= STATE: AUTH & CART =================
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef();

  // ================= STATE: SEARCH ======================
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const searchRef = useRef(null);

  // ================= STATE: CATEGORIES =================
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ================= STATE: NAVIGATION & UI =================
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // NEW STATES FOR MOBILE ICONS
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userRef = useRef();

  // 1. Handle scroll detection for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Fetch Categories
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const catSnap = await db.collection("n3dcategories").get();
        const fetchedCategories = catSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const subSnap = await db.collection("n3dsubcategories").get();
        const fetchedSubcategories = subSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(fetchedCategories);
        setSubcategories(fetchedSubcategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategoriesData();
  }, [db]);

  // 2.1 Fetch Products for Search Suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prodSnap = await db.collection("n3dproducts").get(); // Adjust collection name if different
        const fetchedProducts = prodSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products for suggestions:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [db]);

  // 3. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 4. Real-time Cart Fetching
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoadingCart(true);
    const cartRefFirebase = db
      .collection("n3duser")
      .doc(user.uid)
      .collection("cart");
    const unsubscribe = cartRefFirebase
      .orderBy("addedAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
          });
          setCartItems(items);
          setLoadingCart(false);
        },
        (error) => {
          console.error("Error fetching cart items:", error);
          setLoadingCart(false);
        }
      );
    return () => unsubscribe();
  }, [user, db]);

  // 5. Close dropdowns when clicking/touching outside
  useEffect(() => {
    function handleClick(e) {
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setCartOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  // 6. Body Scroll Lock
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  // 7. Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = products
      .filter((product) =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
      .slice(0, 8); // Limit suggestions

    setSuggestions(filtered);
    setShowSuggestions(true);
  }, [searchQuery, products]);

  const subTotal = cartItems.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0
  );

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      setUserDropdownOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const updateQuantity = async (cartItemId, currentQty, change, maxStock) => {
    if (!user) return;
    const newQty = currentQty + change;
    if (newQty < 1) return;
    if (maxStock && newQty > maxStock) {
      alert("Cannot exceed available stock limit.");
      return;
    }
    try {
      await db
        .collection("n3duser")
        .doc(user.uid)
        .collection("cart")
        .doc(cartItemId)
        .update({
          quantity: newQty,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (cartItemId) => {
    if (!user) return;
    try {
      await db
        .collection("n3duser")
        .doc(user.uid)
        .collection("cart")
        .doc(cartItemId)
        .delete();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleMobileCatClick = (catId) => {
    setExpandedMobileCat((prev) => (prev === catId ? null : catId));
  };

  const handleCartClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      router.push("/cart/cart-page");
    } else {
      setCartOpen(!cartOpen);
    }
  };

  // 8. Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    router.push(`/product/${product.id}`); // Adjust route as per your product page structure
  };

  return (
    <>
      <header className="w-full z-[100] sticky top-0 flex flex-col font-sans drop-shadow-md">
       
        {/* ================= ROW 1: TOP UTILITY BAR (Desktop) ================= */}
        <div className="hidden lg:flex w-full items-center justify-between px-8 py-2 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
          <div className="flex items-center gap-6 text-[10px] font-black tracking-widest text-neutral-900 dark:text-white">
            <div className="flex items-center gap-2">
              <span className="text-red-600"><FaPhoneAlt size={10} /></span>
              <span>+91 9155242261</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600"><FaEnvelope size={10} /></span>
              <span>nagina3dprinter@gmail.com</span>
            </div>
          </div>
        </div>

        {/* ================= ROW 2: MAIN HEADER ================= */}
        <div className="w-full bg-black transition-all duration-300">
          <div className="max-w-[1500px] mx-auto flex items-center justify-between h-16 px-4 md:px-8 gap-4 lg:gap-8">
           
            {/* LEFT: LOGO & MOBILE TOGGLE */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                className="lg:hidden text-lg p-1 text-white hover:text-red-500 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars />
              </button>
              <div
                className="cursor-pointer flex items-center transition-transform active:scale-95 bg-white rounded-lg p-1"
                onClick={() => router.push("/")}
              >
                <img
                  src="/logo.webp"
                  alt="Logo"
                  className="object-contain h-8 w-auto md:h-10"
                />
              </div>
            </div>

            {/* CENTER: SEARCH BAR (Desktop) with Suggestions */}
            <div className="hidden md:flex flex-1 max-w-4xl mx-auto relative" ref={searchRef}>
              <form
                onSubmit={handleSearchSubmit}
                className="flex-1 h-10 bg-white rounded-xl overflow-hidden border-2 border-transparent focus-within:border-red-600 transition-all w-full"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setShowSuggestions(true);
                  }}
                  placeholder="SEARCH FOR PRODUCTS..."
                  className="flex-1 h-full px-4 outline-none text-black text-[10px] font-black uppercase tracking-widest w-full"
                />
                <button type="submit" className="absolute right-0 top-0 bg-red-600 hover:bg-red-700 transition-colors w-14 h-full flex items-center justify-center text-white text-sm">
                  <FaSearch />
                </button>
              </form>

              {/* Desktop Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-[110] max-h-[320px] overflow-auto py-2">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSuggestionClick(product)}
                      className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                    >
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded-lg border border-neutral-200"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        {product.price && (
                          <p className="text-xs text-red-600 font-black">₹{product.price}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: ICONS */}
            <div className="flex items-center gap-5 sm:gap-6 ml-auto shrink-0">
             
              {/* Mobile Search Toggle */}
              <button
                className="md:hidden text-white text-lg p-1 hover:text-red-500 transition-colors"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                <FaSearch />
              </button>

              {/* Login / User */}
              <div className="relative group cursor-pointer" ref={userRef}>
                <div
                  className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
                  onClick={() => {
                    if (user) setUserDropdownOpen(!userDropdownOpen);
                    else router.push("/login");
                  }}
                >
                  <div className="relative">
                    <FaUser size={16} />
                  </div>
                  <span className="hidden lg:flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      {user ? (user.phoneNumber || "MY ACCOUNT") : "LOGIN"}
                    </span>
                  </span>
                  <FaChevronDown size={10} className="hidden lg:block mt-0.5" />
                </div>
                {/* User Dropdown */}
                {user && (
                  <div className={`absolute right-0 top-[100%] mt-0 w-48 z-[110] ${userDropdownOpen ? 'block' : 'hidden group-hover:lg:block'}`}>
                    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-2 overflow-hidden">
                      <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 truncate">
                        {user.phoneNumber || "MY ACCOUNT"}
                      </div>
                      <a href="/orders" className="block px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                        ORDERS
                      </a>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      >
                        LOGOUT
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="relative" ref={cartRef}>
                <div
                  onClick={handleCartClick}
                  className="relative cursor-pointer text-white hover:text-red-500 transition-colors flex items-center"
                >
                  <FaShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black h-[16px] w-[16px] rounded-full flex items-center justify-center shadow-sm">
                    {cartItems.length}
                  </span>
                </div>
                {/* Cart Dropdown */}
                {cartOpen && (
                  <div className="hidden lg:block absolute right-0 mt-6 w-[320px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-2xl border border-neutral-200 dark:border-neutral-800 rounded-2xl z-[110] overflow-hidden">
                    <CartContent
                      cartItems={cartItems}
                      subTotal={subTotal}
                      loadingCart={loadingCart}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                      close={() => setCartOpen(false)}
                      router={router}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= ROW 3: CATEGORY NAV BAR ================= */}
        <div className="hidden lg:block w-full bg-neutral-900 border-t border-neutral-800">
          <div className="max-w-[1500px] mx-auto px-4 md:px-8 h-10 flex items-center">
            <ul className="flex items-center gap-6 xl:gap-8 text-[10px] font-black uppercase tracking-widest text-white w-full flex-wrap">
             
              {/* Dynamic Firebase Categories (Limit to 8) */}
              {!loadingCategories && categories.slice(0, 8).map((cat) => {
                const catSubs = subcategories.filter(
                  (sub) => sub.categoryId === cat.id
                );
               
                const isHomeKitchen = cat.name.toLowerCase().includes("home & kitchen");
                return (
                  <li
                    key={`desktop-${cat.id}`}
                    className="relative group h-10 flex items-center cursor-pointer whitespace-nowrap"
                    onMouseEnter={() => setOpenDesktopDropdown(cat.id)}
                    onMouseLeave={() => setOpenDesktopDropdown(null)}
                  >
                    <div className={`flex items-center gap-1.5 transition-colors px-2 py-1 rounded ${
                        isHomeKitchen ? "bg-red-600 text-white" : "hover:text-red-500"
                    }`}>
                      {cat.name}
                      {catSubs.length > 0 && (
                        <FaChevronDown
                          size={8}
                          className={`transition-transform duration-200 ${
                            openDesktopDropdown === cat.id ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                    {openDesktopDropdown === cat.id && catSubs.length > 0 && (
                      <div className="absolute top-[100%] left-0 z-[110] w-56 pt-2">
                        <div className="bg-white dark:bg-neutral-950 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800 py-2 overflow-hidden">
                          {catSubs.map((sub) => (
                            <p
                              key={`desktop-sub-${sub.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/subactegory?categoryId=${cat.id}&subcategoryId=${sub.id}&categoryName=${encodeURIComponent(cat.name)}&subcategoryName=${encodeURIComponent(sub.name)}`);
                                setOpenDesktopDropdown(null);
                              }}
                              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors"
                            >
                              {sub.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

              {/* 'More' Dropdown for remaining Categories (> 8) */}
              {!loadingCategories && categories.length > 8 && (
                <li className="relative group/more h-10 flex items-center cursor-pointer whitespace-nowrap">
                  <div className="flex items-center gap-1.5 transition-colors px-2 py-1 rounded hover:text-red-500 text-white">
                    MORE
                    <FaChevronDown
                      size={8}
                      className="transition-transform duration-200 group-hover/more:rotate-180"
                    />
                  </div>
                  {/* Dropdown 1: Remaining Categories */}
                  <div className="absolute top-[100%] right-0 z-[110] w-56 pt-2 hidden group-hover/more:block">
                    <div className="bg-white dark:bg-neutral-950 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800 py-2">
                     
                      {categories.slice(8).map((moreCat) => {
                        const moreCatSubs = subcategories.filter(
                          (sub) => sub.categoryId === moreCat.id
                        );
                        return (
                          <div key={`more-${moreCat.id}`} className="relative group/sub">
                            <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors flex justify-between items-center">
                              <span>{moreCat.name}</span>
                              {moreCatSubs.length > 0 && (
                                <FaChevronDown size={8} className="-rotate-90" />
                              )}
                            </div>
                            {/* Dropdown 2: Subcategories */}
                            {moreCatSubs.length > 0 && (
                              <div className="absolute top-0 right-full z-[111] w-56 pr-2 hidden group-hover/sub:block">
                                <div className="bg-white dark:bg-neutral-950 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800 py-2">
                                  {moreCatSubs.map((sub) => (
                                    <p
                                      key={`more-sub-${sub.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          `/subactegory?categoryId=${moreCat.id}&subcategoryId=${sub.id}&categoryName=${encodeURIComponent(
                                            moreCat.name
                                          )}&subcategoryName=${encodeURIComponent(
                                            sub.name
                                          )}`
                                        );
                                      }}
                                      className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white transition-colors"
                                    >
                                      {sub.name}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ================= MOBILE SEARCH BAR (Toggleable) with Suggestions ================= */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 bg-black ${
            mobileSearchOpen ? 'max-h-[400px] opacity-100 py-3 px-4 border-t border-neutral-800' : 'max-h-0 opacity-0 py-0 px-4'
          }`}
        >
          <div className="relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-xl overflow-hidden w-full h-11">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSuggestions(true);
                }}
                placeholder="SEARCH PRODUCTS..."
                className="flex-1 px-4 py-2 bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-black"
              />
              <button type="submit" className="bg-red-600 h-full w-12 flex items-center justify-center text-white">
                <FaSearch />
              </button>
            </form>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-[110] max-h-[280px] overflow-auto py-2">
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSuggestionClick(product)}
                    className="px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-contain rounded-lg border border-neutral-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      {product.price && (
                        <p className="text-xs text-red-600 font-black">₹{product.price}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MOBILE CATEGORIES SIDEBAR ================= */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white z-[120] transform transition-transform duration-300 shadow-2xl flex flex-col border-r border-neutral-200 dark:border-neutral-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 font-black uppercase tracking-widest text-xs flex justify-end items-center shrink-0 border-b border-neutral-200 dark:border-neutral-800">
          <button
            className="text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white text-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
          {loadingCategories ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black dark:border-white"></div>
            </div>
          ) : (
            <ul className="text-[10px] font-black uppercase tracking-widest">
              <li
                className="border-b border-neutral-100 dark:border-neutral-800 px-5 py-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                onClick={() => { router.push('/'); setSidebarOpen(false); }}
              >
                HOME
              </li>
              {categories.length > 0 ? (
                categories.map((cat) => {
                  const catSubs = subcategories.filter(
                    (sub) => sub.categoryId === cat.id
                  );
                  const isExpanded = expandedMobileCat === cat.id;
                  return (
                    <li key={`mobile-${cat.id}`} className="border-b border-neutral-100 dark:border-neutral-800 flex flex-col">
                      <div
                        onClick={() => handleMobileCatClick(cat.id)}
                        className={`px-5 py-4 cursor-pointer transition-colors flex items-center justify-between ${
                          isExpanded
                            ? "bg-neutral-50 dark:bg-neutral-900 text-black dark:text-white"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {catSubs.length > 0 && (
                          <FaChevronDown
                            size={10}
                            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-black dark:text-white' : ''}`}
                          />
                        )}
                      </div>
                      {catSubs.length > 0 && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out bg-neutral-50/50 dark:bg-neutral-950 ${
                            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <ul className="py-2 border-t border-neutral-100 dark:border-neutral-800">
                            {catSubs.map((sub) => (
                              <li
                                key={`mobile-sub-${sub.id}`}
                                onClick={() => {
                                  router.push(`/subactegory?categoryId=${cat.id}&subcategoryId=${sub.id}&categoryName=${encodeURIComponent(cat.name)}&subcategoryName=${encodeURIComponent(sub.name)}`);
                                  setSidebarOpen(false);
                                }}
                                className="px-8 py-3 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                                {sub.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="px-5 py-6 text-neutral-400 italic text-center">
                  NO CATEGORIES
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[110] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

/* ================= CART CONTENT COMPONENT ================= */
function CartContent({
  cartItems,
  subTotal,
  loadingCart,
  updateQuantity,
  removeItem,
  close,
  router,
}) {
  if (loadingCart) {
    return (
      <div className="p-8 text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest h-full flex items-center justify-center">
        LOADING CART...
      </div>
    );
  }
  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
        <div className="text-4xl mb-3 opacity-30">🛒</div>
        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">YOUR CART IS EMPTY</p>
        <button
          onClick={close}
          className="mt-6 bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          CONTINUE SHOPPING
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      <div className="p-4 space-y-4 overflow-y-auto max-h-[55vh] flex-1 hide-scrollbar">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex gap-3 items-center w-full pr-2">
              <img
                src={item.image || "/placeholder.png"}
                className="w-14 h-14 object-contain rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-1"
                alt={item.productName}
              />
              <div className="flex-1">
                <p className="font-bold text-xs text-neutral-900 dark:text-white line-clamp-1">
                  {item.productName}
                </p>
                {item.variant?.optionValue && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-1">
                    {item.variant.optionValue}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border-2 border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden h-6">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity, -1, item.variant?.stock)
                      }
                      className="px-2 h-full bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="px-2 text-[10px] font-black text-neutral-900 dark:text-white border-x-2 border-neutral-200 dark:border-neutral-700 h-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity, 1, item.variant?.stock)
                      }
                      className="px-2 h-full bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
                      disabled={item.variant?.stock && item.quantity >= item.variant.stock}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-black text-sm text-neutral-900 dark:text-white">₹{item.price}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-neutral-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1"
            >
              <FaTimes size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800 mt-auto shrink-0">
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            <span>SUBTOTAL</span>
            <span className="text-neutral-900 dark:text-white">
              ₹{subTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-black text-base text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <span className="uppercase tracking-widest text-[10px] self-end pb-1">TOTAL</span>
            <span className="text-red-600">₹{subTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="px-4 pb-4">
          <a
           href="/cart/Cart-page"
            className="w-full bg-black px-4 pb-4 cursor-pointer text-white dark:bg-white dark:text-black font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-[10px] shadow-sm"
          >
            VIEW CART / CHECKOUT
          </a>
        </div>
      </div>
    </div>
  );
}