"use client";
import React, { useState, useEffect, useRef } from "react";
import { firebase } from '../../Firebase/config';
import { useRouter } from "next/navigation";
import {
  FaTrash,
  FaPlus,
  FaEdit,
  FaTimes,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaShoppingCart,
  FaMapMarkedAlt
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
  const [resellInputs, setResellInputs] = useState({});
  
  // Store the default fetched mobile to prevent it from being permanently wiped out on form reset
  const [defaultMobile, setDefaultMobile] = useState(""); 

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
    lat: null,
    lng: null,
    formattedAddress: ""
  };

  const [addressForm, setAddressForm] = useState(initialAddressState);

  // Google Maps Autocomplete
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const autocompleteRef = useRef(null);
  const autoCompleteInputRef = useRef(null);

  const db = firebase.firestore();

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === 'undefined' || window.google) {
      setGoogleLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBXUA8zAYs8WHNYe0-M-h1WvRHbncj1r0g&libraries=places`; // ← Replace with your actual Google Maps API Key
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Initialize Google Autocomplete
  useEffect(() => {
    if (!googleLoaded || !isAddingNew || !autoCompleteInputRef.current) return;
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autoCompleteInputRef.current,
        {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const addressComponents = place.address_components;
        let houseNo = '';
        let roadName = '';
        let city = '';
        let state = '';
        let pincode = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number') || types.includes('premise')) houseNo = component.long_name;
          if (types.includes('route') || types.includes('sublocality')) roadName = component.long_name;
          if (types.includes('locality') || types.includes('sublocality_level_1')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.long_name;
          if (types.includes('postal_code')) pincode = component.long_name;
        });

        if (!city && place.formatted_address) {
          const parts = place.formatted_address.split(',');
          city = parts[parts.length - 3]?.trim() || '';
        }

        setAddressForm(prev => ({
          ...prev,
          houseNo: houseNo || prev.houseNo,
          roadName: roadName || place.name || prev.roadName,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pincode || prev.pincode,
          formattedAddress: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }));
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.error("Google Autocomplete init failed:", err);
    }
  }, [googleLoaded, isAddingNew]);

  useEffect(() => {
    const unsubscribeAuth = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const authMobile = currentUser.phoneNumber || "";

      // 1. Try to fetch mobile from n3duser collection (priority)
      const userDocRef = db.collection('n3duser').doc(currentUser.uid);
      const unsubscribeUserDoc = userDocRef.onSnapshot((doc) => {
        let fetchedMobile = authMobile;
        
        if (doc.exists) {
          const userData = doc.data();
          fetchedMobile = userData.mobileNumber || userData.phoneNumber || authMobile;
        }

        // Store it so we don't lose it on form reset
        setDefaultMobile(fetchedMobile);

        // Only inject into the form if the form's mobile is currently empty.
        setAddressForm(prev => {
          if (!prev.mobile) {
            return { ...prev, mobile: fetchedMobile };
          }
          return prev;
        });
      });

      return () => unsubscribeUserDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  // Cart + Addresses Listener
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
  }, [user]);

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
    if (!addressForm.name || !addressForm.mobile || !addressForm.houseNo || !addressForm.roadName ||
        !addressForm.pincode || !addressForm.city || !addressForm.state) {
      alert("Please fill all required fields");
      return;
    }
    try {
      const addressData = {
        ...addressForm,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
     
      // =========================================================================================

      if (isEditingId) {
        await db.collection('n3duser').doc(user.uid).collection('addresses').doc(isEditingId).update(addressData);
        if (selectedAddress?.id === isEditingId) {
          setSelectedAddress({ id: isEditingId, ...addressData });
        }
      } else {
        const docRef = await db.collection('n3duser').doc(user.uid).collection('addresses').add(addressData);
        const newSavedAddress = { id: docRef.id, ...addressData };
        setSelectedAddress(newSavedAddress);
      }
      setIsAddingNew(false);
      setIsEditingId(null);
      
      // When resetting form, maintain the updated default mobile number
      setAddressForm({ ...initialAddressState, mobile: addressForm.mobile });
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
    // Ensure default mobile is kept when opening the sidebar for a new address
    setAddressForm({ ...initialAddressState, mobile: defaultMobile });
    setIsEditingId(null);
    setIsAddingNew(savedAddresses.length === 0);
  };

  const handleEditAddress = (e, address) => {
    e.stopPropagation();
    setAddressForm({
      name: address.name || "",
      mobile: address.mobile || "", // Uses the specific saved mobile for this address
      houseNo: address.houseNo || "",
      roadName: address.roadName || "",
      pincode: address.pincode || "",
      city: address.city || "",
      state: address.state || "",
      landmark: address.landmark || "",
      lat: address.lat || null,
      lng: address.lng || null,
      formattedAddress: address.formattedAddress || ""
    });
    setIsEditingId(address.id);
    setIsAddingNew(true);
  };

  const handleSidebarBack = () => {
    setIsAddingNew(false);
    setIsEditingId(null);
    // Keep default mobile when going back
    setAddressForm({ ...initialAddressState, mobile: defaultMobile });
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

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="bg-black min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-[1250px] mx-auto animate-pulse">
          <div className="mb-8 border-b border-neutral-800 pb-6">
            <div className="h-10 bg-neutral-800 w-64 rounded mb-4"></div>
            <div className="h-4 bg-neutral-800 w-96 rounded"></div>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <div className="lg:w-2/3 flex flex-col gap-6">
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden p-6">
                <div className="h-6 bg-neutral-800 w-full rounded mb-8"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center gap-4 mb-6 border-b border-neutral-800 pb-6 last:border-0 last:pb-0">
                    <div className="h-20 w-20 bg-neutral-800 rounded-2xl flex-shrink-0"></div>
                    <div className="flex-1 w-full space-y-3">
                      <div className="h-5 bg-neutral-800 w-3/4 rounded"></div>
                      <div className="h-4 bg-neutral-800 w-1/4 rounded"></div>
                    </div>
                    <div className="w-28 h-10 bg-neutral-800 rounded-xl"></div>
                    <div className="w-20 h-6 bg-neutral-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/3 flex flex-col gap-6">
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden p-6">
                <div className="h-6 bg-neutral-800 w-1/2 rounded mb-6"></div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 bg-neutral-800 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-neutral-800 w-3/4 rounded"></div>
                    <div className="h-4 bg-neutral-800 w-full rounded"></div>
                    <div className="h-4 bg-neutral-800 w-1/2 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden p-6">
                <div className="h-6 bg-neutral-800 w-1/2 rounded mb-6"></div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <div className="h-4 bg-neutral-800 w-1/3 rounded"></div>
                    <div className="h-4 bg-neutral-800 w-1/4 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-neutral-800 w-1/3 rounded"></div>
                    <div className="h-4 bg-neutral-800 w-1/4 rounded"></div>
                  </div>
                </div>
                <div className="pt-6 border-t border-neutral-800 flex justify-between items-end mb-6">
                  <div className="h-6 bg-neutral-800 w-1/4 rounded"></div>
                  <div className="h-8 bg-neutral-800 w-1/3 rounded"></div>
                </div>
                <div className="h-14 bg-neutral-800 w-full rounded-xl mb-3"></div>
                <div className="h-14 bg-neutral-800 w-full rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN STATE
  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] max-w-6xl mx-auto p-10 text-center bg-black text-white font-sans">
        <div className="bg-neutral-900 p-10 rounded-3xl border border-neutral-800 max-w-md w-full shadow-2xl">
          <FaShoppingCart className="mx-auto text-5xl text-neutral-600 mb-6" />
          <h2 className="text-2xl font-black mb-3 text-white uppercase tracking-wide">Sign in to view cart</h2>
          <p className="text-neutral-400 mb-8 text-sm">Please log in to access your saved items and continue shopping.</p>
          <button onClick={() => router.push('/login')} className="w-full bg-white text-black font-black tracking-widest uppercase py-4 rounded-xl hover:bg-neutral-200 transition-colors text-sm">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden font-sans">
      <div className="max-w-[1250px] mx-auto">
        {/* HEADER */}
        <div className="mb-8 border-b border-neutral-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-neutral-400 font-medium tracking-wide">
            Review your items and complete your purchase.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-16 text-center flex flex-col items-center justify-center">
            <div className="bg-black p-6 rounded-full mb-6 border border-neutral-800">
              <FaShoppingCart className="text-5xl text-neutral-600" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Your cart is empty</h3>
            <p className="text-neutral-400 mb-8 max-w-md text-sm">Looks like you haven't added anything to your cart yet. Let's find something special.</p>
            <button onClick={() => router.push('/')} className="bg-white text-black font-black tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-neutral-200 transition-colors text-sm">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* LEFT COLUMN: CART ITEMS */}
            <div className="lg:w-2/3 flex flex-col gap-6">
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-neutral-900 text-neutral-400 text-xs font-bold uppercase tracking-widest border-b border-neutral-800">
                      <tr>
                        <th className="p-5">Product Detail</th>
                        <th className="p-5 text-center">Quantity</th>
                        <th className="p-5 text-right">Price</th>
                        <th className="p-5 text-right">Total</th>
                        <th className="p-5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-neutral-800 bg-white">
                                <img src={item.image || "/placeholder.png"} className="h-full w-full object-contain p-2" alt={item.productName} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-base line-clamp-2">{item.productName}</span>
                                {item.variant?.optionValue && (
                                  <span className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-wider">Variant: {item.variant.optionValue}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center border-2 border-neutral-700 rounded-xl bg-black h-10 w-28 overflow-hidden">
                                <button onClick={() => updateQuantity(item.id, item.quantity, -1, item.variant?.stock)} disabled={item.quantity <= 1} className="w-8 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 font-medium">−</button>
                                <span className="flex-1 text-center font-bold text-sm text-white border-x-2 border-neutral-700">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity, 1, item.variant?.stock)} disabled={item.variant?.stock && item.quantity >= item.variant.stock} className="w-8 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 font-medium">+</button>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-right font-bold text-neutral-400">₹{item.price}</td>
                          <td className="p-5 text-right font-black text-white text-lg">₹{(item.price * item.quantity).toFixed(2)}</td>
                          <td className="p-5 text-center">
                            <button onClick={() => removeItem(item.id)} className="text-neutral-500 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors" title="Remove Item">
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
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
                  <h3 className="font-black text-white text-base uppercase tracking-wider">Delivery Address</h3>
                  {savedAddresses.length > 0 && (
                    <button onClick={openAddressSidebar} className="text-white text-xs font-bold uppercase tracking-widest hover:underline transition-all">Change</button>
                  )}
                </div>
                <div className="p-6">
                  {selectedAddress ? (
                    <div className="flex items-start gap-4">
                      <div className="bg-black border border-neutral-800 p-3 rounded-full text-white mt-1 flex-shrink-0">
                        <FaMapMarkerAlt size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-bold text-white text-base">{selectedAddress.name}</p>
                          <span className="text-xs font-bold text-neutral-400 bg-black border border-neutral-700 px-2 py-1 rounded-md">{selectedAddress.mobile}</span>
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                          {selectedAddress.houseNo}, {selectedAddress.roadName} <br/>
                          {selectedAddress.city}, {selectedAddress.state} - <span className="font-bold text-white">{selectedAddress.pincode}</span>
                          {selectedAddress.formattedAddress && (
                            <><br/><span className="text-xs text-neutral-500">{selectedAddress.formattedAddress}</span></>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed border-neutral-700 rounded-2xl bg-black">
                      <p className="text-neutral-400 mb-4 text-sm font-medium">No delivery address selected.</p>
                      <button onClick={openAddressSidebar} className="inline-flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest transition-colors text-xs">
                        <FaPlus size={12} /> Add Address
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ORDER SUMMARY */}
              <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-900">
                  <h3 className="font-black text-white text-base uppercase tracking-wider">Order Summary</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-neutral-400 text-sm font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 text-sm font-medium">
                    <span>Estimated Tax (18%)</span>
                    <span className="font-bold text-white">₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-neutral-800 flex justify-between items-end">
                    <span className="text-base font-black text-white uppercase tracking-wider">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-white">₹{grandTotal.toFixed(2)}</span>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Includes all taxes</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-neutral-900 border-t border-neutral-800 space-y-3">
                  <button onClick={handleCheckout} className="w-full h-14 bg-white text-black text-sm font-black tracking-widest uppercase rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center">Proceed to Checkout</button>
                  <button onClick={() => router.push('/')} className="w-full h-14 bg-transparent border-2 border-neutral-800 text-white text-sm font-black tracking-widest uppercase rounded-xl hover:border-white transition-all flex items-center justify-center">Continue Shopping</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADDRESS SIDEBAR */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[999] flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative w-full sm:w-[480px] bg-neutral-950 border-l border-neutral-800 h-full shadow-2xl flex flex-col z-10" style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
              <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-3">
                  {isAddingNew && savedAddresses.length > 0 && (
                    <button onClick={handleSidebarBack} className="p-2 -ml-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
                      <FaArrowLeft size={16} />
                    </button>
                  )}
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {isAddingNew ? (isEditingId ? "Edit Address" : "Add New Address") : "Delivery Address"}
                  </h3>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-neutral-400 hover:text-white bg-black border border-neutral-800 hover:border-white rounded-full transition-colors">
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar bg-neutral-950">
                {!isAddingNew ? (
                  <>
                    <button onClick={() => { 
                      // Set initial state but keep the default mobile intact
                      setAddressForm({ ...initialAddressState, mobile: defaultMobile }); 
                      setIsEditingId(null); 
                      setIsAddingNew(true); 
                    }} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-700 rounded-2xl text-white hover:bg-neutral-900 hover:border-white transition-colors font-bold uppercase tracking-widest text-xs">
                      <FaPlus size={12} /> Add a New Address
                    </button>
                    <div className="mt-8 space-y-4">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddress?.id === addr.id;
                        return (
                          <div key={addr.id} onClick={() => handleSelectAddress(addr)} className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all group ${isSelected ? "border-white bg-neutral-900 scale-[1.02]" : "border-neutral-800 bg-black hover:border-neutral-600"}`}>
                            {isSelected && <FaCheckCircle className="absolute top-5 right-5 text-white" size={20} />}
                            <div className="flex justify-between items-start mb-2 pr-8">
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-white text-base">{addr.name}</p>
                                <span className="text-xs font-bold text-neutral-400 bg-black border border-neutral-700 px-2 py-0.5 rounded-md uppercase tracking-wider">{addr.mobile}</span>
                              </div>
                            </div>
                            <p className="text-sm text-neutral-400 leading-relaxed mt-2 pr-8">
                              {addr.houseNo}, {addr.roadName} <br/>
                              {addr.city}, {addr.state} - <span className="font-bold text-white">{addr.pincode}</span>
                            </p>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => handleEditAddress(e, addr)} className="text-neutral-400 hover:text-white p-2.5 bg-black border border-neutral-700 hover:border-white rounded-xl transition-colors">
                                <FaEdit size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <form id="address-form" onSubmit={handleSaveAddress} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest">Contact Info</h4>
                      <input required type="text" name="name" value={addressForm.name} onChange={handleAddressChange} placeholder="Full Name" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                      <div>
                        <input required type="tel" name="mobile" value={addressForm.mobile} onChange={handleAddressChange} placeholder="Mobile Number" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                     </div>
                    </div>
                    <hr className="border-t border-neutral-800" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest">Location</h4>
                        <button type="button" onClick={() => autoCompleteInputRef.current?.focus()} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          <FaMapMarkedAlt /> Use Google Map
                        </button>
                      </div>
                      <input ref={autoCompleteInputRef} type="text" placeholder="Search address on Google Maps (India)" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                      {addressForm.formattedAddress && <p className="text-xs text-green-400 mt-1">✓ {addressForm.formattedAddress}</p>}

                      <div className="grid grid-cols-2 gap-4">
                        <input required type="text" name="houseNo" value={addressForm.houseNo} onChange={handleAddressChange} placeholder="House No / Building" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                        <input required type="text" name="roadName" value={addressForm.roadName} onChange={handleAddressChange} placeholder="Road / Area" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="number" name="pincode" value={addressForm.pincode} onChange={handleAddressChange} placeholder="Pincode" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                        <input required type="text" name="city" value={addressForm.city} onChange={handleAddressChange} placeholder="City" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                      </div>
                      <select required name="state" value={addressForm.state} onChange={handleAddressChange} className={`w-full bg-black border border-neutral-800 text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all ${addressForm.state === "" ? "text-neutral-600" : "text-white"}`}>
                        <option value="" disabled>Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <input type="text" name="landmark" value={addressForm.landmark} onChange={handleAddressChange} placeholder="Nearby Landmark (Optional)" className="w-full bg-black border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-white focus:border-transparent block p-4 outline-none transition-all placeholder-neutral-600" />
                    </div>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex gap-4">
                {isAddingNew ? (
                  <>
                    {savedAddresses.length > 0 && (
                      <button onClick={handleSidebarBack} className="flex-1 py-4 bg-transparent border-2 border-neutral-700 hover:border-white rounded-xl text-white font-black uppercase tracking-widest text-xs transition-colors">Cancel</button>
                    )}
                    <button type="submit" form="address-form" className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors">
                      {isEditingId ? "Update Address" : "Save Address"}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsSidebarOpen(false)} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-neutral-200 transition-colors">Use this Address</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}