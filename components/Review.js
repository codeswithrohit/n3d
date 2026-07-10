"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import {
  FaStar,
  FaUpload,
  FaTimes,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

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

  // Pagination Logic
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

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

      await firebase.firestore().collection("n3dreviews").add({
        name: formData.name,
        city: formData.city,
        message: formData.message,
        rating: formData.rating,
        photoURL,
        videoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Reset form
      setFormData({ name: '', city: '', message: '', rating: 0 });
      setPhoto(null); setVideo(null);
      setPreviewPhoto(null); setPreviewVideo(null);
      setShowModal(false);
      setCurrentPage(1); // Reset to first page after new review
      alert("Thank you! Your review has been submitted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeColor = (rating) => {
    if (rating >= 4) return "bg-emerald-500 text-white";
    if (rating === 3) return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };

  const renderInteractiveStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className="cursor-pointer transition-all hover:scale-125"
        onClick={() => handleStarClick(i + 1)}
      >
        <FaStar className={`text-4xl transition-colors ${i + 1 <= rating ? 'text-yellow-400' : 'text-gray-600'}`} />
      </span>
    ));
  };

  return (
    <div className=" bg-zinc-950 text-white font-sans">
      <div className="max-w-9xl mx-auto px-6 py-12">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bold text-white tracking-tighter">{averageRating}</div>
              <div className="flex text-yellow-400 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-xl" />
                ))}
              </div>
            </div>

            <div>
              <h1 className="text-xl font-semibold mb-1">Customer Reviews</h1>
              <p className="text-zinc-400 text-xl">
                {totalReviews} verified reviews
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black px-10 py-4 mt-8 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center gap-3 shadow-lg shadow-white/10"
          >
            <span>Write a Review</span>
          </button>
        </div>

        {/* Reviews Section */}
        {loading ? (
          <div className="text-center py-20 text-zinc-400">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <>
          <div className="space-y-4">
  {currentReviews.map((review) => (
    <div
      key={review.id}
      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 hover:bg-zinc-900 hover:border-zinc-700 transition-colors duration-200"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        
        {/* Rating Badge */}
        <div
          className={`${getBadgeColor(review.rating)} w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
        >
          {review.rating}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* Review Text */}
          <p className="text-zinc-300 text-sm leading-relaxed mb-3 break-words">
            "{review.message}"
          </p>

          {/* Media Thumbnails */}
          {(review.photoURL || review.videoURL) && (
            <div className="flex gap-3 mb-4">
              {review.photoURL && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer shrink-0">
                  <img src={review.photoURL} alt="Review" className="w-full h-full object-cover" />
                </div>
              )}
              {review.videoURL && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors cursor-pointer shrink-0 relative group">
                  <video src={review.videoURL} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-6 h-6 border border-white/80 rounded-full flex items-center justify-center text-[10px] text-white pl-[2px]">
                      ▶
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Author & Meta Info */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs pt-3 border-t border-zinc-800/60">
            
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-zinc-400">
              <span className="font-medium text-zinc-200">{review.name}</span>
              
              {review.city && (
                <span className="flex items-center gap-1.5">
                  <FaMapMarkerAlt size={11} className="text-zinc-500" /> 
                  {review.city}
                </span>
              )}
              
              <span className="flex items-center gap-1.5 text-emerald-400/90">
                <FaCheckCircle size={11} /> 
                Verified
              </span>
            </div>

            <span className="text-zinc-500 whitespace-nowrap">
              {review.timestamp.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border border-zinc-700 hover:bg-zinc-900 disabled:opacity-40 transition-all"
                >
                  <FaChevronLeft />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`w-11 h-11 rounded-xl font-medium transition-all ${
                      currentPage === page
                        ? 'bg-white text-black'
                        : 'border border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border border-zinc-700 hover:bg-zinc-900 disabled:opacity-40 transition-all"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-2xl font-medium mb-2">No reviews yet</p>
            <p className="text-zinc-400">Be the first to share your experience</p>
          </div>
        )}
      </div>

      {/* Modern Review Modal */}
      {showModal && (
     <div className="fixed inset-0 bg-black/80 mt-20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
     {/* Modal Container */}
     <div className="bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[95vh]">
       
       {/* Header */}
       <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
         <h2 className="text-lg font-semibold text-white">Write a Review</h2>
         <button
           onClick={() => setShowModal(false)}
           className="text-zinc-500 hover:text-white transition-colors p-1"
           aria-label="Close modal"
         >
           <FaTimes size={18} />
         </button>
       </div>
   
       {/* Scrollable Form Body */}
       <form onSubmit={submitReview} className="p-6 space-y-5 overflow-y-auto">
         
         {/* Rating Stars */}
         <div>
           <label className="block text-sm font-medium text-zinc-400 mb-2 text-center sm:text-left">
             How would you rate this product?
           </label>
           <div className="flex gap-2 justify-center sm:justify-start">
             {renderInteractiveStars(formData.rating)}
           </div>
         </div>
   
         {/* Name & City Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
             <input
               type="text"
               name="name"
               value={formData.name}
               onChange={handleInputChange}
               required
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 focus:outline-none text-white placeholder:text-zinc-600 transition-colors"
               placeholder="John Doe"
             />
           </div>
           <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5">City</label>
             <input
               type="text"
               name="city"
               value={formData.city}
               onChange={handleInputChange}
               required
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-500 focus:outline-none text-white placeholder:text-zinc-600 transition-colors"
               placeholder="Mumbai"
             />
           </div>
         </div>
   
         {/* Review Message */}
         <div>
           <label className="block text-xs font-medium text-zinc-400 mb-1.5">Your Review</label>
           <textarea
             name="message"
             value={formData.message}
             onChange={handleInputChange}
             required
             rows={3}
             className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-zinc-500 focus:outline-none text-white resize-none placeholder:text-zinc-600 transition-colors"
             placeholder="What did you like or dislike?"
           />
         </div>
   
         {/* Media Upload Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           
           {/* Photo Upload */}
           <div>
             <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center justify-center border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-4 transition-colors group bg-zinc-950/50 hover:bg-zinc-900">
               <FaUpload className="text-zinc-500 group-hover:text-zinc-300 mb-2 transition-colors" size={16} />
               <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">Upload Photo</span>
             </label>
             <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} className="hidden" />
             
             {previewPhoto && (
               <div className="mt-3 relative inline-block">
                 <img src={previewPhoto} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-zinc-700" />
                 <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors">
                   <FaTimes size={10} />
                 </button>
               </div>
             )}
           </div>
   
           {/* Video Upload */}
           <div>
             <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center justify-center border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-4 transition-colors group bg-zinc-950/50 hover:bg-zinc-900">
               <FaUpload className="text-zinc-500 group-hover:text-zinc-300 mb-2 transition-colors" size={16} />
               <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">Upload Video</span>
             </label>
             <input type="file" id="video-upload" accept="video/*" onChange={handleVideoChange} className="hidden" />
             
             {previewVideo && (
               <div className="mt-3 relative inline-block">
                 <video src={previewVideo} className="h-16 w-16 object-cover rounded-lg border border-zinc-700" />
                 <button type="button" onClick={removeVideo} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors">
                   <FaTimes size={10} />
                 </button>
               </div>
             )}
           </div>
         </div>
   
         {/* Submit Button */}
         <button
           type="submit"
           disabled={submitting}
           className="w-full bg-white text-zinc-900 py-3 mt-2 rounded-xl font-medium text-sm hover:bg-zinc-200 focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
         >
           {submitting ? "Submitting..." : "Submit Review"}
         </button>
   
       </form>
     </div>
   </div>
      )}
    </div>
  );
};

export default Review;