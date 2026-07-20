"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { 
  FaUsers, 
  FaUserCheck, 
  FaUserClock, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // Adjust how many users to show per page

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await firebase
          .firestore()
          .collection('n3duser')
          .orderBy('createdAt', 'desc')
          .get();

        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Date Formatter
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Dashboard Stats Calculations ---
  const totalUsers = users.length;
  const verifiedUsers = users.filter(user => user.verified).length;
  const unverifiedUsers = totalUsers - verifiedUsers;

  // --- Pagination Logic ---
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">User Management</h2>
        <p className="text-sm text-gray-500 mt-1">Overview and management of all registered users.</p>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Total Users Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Users</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalUsers}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FaUsers size={24} />
          </div>
        </div>

        {/* Verified Users Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Verified</p>
            <h3 className="text-3xl font-bold text-gray-900">{verifiedUsers}</h3>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <FaUserCheck size={24} />
          </div>
        </div>

        {/* Unverified Users Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Unverified</p>
            <h3 className="text-3xl font-bold text-gray-900">{unverifiedUsers}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <FaUserClock size={24} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">S.No</th>
                <th className="px-6 py-4">Mobile Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentUsers.length > 0 ? (
                currentUsers.map((user, index) => {
                  // Calculate correct serial number across pages
                  const serialNumber = indexOfFirstUser + index + 1;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                        {serialNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {user.mobileNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.verified 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {user.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <FaUsers className="mx-auto text-gray-300 text-4xl mb-3" />
                    <p className="text-lg font-medium text-gray-600">No users found</p>
                    <p className="text-sm">There are no registered users in the database yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-600 font-medium">
              Showing <span className="font-semibold text-gray-900">{indexOfFirstUser + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastUser, totalUsers)}</span> of <span className="font-semibold text-gray-900">{totalUsers}</span> users
            </span>
            
            <div className="flex gap-2">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft size={10} /> Prev
              </button>
              
              {/* Optional: Page Numbers could go here */}
              <div className="flex items-center px-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </div>

              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Users;