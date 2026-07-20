"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../../Firebase/config';
import { useRouter } from "next/navigation";
import { FaMapMarkerAlt, FaEdit, FaCreditCard, FaMoneyBillWave, FaTag } from "react-icons/fa";

// Razorpay script loader
const loadScript = async (src) => {
  try {
    await new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
    return true;
  } catch (error) {
    console.error("Error loading script:", error);
    return false;
  }
};

export default function CheckoutPage() {
  const router = useRouter();
  const db = firebase.firestore();

  // State
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userMobile, setUserMobile] = useState("");
  
  // Tracking Used Coupons state
  const [userUsedCoupons, setUserUsedCoupons] = useState([]);
  
  // Address & Order State
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [comments, setComments] = useState('');
  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' or 'Online'

  // Resell State
  const [isResell, setIsResell] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState('');

  // ================= COUPON & OFFER STATE =================
  const [couponCode, setCouponCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  
  // New States for "View Offers" functionality
  const [showOffersList, setShowOffersList] = useState(false);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [isFetchingOffers, setIsFetchingOffers] = useState(false);

  // 1. Authenticate and Fetch Data
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        alert("Please log in to checkout.");
        router.push('/login');
        return;
      }
      setUser(currentUser);

      try {
        // Fetch the real mobile number and used coupons from n3duser
        let realMobile = currentUser.phoneNumber || "";
        const userDocRef = await db.collection('n3duser').doc(currentUser.uid).get();
        
        if (userDocRef.exists) {
          const uData = userDocRef.data();
          realMobile = uData.mobileNumber || uData.phoneNumber || realMobile;
          
          // Set used coupons so we can validate them later
          setUserUsedCoupons(uData.usedCoupons || []);
        }
        setUserMobile(realMobile);
        
        let finalAddressData = null;
        const savedAddressId = localStorage.getItem('selectedCheckoutAddressId');

        if (savedAddressId) {
          const specificAddressDoc = await db.collection('n3duser')
            .doc(currentUser.uid)
            .collection('addresses')
            .doc(savedAddressId)
            .get();

          if (specificAddressDoc.exists) {
            finalAddressData = specificAddressDoc.data();
          }
        }

        if (!finalAddressData) {
          const fallbackSnap = await db.collection('n3duser')
            .doc(currentUser.uid)
            .collection('addresses')
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get();

          if (!fallbackSnap.empty) {
            finalAddressData = fallbackSnap.docs[0].data();
          }
        }

        if (finalAddressData) {
          setDeliveryAddress(finalAddressData);
        } else {
          alert("No delivery address found. Please add an address to continue.");
          router.push('/cart');
          return;
        }

        // Fetch Cart Items
        const cartSnap = await db.collection('n3duser').doc(currentUser.uid).collection('cart').get();
        const items = cartSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (items.length === 0) {
          alert("Your cart is empty.");
          router.push('/');
        } else {
          setCartItems(items);
        }
      } catch (error) {
        console.error("Error fetching checkout data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // ================= CALCULATIONS (Updated with Offers) =================
  const subTotal = cartItems.reduce((acc, item) => {
    const effectivePrice = item.userResellPrice || item.price;
    return acc + (Number(effectivePrice) * item.quantity);
  }, 0);
  
  const totalTax = subTotal * 0; 
  const baseTotal = subTotal + totalTax;

  // Re-validate coupon if cart total changes (drops below min order)
  useEffect(() => {
    if (appliedOffer && baseTotal < appliedOffer.minOrder) {
      setAppliedOffer(null);
      setCouponError(`Coupon removed. Minimum order of ₹${appliedOffer.minOrder} is no longer met.`);
    }
  }, [baseTotal, appliedOffer]);

  const discountAmount = appliedOffer ? appliedOffer.discount : 0;
  const finalTotal = Math.max(0, baseTotal - discountAmount);
  const margin = isResell && collectedAmount !== '' ? Number(collectedAmount) - finalTotal : 0;

  // ================= FETCH ALL OFFERS =================
  const fetchOffers = async () => {
    setIsFetchingOffers(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const offerSnap = await db.collection('n3doffers').get();
      
      const fetchedOffers = [];
      offerSnap.docs.forEach(doc => {
        const data = doc.data();
        // Only show offers that haven't expired
        if (!data.validTill || data.validTill >= today) {
          fetchedOffers.push({ id: doc.id, ...data });
        }
      });
      
      setAvailableOffers(fetchedOffers);
    } catch (err) {
      console.error("Error fetching available offers:", err);
    } finally {
      setIsFetchingOffers(false);
    }
  };

  const handleToggleOffersList = () => {
    if (!showOffersList) {
      fetchOffers();
    }
    setShowOffersList(!showOffersList);
  };

  // ================= COUPON LOGIC =================
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError("");
    
    try {
      const offerSnap = await db.collection('n3doffers').where('code', '==', couponCode.toUpperCase()).get();
      
      if (offerSnap.empty) {
        setCouponError("Invalid coupon code.");
        setAppliedOffer(null);
      } else {
        const offerData = offerSnap.docs[0].data();
        applyValidatedOffer(offerData);
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
      setCouponError("Failed to verify coupon. Please try again.");
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Helper to apply offer directly from list or manual input
  const applyValidatedOffer = (offerData) => {
    // 1. Check if User has already used this coupon
    if (userUsedCoupons.includes(offerData.code)) {
      setCouponError(`You have already used the coupon code ${offerData.code}.`);
      setAppliedOffer(null);
      return;
    }

    // 2. Check Min Order Requirement
    if (baseTotal < offerData.minOrder) {
      setCouponError(`Minimum order amount for ${offerData.code} is ₹${offerData.minOrder}.`);
      setAppliedOffer(null);
    } else {
      // 3. Check Expiration
      const today = new Date().toISOString().split('T')[0]; 
      if (offerData.validTill && offerData.validTill < today) {
        setCouponError("This coupon has expired.");
        setAppliedOffer(null);
      } else {
        // Success
        setAppliedOffer(offerData);
        setCouponError("");
        setCouponCode(""); 
        setShowOffersList(false); // Close the list once applied
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponCode("");
    setCouponError("");
  };

  // ================= ORDER SUBMISSION =================
  const finalizeOrder = async (finalPaymentMethod, paymentId = null) => {
    try {
      const orderRef = await db.collection('n3dorders').add({
        userId: user.uid,
        Mobilenumber: userMobile,
        userPhone: deliveryAddress.mobile, 
        customerInfo: deliveryAddress,     
        comments: comments,                
        items: cartItems,
        
        // Financials (Updated for discounts)
        subTotal: subTotal,
        tax: totalTax,
        discountAmount: discountAmount,
        couponCode: appliedOffer ? appliedOffer.code : null,
        grandTotal: finalTotal,
        
        paymentMethod: finalPaymentMethod,
        paymentId: paymentId,
        status: finalPaymentMethod === "Online" ? "Paid" : "Pending", 
        orderDate: new Date().toISOString(), 
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        
        // Resell Details
        isResell: isResell,
        collectedAmount: isResell ? Number(collectedAmount) : finalTotal,
        margin: isResell ? margin : 0
      });

      // ================= NEW: Save Coupon Usage =================
      if (appliedOffer && appliedOffer.code) {
        await db.collection('n3duser').doc(user.uid).update({
          usedCoupons: firebase.firestore.FieldValue.arrayUnion(appliedOffer.code)
        });
      }

      // Clear the User's Cart
      const cartRef = db.collection('n3duser').doc(user.uid).collection('cart');
      const cartDocs = await cartRef.get();
      const batch = db.batch();
      cartDocs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      localStorage.removeItem('selectedCheckoutAddressId');
      alert(`Order placed successfully!`);
      router.push(`/OrderDetails?orderId=${orderRef.id}`);

    } catch (error) {
      console.error("Error finalizing order:", error);
      alert("Failed to place order. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Razorpay Initialization
  const initiateOnlinePayment = async () => {
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    if (!res) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      setIsSubmitting(false);
      return;
    }

    const amountInPaise = Math.round(finalTotal * 100);

    const options = {
      key: "rzp_live_TAYD7YcBEcEsat", // Use env variable in production
      currency: "INR",
      amount: amountInPaise,
      name: "N3D",
      description: "Order Checkout",
      image: "/logo.png",
      handler: async function (response) {
        // Payment successful
        await finalizeOrder("Online", response.razorpay_payment_id);
      },
      prefill: {
        name: deliveryAddress.name || "",
        contact: deliveryAddress.mobile || "",
      },
      theme: {
        color: "#000000" 
      }
    };

    const paymentObject = new window.Razorpay(options);
    
    // Handle modal close without payment
    paymentObject.on('payment.failed', function (response){
        alert("Payment failed or cancelled. Please try again.");
        setIsSubmitting(false);
    });

    paymentObject.open();
  };

  // Main Submit Handler
  const handleConfirmOrder = async (e) => {
    e.preventDefault();

    if (!deliveryAddress) {
      alert("Delivery address is missing.");
      return;
    }

    if (isResell) {
      if (!collectedAmount || Number(collectedAmount) < finalTotal) {
        alert(`For a resell order, the collected amount must be at least ₹${finalTotal.toFixed(2)}.`);
        return;
      }
    }

    setIsSubmitting(true);

    if (paymentMethod === "COD") {
      await finalizeOrder("Cash On Delivery", null);
    } else {
      await initiateOnlinePayment();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 md:px-6 py-6 bg-black text-white font-sans min-h-screen relative transition-colors duration-300">
      
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
           <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white mb-4"></div>
           <h2 className="text-lg font-black uppercase tracking-widest">Processing Order...</h2>
        </div>
      )}

      <div className="mb-6 border-b border-neutral-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
          Secure Checkout
        </h1>
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= LEFT SIDE (Address & Details) ================= */}
        <div className="lg:col-span-7 space-y-5">

          {/* DISPLAY DELIVERY ADDRESS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex justify-between items-center">
              <span className="font-black text-white text-sm uppercase tracking-wider">1. Delivery Address</span>
              <button 
                type="button" 
                onClick={() => router.push('/cart')} 
                className="text-white text-[10px] font-bold uppercase tracking-widest hover:text-neutral-400 hover:underline flex items-center gap-1.5 transition-all"
              >
                <FaEdit size={12} /> Change
              </button>
            </div>
            
            <div className="p-5">
              {deliveryAddress && (
                <div className="flex items-start gap-3">
                  <div className="bg-black border border-neutral-800 p-2.5 rounded-full text-white mt-0.5 flex-shrink-0">
                    <FaMapMarkerAlt size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-bold text-white text-sm">{deliveryAddress.name}</p>
                      <span className="text-[10px] font-bold text-neutral-400 bg-black border border-neutral-700 px-2 py-0.5 rounded uppercase tracking-wider">
                        {deliveryAddress.mobile}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {deliveryAddress.houseNo}, {deliveryAddress.roadName} <br />
                      {deliveryAddress.city}, {deliveryAddress.state} - <span className="font-bold text-white">{deliveryAddress.pincode}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800">
              <span className="font-black text-white text-sm uppercase tracking-wider">2. Payment Method</span>
            </div>
            <div className="flex flex-row p-5 space-x-3">
              
              {/* Online Payment Option */}
              <label className={`flex flex-1 items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors shadow-sm ${paymentMethod === 'Online' ? 'border-white bg-neutral-800' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="Online"
                  checked={paymentMethod === 'Online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 accent-white" 
                />
                <FaCreditCard className="text-white flex-shrink-0" size={18} />
                <div className="flex-1">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">Pay Online</span>
                  <p className="text-[7px] text-neutral-400 font-bold mt-0.5 uppercase tracking-wide">UPI, Cards, NetBanking</p>
                </div>
              </label>

              {/* COD Option */}
              <label className={`flex flex-1 items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors shadow-sm ${paymentMethod === 'COD' ? 'border-white bg-neutral-800' : 'border-neutral-800 bg-black hover:border-neutral-600'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 accent-white" 
                />
                <FaMoneyBillWave className="text-white flex-shrink-0" size={18} />
                <div className="flex-1">
                  <span className="font-bold text-white text-xs uppercase tracking-wider">COD</span>
                  <p className="text-[7px] text-neutral-400 font-bold mt-0.5 uppercase tracking-wide">Pay cash on delivery</p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE (Offers & Summary) ================= */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* OFFERS & COUPONS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex justify-between items-center">
              <span className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <FaTag className="text-neutral-400" /> 3. Apply Offer
              </span>
              {!appliedOffer && (
                <button 
                  type="button" 
                  onClick={handleToggleOffersList} 
                  className="text-white text-[10px] font-bold uppercase tracking-widest bg-neutral-800 px-3 py-1.5 rounded hover:bg-neutral-700 transition-colors"
                >
                  {showOffersList ? "Hide Offers" : "View Offers"}
                </button>
              )}
            </div>
            
            <div className="p-5">
              {appliedOffer ? (
                <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-4 relative">
                  <button 
                    type="button" 
                    onClick={handleRemoveCoupon} 
                    className="absolute top-3 right-3 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider bg-red-900/20 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-green-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                      {appliedOffer.code} APPLIED
                    </span>
                  </div>
                  <p className="text-green-400 font-bold text-sm">₹{appliedOffer.discount.toFixed(2)} Discount</p>
                  <div className="flex gap-4 mt-2 text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                    <span>Min Order: ₹{appliedOffer.minOrder}</span>
                    <span>Valid Till: {appliedOffer.validTill}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Manual Input Area */}
                  <div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter Coupon Code"
                        className="flex-1 bg-black border border-neutral-700 text-white placeholder-neutral-500 px-4 py-2 rounded-lg focus:outline-none focus:border-white uppercase text-sm font-bold tracking-widest"
                      />
                      <button 
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isCheckingCoupon || !couponCode.trim()}
                        className="bg-white text-black font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-lg hover:bg-neutral-300 disabled:opacity-50 transition-colors"
                      >
                        {isCheckingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-[10px] uppercase font-bold tracking-wider mt-2">{couponError}</p>}
                  </div>

                  {/* Available Offers List UI */}
                  {showOffersList && (
                    <div className="bg-black border border-neutral-800 rounded-xl p-4 mt-4 max-h-60 overflow-y-auto hide-scrollbar">
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 border-b border-neutral-800 pb-2">Available Coupons</h4>
                      
                      {isFetchingOffers ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        </div>
                      ) : availableOffers.length > 0 ? (
                        <div className="space-y-3">
                          {availableOffers.map((offer) => {
                            // Check if this particular coupon has been used by the user
                            const isAlreadyUsed = userUsedCoupons.includes(offer.code);

                            return (
                              <div 
                                key={offer.id} 
                                className={`border ${isAlreadyUsed ? 'border-neutral-800 bg-neutral-950 opacity-60' : 'border-neutral-700 bg-neutral-900'} rounded-lg p-3 flex justify-between items-center shadow-sm`}
                              >
                                <div>
                                  <span className="bg-white text-black text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                                    {offer.code}
                                  </span>
                                  <p className="text-green-400 font-bold text-xs mt-1.5">Flat ₹{offer.discount.toFixed(2)} Off</p>
                                  <p className="text-neutral-500 text-[9px] uppercase mt-0.5 tracking-wider">
                                    Min Order: ₹{offer.minOrder}
                                  </p>
                                  {isAlreadyUsed && (
                                    <p className="text-red-400 text-[9px] uppercase font-bold mt-1 tracking-wider">Already Used</p>
                                  )}
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => applyValidatedOffer(offer)}
                                  disabled={isAlreadyUsed}
                                  className={`${isAlreadyUsed ? 'bg-neutral-900 text-neutral-600' : 'bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-600'} text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors border`}
                                >
                                  {isAlreadyUsed ? 'Used' : 'Apply'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 text-center py-4">No available offers at the moment.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CART TABLE & SUMMARY */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800">
              <span className="font-black text-white text-sm uppercase tracking-wider">4. Order Summary</span>
            </div>

            <div className="overflow-y-auto max-h-60 p-5 space-y-3 hide-scrollbar">
              {cartItems.map((item) => {
                const effectivePrice = item.userResellPrice || item.price;
                return (
                  <div key={item.id} className="flex items-center justify-between border-b border-neutral-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-white">
                         <img src={item.image || "/placeholder.png"} className="w-full h-full object-contain p-1" alt={item.productName} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white line-clamp-1">{item.productName}</p>
                        <p className="text-[10px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider">Qty: {item.quantity} {item.variant?.optionValue ? `| ${item.variant.optionValue}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">₹{(effectivePrice * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTALS */}
            <div className="bg-neutral-950 p-5 border-t border-neutral-800 space-y-2.5">
              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                <span>Sub-Total</span>
                <span className="font-bold text-white">₹{subTotal.toFixed(2)}</span>
              </div>
              
              {appliedOffer && (
                <div className="flex justify-between text-xs text-green-400 font-medium">
                  <span>Discount ({appliedOffer.code})</span>
                  <span className="font-bold text-green-400">- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                <span>Tax (0%)</span>
                <span className="font-bold text-white">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                <span>Shipping</span>
                <span className="font-black text-white uppercase tracking-widest">Free</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-neutral-800 mt-3">
                <span className="text-sm font-black text-white uppercase tracking-wider">Order Total</span>
                <div className="text-right">
                   <span className="text-2xl font-black text-white leading-none">₹{finalTotal.toFixed(2)}</span>
                   <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Includes all taxes</p>
                </div>
              </div>
            </div>
          </div>

          {/* COMMENTS & SUBMIT */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Order Comments (Optional)</label>
                <textarea 
                  name="comments" 
                  value={comments} 
                  onChange={(e) => setComments(e.target.value)} 
                  className="w-full bg-black border border-neutral-800 text-white placeholder-neutral-600 p-3 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none h-20 resize-none transition-colors text-xs" 
                  placeholder="Any special instructions for delivery..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !deliveryAddress || (isResell && margin < 0) || (isResell && collectedAmount === '')} 
                className="w-full h-12 bg-white text-black text-xs font-black tracking-widest uppercase rounded-xl hover:bg-neutral-300 transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? "Processing..." : `Place Order (${paymentMethod === 'Online' ? 'Razorpay' : 'COD'})`}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}