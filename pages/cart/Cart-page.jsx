"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../../Firebase/config'; // Adjust path if needed
import { useRouter } from "next/navigation";
import { 
  FaTrash, 
  FaPlus, 
  FaEdit, 
  FaTimes, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaArrowLeft,
  FaShoppingCart
} from "react-icons/fa";

// List of Indian States and UTs
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

export default function CartPage() {
  const router = useRouter();
  
  // Auth & Cart State
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Local state to manage live typing for resell prices
  const [resellInputs, setResellInputs] = useState({});

  // Address States
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null); 

  const initialAddressState = {
    name: "",
    mobile: "",
    houseNo: "",
    roadName: "",
    pincode: "",
    city: "",
    state: "",
    landmark: "",
  };
  const [addressForm, setAddressForm] = useState(initialAddressState);

  const db = firebase.firestore();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const cartRef = db.collection('n3duser').doc(user.uid).collection('cart');
    const unsubscribeCart = cartRef.orderBy('addedAt', 'desc').onSnapshot((snapshot) => {
      const items = [];
      const initialResellState = { ...resellInputs };

      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({ id: doc.id, ...data });
        
        if (initialResellState[doc.id] === undefined) {
          initialResellState[doc.id] = data.userResellPrice || data.price;
        }
      });

      setCartItems(items);
      setResellInputs(initialResellState);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cart items:", error);
      setLoading(false);
    });

    const addressRef = db.collection('n3duser').doc(user.uid).collection('addresses');
    const unsubscribeAddresses = addressRef.orderBy('updatedAt', 'desc').onSnapshot((snapshot) => {
      const addrs = [];
      snapshot.forEach((doc) => {
        addrs.push({ id: doc.id, ...doc.data() });
      });
      setSavedAddresses(addrs);
      
      if (addrs.length > 0 && !selectedAddress) {
        setSelectedAddress(addrs[0]);
      } else if (addrs.length === 0) {
        setSelectedAddress(null);
      }
    });

    return () => {
      unsubscribeCart();
      unsubscribeAddresses();
    };
  }, [user, selectedAddress]);

  const updateQuantity = async (cartItemId, currentQty, change, maxStock) => {
    const newQty = currentQty + change;
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

  const removeItem = async (cartItemId) => {
    if (window.confirm("Remove this item from your cart?")) {
      try {
        await db.collection('n3duser').doc(user.uid).collection('cart').doc(cartItemId).delete();
      } catch (error) {
        console.error("Error removing item:", error);
      }
    }
  };

  const handleAddressChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (isEditingId) {
        await db.collection('n3duser').doc(user.uid).collection('addresses').doc(isEditingId).update({
          ...addressForm,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (selectedAddress?.id === isEditingId) {
           setSelectedAddress({ id: isEditingId, ...addressForm });
        }
      } else {
        const docRef = await db.collection('n3duser').doc(user.uid).collection('addresses').add({
          ...addressForm,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const newSavedAddress = { id: docRef.id, ...addressForm };
        setSelectedAddress(newSavedAddress);
      }

      setIsAddingNew(false);
      setIsEditingId(null);
      setAddressForm(initialAddressState); 
      setIsSidebarOpen(false); 
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address. Please try again.");
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setIsSidebarOpen(false);
  };

  const openAddressSidebar = () => {
    setIsSidebarOpen(true);
    setAddressForm(initialAddressState);
    setIsEditingId(null);
    setIsAddingNew(savedAddresses.length === 0);
  };

  const handleEditAddress = (e, address) => {
    e.stopPropagation(); 
    setAddressForm({
      name: address.name || "",
      mobile: address.mobile || "",
      houseNo: address.houseNo || "",
      roadName: address.roadName || "",
      pincode: address.pincode || "",
      city: address.city || "",
      state: address.state || "",
      landmark: address.landmark || "",
    });
    setIsEditingId(address.id);
    setIsAddingNew(true);
  };

  const handleSidebarBack = () => {
    setIsAddingNew(false);
    setIsEditingId(null);
    setAddressForm(initialAddressState);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (!selectedAddress || !selectedAddress.id) {
      alert("Please select or add a delivery address before proceeding.");
      openAddressSidebar();
      return;
    }
    
    localStorage.setItem('selectedCheckoutAddressId', selectedAddress.id);
    router.push('/cart/Check-out');
  };

  const subTotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const totalTax = subTotal * 0.18; 
  const grandTotal = subTotal + totalTax;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-white text-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] max-w-6xl mx-auto p-10 text-center bg-white text-black font-sans">
        <div className="bg-neutral-50 p-10 rounded-3xl border border-neutral-200 max-w-md w-full shadow-sm">
          <FaShoppingCart className="mx-auto text-5xl text-neutral-300 mb-6" />
          <h2 className="text-2xl font-black mb-3 text-black uppercase tracking-wide">Sign in to view cart</h2>
          <p className="text-neutral-500 mb-8 text-sm">Please log in to access your saved items and continue shopping.</p>
          <button onClick={() => router.push('/login')} className="w-full bg-black text-white font-black tracking-widest uppercase py-4 rounded-xl hover:bg-neutral-800 transition-colors text-sm shadow-lg">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden font-sans">
      <div className="max-w-[1250px] mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-neutral-100 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase tracking-tight">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-neutral-500 font-medium tracking-wide">
            Review your items and complete your purchase.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-neutral-50 rounded-3xl border border-neutral-200 p-16 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="bg-white p-6 rounded-full mb-6 border border-neutral-200 shadow-sm">
              <FaShoppingCart className="text-5xl text-neutral-300" />
            </div>
            <h3 className="text-xl font-black text-black mb-2 uppercase tracking-wide">Your cart is empty</h3>
            <p className="text-neutral-500 mb-8 max-w-md text-sm">Looks like you haven't added anything to your cart yet. Let's find something special.</p>
            <button onClick={() => router.push('/')} className="bg-black text-white font-black tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-neutral-800 transition-colors shadow-lg text-sm">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            
            {/* LEFT COLUMN: CART ITEMS */}
            <div className="lg:w-2/3 flex flex-col gap-6">
              <div className="bg-neutral-50 rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-neutral-500 text-xs font-bold uppercase tracking-widest border-b border-neutral-200">
                      <tr>
                        <th className="p-5">Product Detail</th>
                        <th className="p-5 text-center">Quantity</th>
                        <th className="p-5 text-right">Price</th>
                        <th className="p-5 text-right">Total</th>
                        <th className="p-5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-100 transition-colors">
                          {/* PRODUCT INFO */}
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                                <img src={item.image || "/placeholder.png"} className="h-full w-full object-contain p-2 mix-blend-multiply" alt={item.productName} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-black text-base line-clamp-2">{item.productName}</span>
                                {item.variant?.optionValue && (
                                  <span className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-wider">Variant: {item.variant.optionValue}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* QUANTITY */}
                          <td className="p-5">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center border-2 border-neutral-200 rounded-xl bg-transparent h-10 w-28 overflow-hidden">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity, -1, item.variant?.stock)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 font-medium"
                                >−</button>
                                <span className="flex-1 text-center font-bold text-sm text-black border-x-2 border-neutral-200">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity, 1, item.variant?.stock)}
                                  disabled={item.variant?.stock && item.quantity >= item.variant.stock}
                                  className="w-8 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 font-medium"
                                >+</button>
                              </div>
                            </div>
                          </td>

                          {/* BASE PRICE */}
                          <td className="p-5 text-right font-bold text-neutral-600">
                            ₹{item.price}
                          </td>

                          {/* TOTAL */}
                          <td className="p-5 text-right font-black text-black text-lg">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                          
                          {/* ACTION */}
                          <td className="p-5 text-center">
                            <button 
                              onClick={() => removeItem(item.id)} 
                              className="text-neutral-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Remove Item"
                            >
                              <FaTrash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ADDRESS & SUMMARY */}
            <div className="lg:w-1/3 flex flex-col gap-6">
              
              {/* DELIVERY ADDRESS */}
              <div className="bg-neutral-50 rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center bg-white">
                  <h3 className="font-black text-black text-base uppercase tracking-wider">Delivery Address</h3>
                  {savedAddresses.length > 0 && (
                     <button onClick={openAddressSidebar} className="text-black text-xs font-bold uppercase tracking-widest hover:underline transition-all">
                       Change
                     </button>
                  )}
                </div>
                
                <div className="p-6">
                  {selectedAddress ? (
                    <div className="flex items-start gap-4">
                      <div className="bg-white border border-neutral-200 p-3 rounded-full text-black mt-1 flex-shrink-0 shadow-sm">
                        <FaMapMarkerAlt size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-bold text-black text-base">{selectedAddress.name}</p>
                          <span className="text-xs font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-1 rounded-md">{selectedAddress.mobile}</span>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {selectedAddress.houseNo}, {selectedAddress.roadName} <br/>
                          {selectedAddress.city}, {selectedAddress.state} - <span className="font-bold text-black">{selectedAddress.pincode}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-neutral-300 rounded-2xl bg-white">
                      <p className="text-neutral-500 mb-4 text-sm font-medium">No delivery address selected.</p>
                      <button onClick={openAddressSidebar} className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest transition-colors text-xs shadow-md">
                        <FaPlus size={12} /> Add Address
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ORDER SUMMARY */}
              <div className="bg-neutral-50 rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-neutral-200 bg-white">
                  <h3 className="font-black text-black text-base uppercase tracking-wider">Order Summary</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-neutral-600 text-sm font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-black">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 text-sm font-medium">
                    <span>Estimated Tax (18%)</span>
                    <span className="font-bold text-black">₹{totalTax.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-200 flex justify-between items-end">
                    <span className="text-base font-black text-black uppercase tracking-wider">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-red-600">₹{grandTotal.toFixed(2)}</span>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Includes all taxes</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white border-t border-neutral-200 space-y-3">
                  <button 
                    onClick={handleCheckout} 
                    className="w-full h-14 bg-red-600 text-white text-sm font-black tracking-widest uppercase rounded-xl hover:bg-red-700 transition-all flex items-center justify-center shadow-lg"
                  >
                    Proceed to Checkout
                  </button>
                  <button 
                    onClick={() => router.push('/')}
                    className="w-full h-14 bg-transparent border-2 border-neutral-200 text-black text-sm font-black tracking-widest uppercase rounded-xl hover:border-black transition-all flex items-center justify-center"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ADDRESS SIDEBAR (Modern Overlay Panel) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[999] flex justify-end">
            
            {/* Dark Overlay (Left intact as it's just a shadow overlay, not part of dark mode styling) */}
            <div 
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsSidebarOpen(false)}
            ></div>
            
            {/* Sidebar Panel */}
            <div 
              className="relative w-full sm:w-[450px] bg-white border-l border-neutral-200 h-full shadow-2xl flex flex-col z-10"
              style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
              <style>{`
                @keyframes slideInRight {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
              `}</style>

              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3">
                  {/* BACK BUTTON */}
                  {isAddingNew && savedAddresses.length > 0 && (
                    <button 
                      onClick={handleSidebarBack}
                      className="p-2 -ml-2 text-neutral-500 hover:text-black hover:bg-neutral-200 rounded-full transition-colors"
                      title="Back to saved addresses"
                    >
                      <FaArrowLeft size={16} />
                    </button>
                  )}
                  <h3 className="text-lg font-black text-black uppercase tracking-wider">
                    {isAddingNew ? (isEditingId ? "Edit Address" : "Add New Address") : "Delivery Address"}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-neutral-400 hover:text-black bg-white border border-neutral-200 hover:border-black rounded-full transition-colors shadow-sm"
                  title="Close"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Sidebar Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar bg-white">
                
                {!isAddingNew ? (
                  <>
                    <button 
                      onClick={() => {
                        setAddressForm(initialAddressState);
                        setIsEditingId(null);
                        setIsAddingNew(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-300 rounded-2xl text-black hover:bg-neutral-50 hover:border-black transition-colors font-bold uppercase tracking-widest text-xs shadow-sm"
                    >
                      <FaPlus size={12} /> Add a New Address
                    </button>

                    <div className="mt-8 space-y-4">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddress?.id === addr.id;
                        return (
                          <div 
                            key={addr.id} 
                            onClick={() => handleSelectAddress(addr)}
                            className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all group ${
                              isSelected 
                                ? "border-black bg-neutral-50 shadow-md scale-[1.02]" 
                                : "border-neutral-200 bg-white hover:border-black"
                            }`}
                          >
                            {isSelected && (
                              <FaCheckCircle className="absolute top-5 right-5 text-black" size={20} />
                            )}
                            
                            <div className="flex justify-between items-start mb-2 pr-8">
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-black text-base">
                                  {addr.name}
                                </p>
                                <span className="text-xs font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  {addr.mobile}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-neutral-600 leading-relaxed mt-2 pr-8">
                              {addr.houseNo}, {addr.roadName} <br/>
                              {addr.city}, {addr.state} - <span className="font-bold text-black">{addr.pincode}</span>
                            </p>

                            {/* Edit Button - Visible on hover or when selected */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleEditAddress(e, addr)}
                                className="text-neutral-600 hover:text-black p-2.5 bg-white shadow-sm border border-neutral-200 hover:border-black rounded-xl transition-colors"
                                title="Edit Address"
                              >
                                <FaEdit size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Add / Edit Address Form */
                  <form id="address-form" onSubmit={handleSaveAddress} className="space-y-6">
                    
                    {/* Contact Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest">Contact Info</h4>
                      <div>
                        <input required type="text" name="name" value={addressForm.name} onChange={handleAddressChange} placeholder="Full Name" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                      </div>
                      <div>
                        <input required type="tel" name="mobile" value={addressForm.mobile} onChange={handleAddressChange} placeholder="Mobile Number" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                      </div>
                    </div>
                    
                    <hr className="border-t border-neutral-200" />
                    
                    {/* Location Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest">Location</h4>
                      <div>
                        <input required type="text" name="houseNo" value={addressForm.houseNo} onChange={handleAddressChange} placeholder="House No / Building Name" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                      </div>
                      <div>
                        <input required type="text" name="roadName" value={addressForm.roadName} onChange={handleAddressChange} placeholder="Road Name / Area / Colony" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="number" name="pincode" value={addressForm.pincode} onChange={handleAddressChange} placeholder="Pincode" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                        <input required type="text" name="city" value={addressForm.city} onChange={handleAddressChange} placeholder="City" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                      </div>

                      <div>
                        <select 
                          required 
                          name="state" 
                          value={addressForm.state} 
                          onChange={handleAddressChange} 
                          className={`w-full bg-white border border-neutral-200 text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm ${addressForm.state === "" ? "text-neutral-400" : "text-black"}`}
                        >
                          <option value="" disabled>Select State</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state} className="text-black">{state}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input type="text" name="landmark" value={addressForm.landmark} onChange={handleAddressChange} placeholder="Nearby Landmark (Optional)" className="w-full bg-white border border-neutral-200 text-black text-sm rounded-xl focus:ring-2 focus:ring-black focus:border-transparent block p-4 outline-none transition-all shadow-sm" />
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex gap-4">
                {isAddingNew ? (
                  <>
                    {savedAddresses.length > 0 && (
                      <button 
                        onClick={handleSidebarBack} 
                        className="flex-1 py-4 bg-transparent border-2 border-neutral-200 hover:border-black rounded-xl text-black font-black uppercase tracking-widest text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      type="submit" 
                      form="address-form" 
                      className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-neutral-800 transition-colors"
                    >
                      {isEditingId ? "Update" : "Save"}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg hover:bg-neutral-800 transition-colors"
                  >
                    Use this Address
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}