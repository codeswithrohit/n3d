"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../../Firebase/config';
import { useRouter } from "next/navigation";
import { FaMapMarkerAlt, FaEdit, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";

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
  
  // Address & Order State
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [comments, setComments] = useState('');
  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' or 'Online'

  // Resell State
  const [isResell, setIsResell] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState('');

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

  // Calculations
  const subTotal = cartItems.reduce((acc, item) => {
    const effectivePrice = item.userResellPrice || item.price;
    return acc + (Number(effectivePrice) * item.quantity);
  }, 0);
  
  const totalTax = subTotal * 0.18; 
  const grandTotal = subTotal + totalTax;
  const margin = isResell && collectedAmount !== '' ? Number(collectedAmount) - grandTotal : 0;

  // Helper function to save order to Firestore
  const finalizeOrder = async (finalPaymentMethod, paymentId = null) => {
    try {
      const orderRef = await db.collection('n3dorders').add({
        userId: user.uid,
        userPhone: deliveryAddress.mobile, 
        customerInfo: deliveryAddress,     
        comments: comments,                
        items: cartItems,
        subTotal: subTotal,
        tax: totalTax,
        grandTotal: grandTotal,
        paymentMethod: finalPaymentMethod,
        paymentId: paymentId,
        status: finalPaymentMethod === "Online" ? "Paid" : "Pending", 
        orderDate: new Date().toISOString(), 
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isResell: isResell,
        collectedAmount: isResell ? Number(collectedAmount) : grandTotal,
        margin: isResell ? margin : 0
      });

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

    const amountInPaise = Math.round(grandTotal * 100);

    const options = {
      key:"rzp_live_TAYD7YcBEcEsat", // Use env variable in production
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
        color: "#000000" // Matches your black/white high-contrast theme
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
      if (!collectedAmount || Number(collectedAmount) < grandTotal) {
        alert(`For a resell order, the collected amount must be at least ₹${grandTotal.toFixed(2)}.`);
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
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-black"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 md:px-6 py-6 bg-white text-black font-sans min-h-screen relative transition-colors duration-300">
      
      {isSubmitting && (
        <div className="fixed inset-0 bg-neutral-900/70 z-50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
           <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white mb-4"></div>
           <h2 className="text-lg font-black uppercase tracking-widest">Processing Order...</h2>
        </div>
      )}

      <div className="mb-6 border-b border-neutral-100 pb-4">
        <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">
          Secure Checkout
        </h1>
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= LEFT SIDE (Address & Details) ================= */}
        <div className="lg:col-span-7 space-y-5">

          {/* DISPLAY DELIVERY ADDRESS */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-white px-5 py-4 border-b border-neutral-200 flex justify-between items-center">
              <span className="font-black text-black text-sm uppercase tracking-wider">1. Delivery Address</span>
              <button 
                type="button" 
                onClick={() => router.push('/cart')} 
                className="text-black text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-all"
              >
                <FaEdit size={12} /> Change
              </button>
            </div>
            
            <div className="p-5">
              {deliveryAddress && (
                <div className="flex items-start gap-3">
                  <div className="bg-white border border-neutral-200 p-2.5 rounded-full text-black mt-0.5 flex-shrink-0 shadow-sm">
                    <FaMapMarkerAlt size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-bold text-black text-sm">{deliveryAddress.name}</p>
                      <span className="text-[10px] font-bold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded uppercase tracking-wider">
                        {deliveryAddress.mobile}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {deliveryAddress.houseNo}, {deliveryAddress.roadName} <br />
                      {deliveryAddress.city}, {deliveryAddress.state} - <span className="font-bold text-black">{deliveryAddress.pincode}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-white px-5 py-4 border-b border-neutral-200">
              <span className="font-black text-black text-sm uppercase tracking-wider">2. Payment Method</span>
            </div>
            <div className="p-5 space-y-3">
              
              {/* Online Payment Option */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors shadow-sm ${paymentMethod === 'Online' ? 'border-black bg-neutral-100' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="Online"
                  checked={paymentMethod === 'Online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 accent-black" 
                />
                <FaCreditCard className="text-black" size={18} />
                <div className="flex-1">
                  <span className="font-bold text-black text-sm uppercase tracking-wider">Pay Online (Razorpay)</span>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5 uppercase tracking-wide">UPI, Credit/Debit Cards, NetBanking</p>
                </div>
              </label>

              {/* COD Option */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors shadow-sm ${paymentMethod === 'COD' ? 'border-black bg-neutral-100' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 accent-black" 
                />
                <FaMoneyBillWave className="text-black" size={18} />
                <div className="flex-1">
                  <span className="font-bold text-black text-sm uppercase tracking-wider">Cash On Delivery</span>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5 uppercase tracking-wide">Pay via cash or UPI upon delivery</p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE (Cart Summary & Submit) ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* CART TABLE & SUMMARY */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-white px-5 py-4 border-b border-neutral-200">
              <span className="font-black text-black text-sm uppercase tracking-wider">3. Order Summary</span>
            </div>

            <div className="overflow-y-auto max-h-60 p-5 space-y-3 hide-scrollbar">
              {cartItems.map((item) => {
                const effectivePrice = item.userResellPrice || item.price;
                return (
                  <div key={item.id} className="flex items-center justify-between border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                         <img src={item.image || "/placeholder.png"} className="w-full h-full object-contain p-1 mix-blend-multiply" alt={item.productName} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black line-clamp-1">{item.productName}</p>
                        <p className="text-[10px] font-bold text-neutral-500 mt-0.5 uppercase tracking-wider">Qty: {item.quantity} {item.variant?.optionValue ? `| ${item.variant.optionValue}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-black">₹{(effectivePrice * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTALS */}
            <div className="bg-white p-5 border-t border-neutral-200 space-y-2.5">
              <div className="flex justify-between text-xs text-neutral-600 font-medium">
                <span>Sub-Total</span>
                <span className="font-bold text-black">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600 font-medium">
                <span>Tax (18%)</span>
                <span className="font-bold text-black">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600 font-medium">
                <span>Shipping</span>
                <span className="font-black text-emerald-600 uppercase tracking-widest">Free</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-neutral-200 mt-3">
                <span className="text-sm font-black text-black uppercase tracking-wider">Order Total</span>
                <div className="text-right">
                   <span className="text-2xl font-black text-red-600 leading-none">₹{grandTotal.toFixed(2)}</span>
                   <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Includes all taxes</p>
                </div>
              </div>
            </div>
          </div>


          {/* COMMENTS & SUBMIT */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Order Comments (Optional)</label>
                <textarea 
                  name="comments" 
                  value={comments} 
                  onChange={(e) => setComments(e.target.value)} 
                  className="w-full bg-white border border-neutral-200 text-black p-3 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none h-20 resize-none transition-colors text-xs" 
                  placeholder="Any special instructions for delivery..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !deliveryAddress || (isResell && margin < 0) || (isResell && collectedAmount === '')} 
                className="w-full h-12 bg-red-600 text-white text-xs font-black tracking-widest uppercase rounded-xl hover:bg-red-700 transition-all shadow-md flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
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