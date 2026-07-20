"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaShoppingCart,
  FaSearch,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { firebase } from '../../../Firebase/config';

export default function Header({ setSidebarOpen }) {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef();
  
  // State
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);

  const db = firebase.firestore();

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Cart Fetching for Current User
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setLoadingCart(true);
    const cartRefFirebase = db.collection('n3duser').doc(user.uid).collection('cart');
    
    // onSnapshot gives us real-time updates automatically
    const unsubscribe = cartRefFirebase.orderBy('addedAt', 'desc').onSnapshot((snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCartItems(items);
      setLoadingCart(false);
    }, (error) => {
      console.error("Error fetching cart items:", error);
      setLoadingCart(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Close cart when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Calculate dynamic subtotal
  const subTotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) * Number(item.quantity)),
    0
  );

  // Logout function
  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      router.push('/'); 
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // 4. Update Quantity Function
  const updateQuantity = async (cartItemId, currentQty, change, maxStock) => {
    if (!user) return;
    const newQty = currentQty + change;
    
    // Prevent going below 1 or above available stock
    if (newQty < 1) return; 
    if (maxStock && newQty > maxStock) {
      alert("Cannot exceed available stock limit.");
      return;
    }

    try {
      await db.collection('n3duser').doc(user.uid).collection('cart').doc(cartItemId).update({
        quantity: newQty,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // 5. Remove Item Function
  const removeItem = async (cartItemId) => {
    if (!user) return;
    try {
      await db.collection('n3duser').doc(user.uid).collection('cart').doc(cartItemId).delete();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  return (
    <div className="w-full text-white relative z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-12 px-4 bg-[#222]">
        
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-xl"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>
        </div>

        {/* SEARCH */}
        <div className="flex items-center bg-white text-black rounded overflow-hidden w-full md:w-[40%] mx-3">
          <input
            type="text"
            placeholder="Search"
            className="flex-1 px-2 py-2 outline-none text-sm"
          />
          <button className="bg-red-500 px-3 py-2 text-white">
            <FaSearch />
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center gap-4 text-sm relative">
          
          {/* USER LOGIN / PROFILE DROPDOWN */}
          {user ? (
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-1 border px-2 py-1 rounded-xl text-white">
                <FaUser className="text-white" />
              </div>

              <div className="absolute right-0 pt-2 w-48 hidden group-hover:block z-50">
                <div className="bg-white text-black rounded-md shadow-lg py-2 border">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">
                    {user.phoneNumber || 'My Account'}
                  </div>
                  <a href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                    Profile
                  </a>
                  <a href="/orders" className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                    Orders
                  </a>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <a href="/login" className="flex items-center gap-1 cursor-pointer border px-2 py-1 rounded-xl text-white">
              <FaUser className="text-white" />
              Login
            </a>
          )}

          {/* CART BUTTON */}
          <div className="relative" ref={cartRef}>
            <div
              onClick={() => setCartOpen(!cartOpen)}
              className="flex items-center gap-1 border py-1 px-2 rounded-xl text-white justify-center cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <div className="relative">
                <FaShoppingCart />
                {/* Cart Item Badge */}
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span className="ml-1">Cart</span>
            </div>

            {/* ================= DESKTOP DROPDOWN ================= */}
            {cartOpen && (
              <div className="hidden md:block absolute right-0 mt-3 w-80 bg-white text-black shadow-2xl border rounded-lg z-50 overflow-hidden">
                <CartContent
                  cartItems={cartItems}
                  subTotal={subTotal}
                  loadingCart={loadingCart}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  close={() => setCartOpen(false)}
                />
              </div>
            )}

            {/* ================= MOBILE SLIDE PANEL ================= */}
            <div
              className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white text-black z-50 transform transition-transform duration-300 md:hidden shadow-2xl flex flex-col ${
                cartOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <h3 className="font-bold text-gray-800 tracking-wider">MY CART</h3>
                <FaTimes
                  className="cursor-pointer text-gray-500 hover:text-red-500 text-lg transition-colors"
                  onClick={() => setCartOpen(false)}
                />
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <CartContent
                  cartItems={cartItems}
                  subTotal={subTotal}
                  loadingCart={loadingCart}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  close={() => setCartOpen(false)}
                />
              </div>
            </div>

            {/* BACKDROP FOR MOBILE */}
            {cartOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setCartOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= CART CONTENT COMPONENT ================= */
function CartContent({ cartItems, subTotal, loadingCart, updateQuantity, removeItem, close }) {
  const router = useRouter();

  if (loadingCart) {
    return <div className="p-8 text-center text-gray-500 text-sm">Loading cart...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <div className="text-4xl mb-3 text-gray-300">🛒</div>
        <p className="text-gray-500 font-medium">Your cart is currently empty.</p>
        <button onClick={close} className="mt-4 text-indigo-600 font-semibold text-sm hover:underline">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ITEMS LIST */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh] flex-1">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
            
            <div className="flex gap-3 items-center w-full pr-2">
              {/* Product Image */}
              <img
                src={item.image || '/placeholder.png'}
                className="w-16 h-16 object-cover rounded border"
                alt={item.productName}
              />
              
              {/* Product Details & Qty Controls */}
              <div className="text-sm flex-1">
                <p className="font-bold text-gray-800 line-clamp-1">{item.productName}</p>
                <p className="text-xs text-gray-500 mt-0.5">Variant: {item.variant?.optionValue}</p>
                
                <div className="flex items-center justify-between mt-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 rounded">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity, -1, item.variant?.stock)}
                      className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity, 1, item.variant?.stock)}
                      className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      disabled={item.variant?.stock && item.quantity >= item.variant.stock}
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <span className="font-bold text-red-500">₹{item.price}</span>
                </div>
              </div>
            </div>

            {/* Remove Item Button */}
            <button 
              onClick={() => removeItem(item.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Remove item"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* TOTALS & BUTTONS */}
      <div className="bg-gray-50 border-t mt-auto">
        <div className="px-5 py-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Sub-Total</span>
            <span className="font-semibold text-gray-900">₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200 mt-2">
            <span>TOTAL</span>
            <span className="text-red-500">₹{subTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 p-4 pt-0 mt-2">
          <button
            onClick={() => {
              close();
              router.push("/cart/Cart-page");
            }}
            className="flex-1 bg-gray-200 text-gray-800 font-bold py-2.5 rounded hover:bg-gray-300 transition-colors text-xs tracking-wider"
          >
            VIEW CART
          </button>
          <button
            onClick={() => {
              close();
              router.push("/cart/Check-out");
            }}
            className="flex-1 bg-gray-900 text-white font-bold py-2.5 rounded hover:bg-red-500 transition-colors text-xs tracking-wider"
          >
            CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
}