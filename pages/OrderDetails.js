"use client";

import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import { useSearchParams, useRouter } from "next/navigation";
import { FaCheckCircle, FaShoppingBag, FaArrowLeft, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';
import Orders from './orders';

const OrderDetails = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId"); 

  const db = firebase.firestore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic Auth Check
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (!orderId) {
        alert("Invalid Order ID.");
        router.push('/');
        return;
      }

      try {
        const docRef = db.collection('n3dorders').doc(orderId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          // Extra security: ensure the current user actually owns this order
          if(docSnap.data().userId !== user.uid) {
             alert("Unauthorized access to this order.");
             router.push('/');
             return;
          }
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Order not found");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [orderId, router]);
console.log("orders",order)

  // Helper for status badge styling (Dark Theme Tuned)
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'border-emerald-800 bg-emerald-900/30 text-emerald-400';
      case 'shipped':
        return 'border-blue-800 bg-blue-900/30 text-blue-400';
      case 'cancelled':
        return 'border-red-800 bg-red-900/30 text-red-400';
      case 'pending':
      default:
        return 'border-neutral-700 bg-neutral-800/50 text-neutral-300';
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center bg-neutral-900 p-8 rounded-3xl border border-neutral-800 max-w-md w-full shadow-2xl">
          <div className="text-5xl text-neutral-600 mb-4">🛒</div>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-2">Order Not Found</h2>
          <p className="text-xs font-medium text-neutral-400 mb-8">We couldn't locate the order you're looking for. It may have been removed or the ID is incorrect.</p>
          <button 
            onClick={() => router.push('/')} 
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors"
          >
            <FaArrowLeft /> Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 font-sans text-white transition-colors duration-300">
      <div className="w-full mx-auto">
   
        {/* INVOICE CARD */}
        <div className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden shadow-sm">
          
          {/* HEADER TILE */}
          <div className="bg-neutral-900 p-5 flex flex-col sm:flex-row justify-between gap-5 sm:items-center border-b border-neutral-800">
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Order Number</p>
              <p className="text-sm font-black text-white uppercase tracking-wider">#{order.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Order Date</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider">{new Date(order.orderDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 border rounded-md text-[9px] font-black uppercase tracking-widest ${getStatusBadge(order.status)}`}>
                {order.status || 'Pending'}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-6">
            
            {/* INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Shipping Details */}
              <div className="bg-black rounded-2xl p-5 border border-neutral-800 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3">
                  <FaMapMarkerAlt className="text-neutral-500" size={14} />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Shipping To</h3>
                </div>
                
                <p className="font-black text-white text-sm mb-1 uppercase tracking-wider">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                <div className="text-neutral-400 text-xs font-medium leading-relaxed flex-1">
  {/* Name */}
  <p className="font-bold text-white mb-1">{order.customerInfo.name}</p>
  
  {/* Address lines mapped to houseNo and roadName */}
  <p>{order.customerInfo.houseNo}</p>
  {order.customerInfo.roadName && <p>{order.customerInfo.roadName}</p>}
  {order.customerInfo.landmark && <p>{order.customerInfo.landmark}</p>}
  
  {/* City, State, and Pincode */}
  <p>
    {order.customerInfo.city}, {order.customerInfo.state} - <span className="font-bold text-white">{order.customerInfo.pincode}</span>
  </p>
  
  {/* Mobile */}
  <p className="mt-1">Mobile: {order.customerInfo.mobile}</p>
</div>
                <div className="mt-4 pt-3 border-t border-neutral-800">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Phone: <span className="text-white ml-1">{order.userPhone}</span></p>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="bg-black rounded-2xl p-5 border border-neutral-800 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 border-b border-neutral-800 pb-3">
                  <FaCreditCard className="text-neutral-500" size={14} />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Payment Info</h3>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Method</span>
                  <span className="font-bold text-white bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800 text-[10px] uppercase tracking-wider">{order.paymentMethod}</span>
                </div>

                {/* RESELL INFORMATION BLOCK */}
                {order.isResell && (
                  <div className="mt-1 mb-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <FaCheckCircle size={12} /> Resell Order
                    </p>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-neutral-400 font-bold">Cash to Collect:</span>
                      <span className="font-black text-white">₹{order.collectedAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-neutral-800">
                      <span className="text-neutral-400 font-bold">Your Margin:</span>
                      <span className="font-black text-emerald-400">₹{order.margin?.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex-1"></div>

                {order.customerInfo.comments && (
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                     <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Order Notes</p>
                     <p className="text-white font-bold text-xs bg-neutral-900 p-3 rounded-xl border border-neutral-800">"{order.customerInfo.comments}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* ORDER ITEMS TABLE */}
            <div className="border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="bg-neutral-900 px-5 py-3 border-b border-neutral-800">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Purchased Items</h3>
              </div>
              <div className="overflow-x-auto hide-scrollbar bg-black">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-4">Product</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {order.items.map((item, idx) => {
                      const effectivePrice = item.userResellPrice || item.price;
                      return (
                        <tr key={idx} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl border border-neutral-800 bg-white flex-shrink-0">
                              <img src={item.image || "/placeholder.png"} className="w-full h-full object-contain p-1" alt="product" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs line-clamp-1">{item.productName}</p>
                              {item.variant?.optionValue && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-neutral-900 text-neutral-300 text-[9px] font-black uppercase tracking-widest rounded border border-neutral-800">
                                  {item.variant.optionValue}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-bold text-neutral-400 text-right">₹{Number(effectivePrice).toFixed(2)}</td>
                          <td className="p-4 text-xs font-black text-white text-center">x{item.quantity}</td>
                          <td className="p-4 text-sm font-black text-white text-right">₹{(effectivePrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTALS SUMMARY */}
            <div className="flex flex-col sm:flex-row justify-between items-end">
              <div className="hidden sm:block w-1/2 pr-8 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                Need help with your order? Contact our support team with your Order ID for rapid assistance.
              </div>

              <div className="w-full sm:w-1/2 lg:w-1/3 space-y-2.5 bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
                <div className="flex justify-between text-neutral-400 text-xs font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">₹{order.subTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-xs font-medium">
                  <span>Tax (18%)</span>
                  <span className="font-bold text-white">₹{order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-xs font-medium border-b border-neutral-800 pb-3">
                  <span>Shipping</span>
                  <span className="font-black text-white uppercase tracking-widest text-[10px]">Free</span>
                </div>
                
                <div className="flex justify-between items-end pt-2">
                  <span className="font-black text-white text-sm uppercase tracking-wider">Order Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white leading-none">₹{order.grandTotal?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Highlight Cash to Collect for Resellers */}
                {order.isResell && (
                  <div className="flex justify-between items-end pt-3 mt-3 border-t border-neutral-800">
                    <span className="font-black text-white text-[10px] uppercase tracking-widest">Cash to Collect</span>
                    <span className="text-lg font-black text-emerald-400 leading-none">₹{order.collectedAmount?.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="bg-black p-5 border-t border-neutral-800 flex flex-col sm:flex-row justify-end items-center gap-3">
             
             {/* Continue Shopping Button */}
             <button 
                onClick={() => router.push('/')} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-md"
              >
               <FaShoppingBag size={12} /> Continue Shopping
             </button>
          </div>

        </div>
      </div>

      {/* Print Styles (Tuned to keep dark text visibility on solid white paper layout shifts) */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          button, nav, footer { display: none !important; }
          .shadow-sm, .shadow-md { box-shadow: none !important; }
          .bg-neutral-900, .bg-neutral-950, .bg-black { background: #f9fafb !important; color: black !important; }
          .text-white, .text-neutral-300, .text-neutral-400 { color: black !important; }
          .border-neutral-800 { border-color: #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
}

export default OrderDetails;