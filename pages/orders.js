"use client";

import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import { useRouter } from 'next/navigation';
import { FaEye } from 'react-icons/fa';

const Orders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch All Orders from Firestore
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('n3dorders')
                                 .orderBy('createdAt', 'desc')
                                 .get();

        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  // Helper to color-code the order status badges (Permanent Light Theme)
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'border-emerald-200 bg-emerald-50/50 text-emerald-600';
      case 'shipped':
        return 'border-blue-200 bg-blue-50/50 text-blue-600';
      case 'cancelled':
        return 'border-red-200 bg-red-50/50 text-red-600';
      case 'pending':
      default:
        return 'border-neutral-200 bg-neutral-100 text-neutral-700';
    }
  };

  // Helper to get initials for the customer avatar
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}` || '?';
  };

  // Compact Skeleton Row Component
  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-neutral-100 last:border-none">
      <td className="p-3">
        <div className="h-3 bg-neutral-200 rounded w-20 mb-1.5"></div>
        <div className="h-2.5 bg-neutral-100 rounded w-14"></div>
      </td>
      <td className="p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-neutral-200 shrink-0"></div>
        <div>
          <div className="h-3 bg-neutral-200 rounded w-24 mb-1.5"></div>
          <div className="h-2.5 bg-neutral-100 rounded w-16"></div>
        </div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-neutral-200 rounded w-14 mb-1.5"></div>
        <div className="h-2.5 bg-neutral-100 rounded w-20"></div>
      </td>
      <td className="p-3">
        <div className="h-3 bg-neutral-200 rounded w-14 mb-1.5"></div>
        <div className="h-2.5 bg-neutral-100 rounded w-10"></div>
      </td>
      <td className="p-3">
        <div className="h-5 bg-neutral-200 rounded-md w-16"></div>
      </td>
      <td className="p-3 text-right">
        <div className="h-8 bg-neutral-200 rounded-lg w-16 ml-auto"></div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-white py-6 px-4 md:px-6 font-sans transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 uppercase tracking-tight">Orders Overview</h1>
            <p className="text-xs text-neutral-500 font-medium tracking-wide mt-1">Manage, track, and review all customer orders in one place.</p>
          </div>
          
          <div className="bg-neutral-50 border border-neutral-200 shadow-sm px-4 py-2.5 rounded-xl flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Orders</span>
              {loading ? (
                <div className="h-5 bg-neutral-200 rounded w-8 mt-0.5 animate-pulse"></div>
              ) : (
                <span className="text-lg font-black text-black leading-none mt-0.5">{orders.length}</span>
              )}
            </div>
          </div>
        </div>

        {/* ORDERS TABLE CONTAINER */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-[10px] font-black uppercase tracking-widest transition-colors">
                  <th className="p-3 whitespace-nowrap">Order ID & Date</th>
                  <th className="p-3 whitespace-nowrap">Customer</th>
                  <th className="p-3 whitespace-nowrap">Items</th>
                  <th className="p-3 whitespace-nowrap">Amount</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                  <th className="p-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-neutral-100">
                {/* 1. LOADING STATE */}
                {loading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}

                {/* 2. EMPTY STATE */}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-50 border border-neutral-200 mb-3 transition-colors shadow-sm">
                        <span className="text-xl">📦</span>
                      </div>
                      <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider mb-1">No Orders Found</h3>
                      <p className="text-xs text-neutral-500 font-medium">There are currently no orders in your database.</p>
                    </td>
                  </tr>
                )}

                {/* 3. DATA STATE */}
                {!loading && orders.length > 0 && orders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors group">
                    
                    {/* ID & Date */}
                    <td className="p-3 align-middle">
                      <p className="text-xs font-black text-neutral-900 mb-0.5 uppercase tracking-wider">{index + 1}. #{order.id.substring(0, 8)}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
                      </p>
                    </td>

                    {/* Customer Info with Avatar */}
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 text-neutral-900 flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-sm transition-colors">
                          {getInitials(order.customerInfo?.firstName, order.customerInfo?.lastName)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                            {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                          </p>
                          <p className="text-[10px] font-bold text-neutral-500 mt-0.5 tracking-wider">{order.userPhone || 'No Phone provided'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="p-3 align-middle">
                      <p className="text-xs font-bold text-neutral-900">{order.items?.length || 0} Item{(order.items?.length !== 1) && 's'}</p>
                      {order.items && order.items[0] && (
                        <p className="text-[10px] font-medium text-neutral-500 truncate max-w-[120px] mt-0.5" title={order.items[0].productName}>
                          {order.items[0].productName}
                        </p>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="p-3 align-middle">
                      <p className="text-xs font-black text-neutral-900">₹{order.grandTotal?.toFixed(2) || '0.00'}</p>
                      <p className="text-[9px] text-neutral-500 uppercase font-black mt-0.5 tracking-widest">
                        {order.paymentMethod || 'Unknown'}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3 align-middle">
                      <span className={`inline-flex items-center px-2 py-1 border rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${getStatusBadge(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="p-3 text-right align-middle">
                      <button 
                        onClick={() => router.push(`/OrderDetails?orderId=${order.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-sm"
                      >
                        <FaEye size={10} /> 
                        <span>View</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Orders;