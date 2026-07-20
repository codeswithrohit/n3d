"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { firebase } from '../../Firebase/config';

// Complete list of Indian States and UTs for the dropdown
const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", 
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", 
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", 
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function Checkout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = firebase.firestore();

  const id = searchParams.get('id');
  const variantOption = searchParams.get('variant');
  const qty = searchParams.get('qty') ? parseInt(searchParams.get('qty')) : 1;
  const price = searchParams.get('price') ? parseInt(searchParams.get('price')) : 0;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    apartment: '',
    city: '',
    state: ''
  });

  // Fetch product to show image/name in the summary
  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        const doc = await db.collection('Newproducts').doc(id).get();
        if (doc.exists) {
          const rawData = doc.data();
          let mediaUrl = '/placeholder.png';
          
          if (rawData.media && rawData.media.length > 0) {
             mediaUrl = rawData.media[0].url;
          } else if (rawData.images && rawData.images.length > 0) {
             mediaUrl = rawData.images[0];
          }

          setProduct({ name: rawData.name, image: mediaUrl });
        }
      } catch (error) {
        console.error("Error fetching checkout product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    // Add your payment gateway logic here (e.g., Razorpay, Stripe)
    console.log("Processing Order:", {
      product: { id, variantOption, qty, price },
      shipping: formData
    });

    alert("Proceeding to Payment Gateway...");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  const subtotal = price * qty;
  const shipping = 0; // Adjust if you have shipping costs
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black tracking-tight mb-10 text-center lg:text-left">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* ================= LEFT: SHIPPING FORM ================= */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold mb-6">Shipping Details</h2>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Mobile Number</label>
                    <input 
                      type="tel" 
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Address</label>
                  <input 
                    type="text" 
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    placeholder="Street address, P.O. box, company name, c/o"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Apartment, suite, etc. (optional)</label>
                  <input 
                    type="text" 
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">City</label>
                    <input 
                      type="text" 
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">State</label>
                    <select 
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none"
                    >
                      <option value="" disabled>Select a state</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    className="w-full bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-lg shadow-black/10 dark:shadow-white/5"
                  >
                     Pay Now
                  </button>
                </div>
              </form>

            </div>
          </div>

          {/* ================= RIGHT: ORDER SUMMARY ================= */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {product && (
                <div className="flex gap-4 items-center mb-8 pb-8 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="w-20 h-24 bg-neutral-100 dark:bg-neutral-950 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-800">
                    <img src={product.image} className="w-full h-full object-cover" alt="Product" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Variant: <span className="font-bold text-neutral-800 dark:text-neutral-200">{variantOption}</span></p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="font-black text-sm">₹{price}</p>
                      <p className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">Qty: {qty}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 text-sm font-medium">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Shipping</span>
                  {shipping === 0 ? <span className="text-emerald-500 font-bold uppercase text-xs">Free</span> : <span>₹{shipping}</span>}
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-lg">Total</span>
                <span className="font-black text-2xl">₹{total}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}