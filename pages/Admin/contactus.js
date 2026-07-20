"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { 
  FaPhoneAlt, 
  FaEnvelope, 
  FaTrash, 
  FaEye, 
  FaChevronLeft, 
  FaChevronRight,
  FaSearch,
  FaTimes
} from 'react-icons/fa';

const ContactUsAdmin = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch all contacts from Firebase
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection("n3dcontacts")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setContacts(data);
        setFilteredContacts(data);
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  // Search functionality
  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
    setCurrentPage(1);
  }, [searchTerm, contacts]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const currentContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const deleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      try {
        await firebase.firestore().collection("n3dcontacts").doc(id).delete();
      } catch (error) {
        alert("Error deleting message. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                  <FaEnvelope className="text-white" />
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-white">Contact Messages</h1>
              </div>
              <p className="text-zinc-400 text-lg">Manage and respond to customer inquiries</p>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-6xl font-black text-white tabular-nums">{filteredContacts.length}</div>
                <p className="text-xs uppercase tracking-[3px] text-zinc-500 font-medium">Total Messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Search & Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500">
              <FaSearch size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, subject or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-600 pl-14 py-4 rounded-3xl text-base placeholder:text-zinc-500 focus:outline-none transition-all"
            />
          </div>
          
          <button
            onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
            className="flex items-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-3xl font-semibold transition-all active:scale-95"
          >
            <FaTimes /> CLEAR FILTER
          </button>
        </div>

        {/* Main Table Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-zinc-700 border-t-red-600 rounded-full mb-6"></div>
              <p className="text-zinc-400 font-medium">Loading messages...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950">
                      <th className="text-left px-8 py-6 font-semibold text-xs uppercase tracking-widest text-zinc-400">Date</th>
                      <th className="text-left px-8 py-6 font-semibold text-xs uppercase tracking-widest text-zinc-400">Name</th>
                      <th className="text-left px-8 py-6 font-semibold text-xs uppercase tracking-widest text-zinc-400">Contact</th>
                      <th className="text-left px-8 py-6 font-semibold text-xs uppercase tracking-widest text-zinc-400">Subject</th>
                      <th className="text-left px-8 py-6 font-semibold text-xs uppercase tracking-widest text-zinc-400">Message Preview</th>
                      <th className="text-center px-8 py-6 font-semibold text-xs uppercase tracking-widest text-zinc-400 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {currentContacts.length > 0 ? (
                      currentContacts.map((contact) => (
                        <tr 
                          key={contact.id} 
                          className="hover:bg-zinc-800/70 transition-colors group"
                        >
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="font-medium text-sm">
                              {contact.timestamp.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {contact.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          
                          <td className="px-8 py-6 font-semibold text-white">
                            {contact.name}
                          </td>
                          
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1 text-sm">
                              <a 
                                href={`mailto:${contact.email}`} 
                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <FaEnvelope className="text-xs" /> {contact.email}
                              </a>
                              {contact.phone && (
                                <a 
                                  href={`tel:${contact.phone}`} 
                                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                  <FaPhoneAlt className="text-xs" /> {contact.phone}
                                </a>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-8 py-6 font-medium text-zinc-100 pr-12">
                            {contact.subject}
                          </td>
                          
                          <td className="px-8 py-6 text-sm text-zinc-400 max-w-md">
                            <div className="line-clamp-2 leading-relaxed">
                              {contact.message}
                            </div>
                          </td>
                          
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => setSelectedContact(contact)}
                                className="p-3.5 hover:bg-blue-950 text-blue-400 hover:text-blue-300 rounded-2xl transition-all hover:scale-105"
                                title="View full message"
                              >
                                <FaEye size={18} />
                              </button>
                              <button
                                onClick={() => deleteContact(contact.id)}
                                className="p-3.5 hover:bg-red-950 text-red-400 hover:text-red-300 rounded-2xl transition-all hover:scale-105"
                                title="Delete message"
                              >
                                <FaTrash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-28">
                          <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <FaEnvelope className="text-3xl text-zinc-600" />
                          </div>
                          <p className="text-xl font-medium text-zinc-400">No messages found</p>
                          <p className="text-zinc-500 mt-2">Try adjusting your search terms</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-6 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
                  <p className="text-sm text-zinc-500">
                    Showing <span className="font-medium text-zinc-300">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span> to{" "}
                    <span className="font-medium text-zinc-300">
                      {Math.min(currentPage * itemsPerPage, filteredContacts.length)}
                    </span> of{" "}
                    <span className="font-medium text-zinc-300">{filteredContacts.length}</span> messages
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center w-11 h-11 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 rounded-2xl transition-all"
                    >
                      <FaChevronLeft />
                    </button>
                    
                    <div className="px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl font-mono text-sm font-medium">
                      {currentPage} / {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center w-11 h-11 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 rounded-2xl transition-all"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced View Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-zinc-700 flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Message Details</h2>
                <p className="text-zinc-500 mt-2 text-sm">
                  {selectedContact.timestamp.toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-zinc-400 hover:text-white p-3 -mr-3 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-10 space-y-10">
              {/* Sender Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="uppercase text-xs tracking-widest text-zinc-500 font-medium mb-3">FROM</p>
                  <p className="text-2xl font-semibold text-white">{selectedContact.name}</p>
                  <a href={`mailto:${selectedContact.email}`} className="text-blue-400 hover:underline block mt-1">
                    {selectedContact.email}
                  </a>
                  {selectedContact.phone && (
                    <a href={`tel:${selectedContact.phone}`} className="text-zinc-400 hover:text-white mt-1 block">
                      {selectedContact.phone}
                    </a>
                  )}
                </div>
                
                <div>
                  <p className="uppercase text-xs tracking-widest text-zinc-500 font-medium mb-3">SUBJECT</p>
                  <p className="text-xl font-medium leading-tight">{selectedContact.subject}</p>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <p className="uppercase text-xs tracking-widest text-zinc-500 font-medium mb-4">MESSAGE</p>
                <div className="bg-black/50 border border-zinc-800 p-8 rounded-3xl text-[15.5px] leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 border-t border-zinc-700 flex justify-end bg-zinc-950">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-12 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUsAdmin;