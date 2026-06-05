import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetching from the 'n3duser' collection created in your login flow
        const snapshot = await firebase
          .firestore()
          .collection('n3duser')
          .orderBy('createdAt', 'desc') // Orders newest users first
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

  // Helper function to format Firebase Timestamp to a readable string
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'; // Handles users that might not have a timestamp yet
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registered Users</h2>
        <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
          Total: {users.length}
        </span>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
               
                <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-4 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user,index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                 
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-900 whitespace-no-wrap font-medium">
                       {index+1}. {user.mobileNumber || 'N/A'}
                      </p>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${user.verified ? 'text-green-900' : 'text-red-900'}`}>
                        <span aria-hidden className={`absolute inset-0 opacity-50 rounded-full ${user.verified ? 'bg-green-200' : 'bg-red-200'}`}></span>
                        <span className="relative text-xs">
                          {user.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 text-sm">
                      <p className="text-gray-600 whitespace-no-wrap">
                        {formatDate(user.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center border-b border-gray-200 text-sm text-gray-500">
                    No users found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;