"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import { 
  FaStar, 
  FaUpload, 
  FaTimes, 
  FaCheckCircle,
  FaMapMarkerAlt
} from 'react-icons/fa';

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State updated with 'city'
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    message: '',
    rating: 0,
  });
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Fetch Reviews
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection("n3dreviews")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setReviews(data);
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  // Calculate Stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1) 
    : 0;

  const handleStarClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreviewPhoto(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreviewPhoto(null);
  };

  const removeVideo = () => {
    setVideo(null);
    setPreviewVideo(null);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    // Added city to validation
    if (!formData.name || !formData.city || !formData.message || formData.rating === 0) {
      alert("Please fill all required fields and select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      let photoURL = '';
      let videoURL = '';

      if (photo) {
        const photoRef = firebase.storage().ref(`n3dreviews/photos/${Date.now()}_${photo.name}`);
        await photoRef.put(photo);
        photoURL = await photoRef.getDownloadURL();
      }

      if (video) {
        const videoRef = firebase.storage().ref(`n3dreviews/videos/${Date.now()}_${video.name}`);
        await videoRef.put(video);
        videoURL = await videoRef.getDownloadURL();
      }

      // Added city to Firestore payload
      await firebase.firestore().collection("n3dreviews").add({
        name: formData.name,
        city: formData.city,
        message: formData.message,
        rating: formData.rating,
        photoURL,
        videoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Reset form including city
      setFormData({ name: '', city: '', message: '', rating: 0 });
      setPhoto(null); setVideo(null);
      setPreviewPhoto(null); setPreviewVideo(null);
      setShowModal(false);

      alert("Thank you! Your review has been submitted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to determine Flipkart-style badge color based on rating
  const getBadgeColor = (rating) => {
    if (rating >= 4) return "bg-green-600";
    if (rating === 3) return "bg-orange-500";
    return "bg-red-500";
  };

  // Keep interactive stars for the review submission modal
  const renderInteractiveStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className="cursor-pointer transition-transform hover:scale-110"
        onClick={() => handleStarClick(i + 1)}
      >
        <FaStar className={`text-3xl ${i + 1 <= rating ? 'text-yellow-500' : 'text-gray-300'}`} />
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-black  px-4 sm:px-6 font-sans">
      <div className="w-full  shadow-sm border border-gray-200 rounded-sm">
        
        {/* Header & Stats Bar (Flipkart Style) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Ratings & Reviews</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-green-500 text-2xl font-bold text-gray-800">
                  {averageRating} <FaStar className="text-sm ml-1 text-green-500" />
                </div>
                <div className="text-sm text-gray-500">
                  <p className="font-medium text-gray-800">{totalReviews} Ratings</p>
                  <p>& {totalReviews} Reviews</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-white border border-gray-300 hover:shadow-md text-gray-800 px-8 py-2.5 rounded-sm font-medium text-sm transition-all shadow-sm"
          >
            Rate Product
          </button>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div className="flex flex-col">
            {reviews.map((review, index) => (
              <div
                key={review.id}
                className={`p-6 ${index !== reviews.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                {/* Rating Badge & Message */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`${getBadgeColor(review.rating)} text-white flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs font-bold mt-0.5`}>
                    {review.rating} <FaStar size={10} />
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed flex-1">
                    {review.message}
                  </p>
                </div>

                {/* Compact Media Thumbnails */}
                {(review.photoURL || review.videoURL) && (
                  <div className="flex gap-2 mb-4 ml-10">
                    {review.photoURL && (
                      <div className="w-16 h-16 border border-gray-200 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        <img src={review.photoURL} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {review.videoURL && (
                      <div className="w-16 h-16 border border-gray-200 rounded-sm overflow-hidden bg-black flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                        <video src={review.videoURL} className="w-full h-full object-cover opacity-70" />
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Data (Name, City, Certified Buyer, Date) */}
                <div className="flex items-center justify-between mt-4 ml-10 text-xs text-gray-500 font-medium">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-gray-600 font-semibold">{review.name}</span>
                    {review.city && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <FaMapMarkerAlt size={10} /> {review.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-gray-400 ml-1">
                      <FaCheckCircle className="text-gray-400" size={12} /> Certified Buyer
                    </span>
                  </div>
                  <span className="whitespace-nowrap">
                    {review.timestamp.toLocaleDateString('en-US', { 
                      month: 'short', year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white">
            <p className="text-lg text-gray-800 font-medium">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to rate this product</p>
          </div>
        )}
      </div>

      {/* Compact E-Commerce Style Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-sm shadow-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800">Write a Review</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={submitReview} className="p-5 space-y-5">
              {/* Rating */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Rating</label>
                <div className="flex gap-2">
                  {renderInteractiveStars(formData.rating)}
                </div>
              </div>

              {/* Name & City Side-by-Side */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-blue-500 focus:outline-none text-sm transition-colors"
                    placeholder="Full name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-blue-500 focus:outline-none text-sm transition-colors"
                    placeholder="e.g. Prayagraj"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:border-blue-500 focus:outline-none text-sm transition-colors resize-y"
                  placeholder="Is the product good? How is the quality?"
                />
              </div>

              {/* File Uploads (Compact) */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <label htmlFor="photo-upload" className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-gray-400 rounded-sm text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                    <FaUpload /> Photo
                  </label>
                  {previewPhoto && (
                    <div className="mt-2 relative inline-block">
                      <img src={previewPhoto} alt="Preview" className="h-12 w-12 object-cover border rounded-sm" />
                      <button type="button" onClick={removePhoto} className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5"><FaTimes size={10} /></button>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <input type="file" id="video-upload" accept="video/*" onChange={handleVideoChange} className="hidden" />
                  <label htmlFor="video-upload" className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-gray-400 rounded-sm text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                    <FaUpload /> Video
                  </label>
                  {previewVideo && (
                    <div className="mt-2 relative inline-block">
                      <video src={previewVideo} className="h-12 w-12 object-cover border rounded-sm" />
                      <button type="button" onClick={removeVideo} className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5"><FaTimes size={10} /></button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#fb641b] hover:bg-[#f05a11] text-white font-medium text-sm rounded-sm transition-all disabled:opacity-70 mt-2 shadow-sm"
              >
                {submitting ? "Submitting..." : "SUBMIT"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;