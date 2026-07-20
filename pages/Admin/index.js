import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';

const AdminDashboard = () => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  
  // Statistics State
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    orders: 0,
    contacts: 0
  });

  // Recent Data States
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentContacts, setRecentContacts] = useState([]);

  // Offers Data States
  const [offers, setOffers] = useState([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [offerForm, setOfferForm] = useState({
    code: '',
    discount: '',
    minOrder: '',
    validTill: ''
  });

  const db = firebase.firestore();

  // --- FETCH DATA ---
  useEffect(() => {
    fetchDashboardData();
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const prodSnap = await db.collection('n3dproducts').get();
      const usersSnap = await db.collection('n3duser').get();
      const allOrdersSnap = await db.collection('n3dorders').get();
      const allContactsSnap = await db.collection('n3dcontact').get();

      setStats({
        products: prodSnap.empty ? 0 : prodSnap.size,
        users: usersSnap.empty ? 0 : usersSnap.size,
        orders: allOrdersSnap.empty ? 0 : allOrdersSnap.size,
        contacts: allContactsSnap.empty ? 0 : allContactsSnap.size
      });

      const ordersLimitSnap = await db.collection('n3dorders').orderBy('createdAt', 'desc').limit(5).get();
      const contactsLimitSnap = await db.collection('n3dcontact').orderBy('createdAt', 'desc').limit(5).get();

      setRecentOrders(ordersLimitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRecentContacts(contactsLimitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Error fetching dashboard metrics: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const offersSnap = await db.collection('n3doffers').orderBy('createdAt', 'desc').get();
      setOffers(offersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching offers: ", error);
    }
  };

  // --- OFFER HANDLERS ---
  const handleOfferFormChange = (e) => {
    setOfferForm({ ...offerForm, [e.target.name]: e.target.value });
  };

  const handleOpenAddOffer = () => {
    setOfferForm({ code: '', discount: '', minOrder: '', validTill: '' });
    setEditingOfferId(null);
    setIsOfferModalOpen(true);
  };

  const handleEditOffer = (offer) => {
    setOfferForm({
      code: offer.code,
      discount: offer.discount,
      minOrder: offer.minOrder,
      validTill: offer.validTill
    });
    setEditingOfferId(offer.id);
    setIsOfferModalOpen(true);
  };

  const handleDeleteOffer = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        await db.collection('n3doffers').doc(id).delete();
        fetchOffers();
      } catch (error) {
        console.error("Error deleting offer: ", error);
      }
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    try {
      const offerData = {
        code: offerForm.code.toUpperCase(),
        discount: Number(offerForm.discount),
        minOrder: Number(offerForm.minOrder),
        validTill: offerForm.validTill,
      };

      if (editingOfferId) {
        await db.collection('n3doffers').doc(editingOfferId).update({
          ...offerData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await db.collection('n3doffers').add({
          ...offerData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      setIsOfferModalOpen(false);
      fetchOffers();
    } catch (error) {
      console.error("Error saving offer: ", error);
    }
  };

  // --- UI HELPERS ---
  const statCardClasses = "p-5 rounded-xl border shadow-sm flex items-center justify-between transform hover:-translate-y-1 transition-transform cursor-pointer";

  return (
    <div className="min-h-screen bg-white p-2 md:p-6 font-sans text-slate-800 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      
      <div className="max-w-[1600px] mx-auto flex flex-col min-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white/70 backdrop-blur-md p-5 rounded-xl border border-white shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">System Overview</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">High-level metrics and recent database activities.</p>
          </div>
          <button onClick={() => { fetchDashboardData(); fetchOffers(); }} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            ↻ Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32 flex-1">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-slate-900"></div>
          </div>
        ) : (
          <div className="flex-1 space-y-6">
            
            {/* ================= KPI STATS GRID ================= */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/admin/products" className={`${statCardClasses} bg-slate-900 text-white border-slate-800`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Products</p>
                  <p className="text-3xl font-black mt-1">{stats.products}</p>
                </div>
                <div className="text-2xl opacity-50">📦</div>
              </a>
              
              <a href="/admin/users" className={`${statCardClasses} bg-white border-slate-200`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Registered Users</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stats.users}</p>
                </div>
                <div className="text-2xl text-slate-300">👥</div>
              </a>

              <a href="/admin/orders" className={`${statCardClasses} bg-white border-slate-200`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Orders</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stats.orders}</p>
                </div>
                <div className="text-2xl text-slate-300">🛒</div>
              </a>

              <a href="/admin/contact" className={`${statCardClasses} bg-white border-slate-200`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Support Queries</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stats.contacts}</p>
                </div>
                <div className="text-2xl text-slate-300">✉️</div>
              </a>
            </div>

      
            {/* ================= RECENT DATA TABLES ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Orders Block */}
              <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Recent Orders</h3>
                  <a href="/Admin/orders" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide bg-white border border-slate-200 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                    View Complete Array →
                  </a>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-4 py-3 w-10 text-center">#</th>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 text-xs truncate max-w-[100px]">{order.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{order.userName || 'Guest User'}</td>
                          <td className="px-4 py-3 font-black text-slate-900">₹{order.totalAmount || '0'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-1 text-[9px] font-bold uppercase rounded ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {order.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="p-8 text-center text-xs font-medium text-slate-400">No recent orders detected.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Contact Queries Block */}
              <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Support Tickets</h3>
                  <a href="/Admin/contactus" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide bg-white border border-slate-200 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                    View Complete Array →
                  </a>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-4 py-3 w-10 text-center">#</th>
                        <th className="px-4 py-3">Sender</th>
                        <th className="px-4 py-3">Subject / Message</th>
                        <th className="px-4 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentContacts.length > 0 ? recentContacts.map((msg, index) => {
                        const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'N/A';
                        return (
                          <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900 text-xs">{msg.name || 'Anonymous'}</p>
                              <p className="text-[10px] font-medium text-slate-500">{msg.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{msg.subject || 'No Subject'}</p>
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-bold text-slate-400">
                              {msgDate}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="4" className="p-8 text-center text-xs font-medium text-slate-400">No support tickets currently queued.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
                  {/* ================= OFFERS MANAGEMENT ================= */}
                  <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Active Offers & Coupons</h3>
                <button 
                  onClick={handleOpenAddOffer}
                  className="text-[10px] font-bold text-white uppercase tracking-wide bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors shadow-sm"
                >
                  + Add Offer
                </button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-4 py-3 w-10 text-center">#</th>
                      <th className="px-4 py-3">Coupon Code</th>
                      <th className="px-4 py-3">Discount (₹)</th>
                      <th className="px-4 py-3">Min Order (₹)</th>
                      <th className="px-4 py-3">Valid Till</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {offers.length > 0 ? offers.map((offer, index) => (
                      <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3 font-black text-slate-900 tracking-wider">{offer.code}</td>
                        <td className="px-4 py-3 font-bold text-green-600">₹{offer.discount}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">₹{offer.minOrder}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">{offer.validTill}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => handleEditOffer(offer)} className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase hover:bg-blue-200">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteOffer(offer.id)} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase hover:bg-red-200">
                            Delete
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="p-8 text-center text-xs font-medium text-slate-400">No active offers. Click "+ Add Offer" to create one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ================= OFFER FORM MODAL ================= */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-black text-slate-900">{editingOfferId ? 'Edit Offer' : 'Create New Offer'}</h3>
              <button onClick={() => setIsOfferModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleOfferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  name="code"
                  required
                  value={offerForm.code} 
                  onChange={handleOfferFormChange} 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 uppercase"
                  placeholder="e.g. SUMMER50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Discount (₹)</label>
                  <input 
                    type="number" 
                    name="discount"
                    required
                    value={offerForm.discount} 
                    onChange={handleOfferFormChange} 
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Min Order (₹)</label>
                  <input 
                    type="number" 
                    name="minOrder"
                    required
                    value={offerForm.minOrder} 
                    onChange={handleOfferFormChange} 
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Valid Till</label>
                <input 
                  type="date" 
                  name="validTill"
                  required
                  value={offerForm.validTill} 
                  onChange={handleOfferFormChange} 
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOfferModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                >
                  {editingOfferId ? 'Update Offer' : 'Save Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;