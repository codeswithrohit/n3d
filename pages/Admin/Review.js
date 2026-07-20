"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { FaStar, FaTrash, FaUser, FaMapMarkerAlt } from 'react-icons/fa';

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Reviews from Firestore
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection("n3dreviews")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          const fetchedReviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Safely handle Firebase timestamps
            timestamp: doc.data().timestamp?.toDate() || new Date()
          }));
          setReviews(fetchedReviews);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching reviews:", error);
          setLoading(false);
        }
      );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 2. Delete functionality
  const handleDelete = async (id) => {
    // Add a confirmation to prevent accidental clicks
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        await firebase.firestore().collection("n3dreviews").doc(id).delete();
        // Note: No need to manually update the state here because onSnapshot will automatically detect the deletion and update the UI.
        alert("Review deleted successfully.");
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete the review. Please try again.");
      }
    }
  };

  // Helper to render stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar 
        key={i} 
        size={14}
        className={i < rating ? 'text-yellow-500' : 'text-gray-300'} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Manage Reviews</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage customer feedback</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-sm border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
            Total: {reviews.length}
          </div>
        </div>

        {/* Reviews Container */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 font-medium">Loading reviews...</span>
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
              >
                {/* Card Header: User Info & Delete */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <FaUser size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{review.name || 'Anonymous'}</h3>
                      {review.city && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <FaMapMarkerAlt size={10} /> {review.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(review.id)}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete Review"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>

                {/* Card Body: Rating & Message */}
                <div className="p-4 flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-0.5">
                      {renderStars(review.rating || 0)}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {review.timestamp.toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {review.message}
                  </p>
                </div>

                {/* Card Footer: Media Thumbnails */}
                {(review.photoURL || review.videoURL) && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                    {review.photoURL && (
                      <a href={review.photoURL} target="_blank" rel="noreferrer" className="block w-12 h-12 border border-gray-200 rounded-sm overflow-hidden hover:opacity-80 transition-opacity">
                        <img src={review.photoURL} alt="User Upload" className="w-full h-full object-cover" />
                      </a>
                    )}
                    {review.videoURL && (
                      <a href={review.videoURL} target="_blank" rel="noreferrer" className="block w-12 h-12 border border-gray-200 bg-black rounded-sm overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity">
                        <video src={review.videoURL} className="w-full h-full object-cover opacity-70" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-sm shadow-sm">
            <p className="text-gray-500 text-lg">No reviews found in the database.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Review;