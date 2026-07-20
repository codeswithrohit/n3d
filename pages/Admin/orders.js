"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { firebase } from '../../Firebase/config';
import { useRouter } from 'next/navigation';
const AdminOrders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10); // Show 10 orders per page

  const STATUSES = [
    "Pending",
    "Confirm",
    "Preparing",
    "Ready For Delivery",
    "Out of Delivery",
    "Delivered"
  ];

  // Professional Status Colors for Table (Pastel/Muted tones)
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Confirm': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Preparing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ready For Delivery': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Out of Delivery': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Status Dot Colors for Dashboard
  const getStatusDotColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-slate-400';
      case 'Confirm': return 'bg-blue-500';
      case 'Preparing': return 'bg-amber-500';
      case 'Ready For Delivery': return 'bg-orange-500';
      case 'Out of Delivery': return 'bg-purple-500';
      case 'Delivered': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  // Fetch Orders
  useEffect(() => {
    const unsubscribe = firebase.firestore().collection('n3dorders')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(fetchedOrders);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please check your permissions.");
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // Update Status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await firebase.firestore().collection('n3dorders').doc(orderId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update order status. Please try again.");
    }
  };

  // Helper functions for Dates
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: 'numeric', hour12: true
    }).format(date);
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // --- DASHBOARD CALCULATIONS ---
  const dashboardStats = useMemo(() => {
    let totalRevenue = 0;
    let todayCount = 0;
    let statusCounts = {
      "Pending": 0, "Confirm": 0, "Preparing": 0,
      "Ready For Delivery": 0, "Out of Delivery": 0, "Delivered": 0
    };

    orders.forEach(order => {
      totalRevenue += Number(order.grandTotal) || 0;
      if (isToday(order.createdAt || order.orderDate)) {
        todayCount++;
      }
      const status = order.status || 'Pending';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    return { totalRevenue, todayCount, statusCounts };
  }, [orders]);

  // --- PAGINATION LOGIC ---
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Modal Handlers
  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    document.body.style.overflow = 'unset';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Loading Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Orders Center</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Monitor and manage your business transactions in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50/50 px-4 py-2 border border-emerald-100 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase">System Live</span>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-sm font-medium text-red-700 shadow-sm">
            <svg className="w-5 h-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* --- PREMIUM DASHBOARD WIDGETS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-xl text-white shadow-lg shadow-emerald-500/30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{dashboardStats.totalRevenue.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          {/* Total Orders */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{orders.length}</h3>
            </div>
          </div>

          {/* Today's Orders */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-5">
            <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-4 rounded-xl text-white shadow-lg shadow-purple-500/30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Today's Orders</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{dashboardStats.todayCount}</h3>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown (Sleek Chips) */}
        <div className="flex flex-wrap gap-3">
          {STATUSES.map(status => (
            <div key={status} className="bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-colors">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status)} shadow-sm`}></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{status}</span>
              <span className="ml-1 bg-slate-100 text-slate-700 py-0.5 px-2 rounded-full text-xs font-bold">{dashboardStats.statusCounts[status]}</span>
            </div>
          ))}
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">S.No</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Info</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <span className="text-base font-semibold text-slate-600">No orders found</span>
                        <span className="text-sm text-slate-400 mt-1">Waiting for new customers to place orders.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order, index) => {
                    // Correctly calculate serial number across pages
                    const serialNumber = indexOfFirstOrder + index + 1;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors duration-200">
                        
                        {/* 1. Serial Number */}
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                          {serialNumber}
                        </td>

                        {/* 2. Order ID & Date */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-bold text-slate-900 font-mono">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {formatDate(order.createdAt || order.orderDate)}
                            </span>
                          </div>
                        </td>

                        {/* 3. Customer Details */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {order.customerInfo?.name|| 'Guest User'}
                            </span>
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {order.userPhone || order.customerInfo?.mobileNumber || 'No Phone'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Payment & Total */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-bold text-slate-900">
                              ₹{order.grandTotal || 0}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">
                              {order.paymentMethod || 'COD'}
                            </span>
                          </div>
                        </td>

                        {/* 5. Order Status (Interactive) */}
                        <td className="px-6 py-4">
                          <div className="relative w-44">
                            <select
                              value={order.status || 'Pending'}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`appearance-none block w-full px-3.5 py-2 text-xs font-bold rounded-xl border focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer transition-colors shadow-sm ${getStatusStyle(order.status || 'Pending')}`}
                            >
                              {STATUSES.map((status) => (
                                <option key={status} value={status} className="text-slate-900 font-medium bg-white">
                                  {status}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-current opacity-50">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                              </svg>
                            </div>
                          </div>
                        </td>

                        {/* 6. Action Button */}
                        <td className="px-6 py-4 text-right">
                          <a
                      onClick={() => router.push(`/Admin/orderdetails?orderId=${order.id}`)}
                            className="inline-flex cursor-pointer items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-sm"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION FOOTER --- */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-slate-600 font-medium">
                Showing <span className="font-bold text-slate-900">{indexOfFirstOrder + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastOrder, orders.length)}</span> of <span className="font-bold text-slate-900">{orders.length}</span> orders
              </span>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Previous
                </button>
                <div className="flex items-center px-2 text-sm font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- PREMIUM ORDER DETAILS MODAL --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    Order #{selectedOrder.id.toUpperCase()}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(selectedOrder.status || 'Pending')}`}>
                    {selectedOrder.status || 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(selectedOrder.createdAt || selectedOrder.orderDate)}
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Purchased Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={item.id || index} className="flex gap-5 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.productName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-bold text-slate-900 line-clamp-2 text-base leading-snug">{item.productName}</h4>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold text-slate-600">
                              {item.variant?.optionValue && (
                                <span className="bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm">Size: {item.variant.optionValue}</span>
                              )}
                              <span className="bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm">Qty: {item.quantity}</span>
                              {item.isResell && <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">Resell Item</span>}
                            </div>
                          </div>
                          <div className="flex justify-between items-end mt-4">
                            <span className="text-sm font-medium text-slate-500">₹{item.price} each</span>
                            <span className="text-lg font-black text-slate-900">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Customer & Summary */}
                <div className="space-y-8">
                  {/* Customer Info Card */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Delivery Details</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div>
                        <span className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Customer
                        </span>
                        <span className="font-bold text-slate-900 text-base">{selectedOrder.customerInfo?.company || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Contact
                        </span>
                        <span className="font-bold text-slate-900">{selectedOrder.userPhone || selectedOrder.customerInfo?.mobileNumber}</span>
                        {selectedOrder.customerInfo?.alternateNumber && (
                          <span className="block text-slate-500 text-sm mt-0.5">{selectedOrder.customerInfo.alternateNumber}</span>
                        )}
                      </div>
                      <div>
                        <span className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Address
                        </span>
                        <span className="font-bold text-slate-900 block leading-relaxed">
                          {selectedOrder.customerInfo?.address2 && `${selectedOrder.customerInfo.address2}, `}
                          <br/>{selectedOrder.customerInfo?.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary Card */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Payment Summary</h3>
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-900/10 text-white">
                      <div className="space-y-3 text-sm mb-5 pb-5 border-b border-slate-700/60">
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Method</span>
                          <span className="font-semibold text-white bg-slate-800 px-2.5 py-1 rounded text-xs">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Subtotal</span>
                          <span className="font-medium text-white">₹{selectedOrder.subTotal || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Tax</span>
                          <span className="font-medium text-white">₹{selectedOrder.tax || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <span className="font-semibold text-slate-300 text-base">Grand Total</span>
                        <span className="font-black text-emerald-400 text-2xl tracking-tight">₹{selectedOrder.grandTotal || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => window.print()}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Receipt
              </button>
              <button 
                onClick={closeModal}
                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/20"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;