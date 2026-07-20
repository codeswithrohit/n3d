"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { firebase } from '../Firebase/config';
import {
  FaStar,
  FaUpload,
  FaTimes,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft
} from 'react-icons/fa';

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form States
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

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSlideTimer = useRef(null);

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

  // Stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : 0;

  // --- Carousel Logic ---
  const nextSlide = useCallback(() => {
    if (totalReviews <= 3) return;
    setCurrentIndex((prev) => (prev + 1) % totalReviews);
  }, [totalReviews]);

  const prevSlide = () => {
    if (totalReviews <= 3) return;
    setCurrentIndex((prev) => (prev - 1 + totalReviews) % totalReviews);
  };

  // Auto-Slide Effect
  useEffect(() => {
    if (totalReviews > 3) {
      autoSlideTimer.current = setInterval(nextSlide, 5000); // Auto slide every 5 seconds
    }
    return () => {
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    };
  }, [nextSlide, totalReviews, currentIndex]);

  // Pause auto-slide on manual interaction
  const resetTimer = () => {
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = setInterval(nextSlide, 5000);
    }
  };

  const handleNextClick = () => {
    nextSlide();
    resetTimer();
  };

  const handlePrevClick = () => {
    prevSlide();
    resetTimer();
  };

  // Get exactly 3 visible reviews (wrapping around the array)
  const getVisibleReviews = () => {
    if (totalReviews === 0) return [];
    if (totalReviews <= 3) return reviews;
    
    let visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(reviews[(currentIndex + i) % totalReviews]);
    }
    return visible;
  };

  // --- Form Handlers ---
  const handleStarClick = (rating) => setFormData(prev => ({ ...prev, rating }));
  
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

  const removePhoto = () => { setPhoto(null); setPreviewPhoto(null); };
  const removeVideo = () => { setVideo(null); setPreviewVideo(null); };

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

      // Reset
      setFormData({ name: '', city: '', message: '', rating: 0 });
      setPhoto(null); setVideo(null);
      setPreviewPhoto(null); setPreviewVideo(null);
      setShowModal(false);
      setCurrentIndex(0); 
      alert("Thank you! Your review has been submitted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans py-16 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Modern Header Area */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 md:p-12 mb-16 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 w-32 h-32 rounded-2xl shadow-inner">
                <div className="text-5xl font-black text-white">{averageRating}</div>
                <div className="flex text-yellow-400 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar key={i} className="text-sm" />
                  ))}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Customer Feedback</h1>
                <p className="text-zinc-400 flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  Based on {totalReviews} verified reviews
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Write a Review
            </button>
          </div>
        </div>

        {/* Carousel Area */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="relative group">
            
            {/* Left Nav Button */}
            {totalReviews > 3 && (
              <button 
                onClick={handlePrevClick}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 bg-zinc-800 hover:bg-white hover:text-black text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl opacity-0 group-hover:opacity-100 disabled:opacity-0"
              >
                <FaChevronLeft size={18} />
              </button>
            )}

            {/* Cards Grid (Shows Exactly 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden py-4">
              {getVisibleReviews().map((review, idx) => (
                <div
                  key={review.id + idx}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-2xl p-6 flex flex-col h-full min-h-[320px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/5"
                >
                  {/* Rating & Quote Icon */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex text-yellow-400 gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-zinc-700"} />
                      ))}
                    </div>
                    <FaQuoteLeft className="text-zinc-700 text-xl" />
                  </div>

                  {/* Review Message (Clamped to prevent uneven card heights) */}
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6 flex-grow line-clamp-4">
                    "{review.message}"
                  </p>

                  {/* Attached Media */}
                  {(review.photoURL || review.videoURL) && (
                    <div className="flex gap-2 mb-5">
                      {review.photoURL && (
                        <img src={review.photoURL} alt="Review" className="w-14 h-14 object-cover rounded-lg border border-zinc-700" />
                      )}
                      {review.videoURL && (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-700">
                          <video src={review.videoURL} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[10px]">▶</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{review.name}</h4>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <FaMapMarkerAlt size={10} /> {review.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full flex items-center gap-1 mb-1">
                        <FaCheckCircle /> Verified
                      </span>
                      <span className="text-xs text-zinc-600 block">
                        {review.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Nav Button */}
            {totalReviews > 3 && (
              <button 
                onClick={handleNextClick}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 bg-zinc-800 hover:bg-white hover:text-black text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl opacity-0 group-hover:opacity-100 disabled:opacity-0"
              >
                <FaChevronRight size={18} />
              </button>
            )}

            {/* Pagination Dots */}
            {totalReviews > 3 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalReviews }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-zinc-700'}`} 
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-2xl font-bold mb-2">No reviews yet</p>
            <p className="text-zinc-500">Be the first to share your experience with us!</p>
          </div>
        )}
      </div>

      {/* Modern Write Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white">Share Your Experience</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-800 p-2 rounded-full">
                <FaTimes size={14} />
              </button>
            </div>
        
            {/* Scrollable Form Body */}
            <form onSubmit={submitReview} className="p-6 space-y-6 overflow-y-auto hide-scrollbar">
              
              {/* Rating Stars */}
              <div className="flex flex-col items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800/50">
                <label className="block text-sm font-medium text-zinc-400 mb-3">Rate your product</label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className="cursor-pointer transition-transform hover:scale-110" onClick={() => handleStarClick(i + 1)}>
                      <FaStar className={`text-4xl transition-colors ${i + 1 <= formData.rating ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-zinc-700'}`} />
                    </span>
                  ))}
                </div>
              </div>
        
              {/* Name & City Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white outline-none text-white transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white outline-none text-white transition-all" placeholder="New York" />
                </div>
              </div>
        
              {/* Review Message */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Your Review</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} required rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-white focus:ring-1 focus:ring-white outline-none text-white resize-none transition-all" placeholder="What did you like or dislike?" />
              </div>
        
              {/* Media Upload Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo Upload */}
                <div>
                  <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center justify-center border border-dashed border-zinc-700 hover:border-white hover:bg-zinc-900 rounded-xl p-5 transition-all group">
                    <FaUpload className="text-zinc-500 group-hover:text-white mb-2" size={18} />
                    <span className="text-xs text-zinc-400 group-hover:text-white font-medium">Add Photo</span>
                  </label>
                  <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  
                  {previewPhoto && (
                    <div className="mt-3 relative inline-block">
                      <img src={previewPhoto} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-zinc-700 shadow-lg" />
                      <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><FaTimes size={10} /></button>
                    </div>
                  )}
                </div>
        
                {/* Video Upload */}
                <div>
                  <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center justify-center border border-dashed border-zinc-700 hover:border-white hover:bg-zinc-900 rounded-xl p-5 transition-all group">
                    <FaUpload className="text-zinc-500 group-hover:text-white mb-2" size={18} />
                    <span className="text-xs text-zinc-400 group-hover:text-white font-medium">Add Video</span>
                  </label>
                  <input type="file" id="video-upload" accept="video/*" onChange={handleVideoChange} className="hidden" />
                  
                  {previewVideo && (
                    <div className="mt-3 relative inline-block">
                      <video src={previewVideo} className="h-16 w-16 object-cover rounded-xl border border-zinc-700 shadow-lg" />
                      <button type="button" onClick={removeVideo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><FaTimes size={10} /></button>
                    </div>
                  )}
                </div>
              </div>
        
              {/* Submit Button */}
              <button type="submit" disabled={submitting} className="w-full bg-white text-black py-4 mt-2 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                {submitting ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Publish Review"}
              </button>
        
            </form>
          </div>
        </div>
      )}

      {/* Global Style to Hide Scrollbar in modal */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Review;