"use client";

import React, { useState, useEffect, useRef } from 'react';
import { firebase } from '../../Firebase/config';
import { FaUpload, FaEdit, FaTrash, FaVideo, FaTimes, FaPlus } from 'react-icons/fa';

const Influencer = () => {
  const db = firebase.firestore();
  const storage = firebase.storage();

  // State Management
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  
  const fileInputRef = useRef(null);

  // 1. Fetch Videos from Firestore
  useEffect(() => {
    const unsubscribe = db.collection('n3dinfluencer_videos')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const videoData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVideos(videoData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching videos: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [db]);

  // 2. Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // 3. Handle Submit (Upload / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return alert("Please enter a title");

    // Case A: Updating ONLY the title (No new video file selected)
    if (editingId && !file) {
      setUploading(true);
      try {
        await db.collection('n3dinfluencer_videos').doc(editingId).update({ 
          title,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal();
      } catch (error) {
        console.error("Error updating title:", error);
      } finally {
        setUploading(false);
      }
      return;
    }

    // Case B: Uploading a new video (New Entry or Replacing Old Video)
    if (!file) return alert("Please select a video file to upload");

    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = storage.ref(`influencer_videos/${fileName}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload Error: ", error);
        setUploading(false);
        alert("Video upload failed!");
      }, 
      async () => {
        // Upload successful, get download URL
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

        if (editingId) {
          // Update existing document
          await db.collection('n3dinfluencer_videos').doc(editingId).update({
            title,
            videoUrl: downloadURL,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Create new document
          await db.collection('n3dinfluencer_videos').add({
            title,
            videoUrl: downloadURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        closeModal();
      }
    );
  };

  // 4. Modal Controls & Edit/Delete
  const openAddModal = () => {
    setTitle('');
    setFile(null);
    setEditingId(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setFile(null);
    setEditingId(null);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (video) => {
    setTitle(video.title);
    setEditingId(video.id);
    setFile(null); 
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, videoUrl) => {
    if (!window.confirm("Are you sure you want to delete this video? This cannot be undone.")) return;

    try {
      await db.collection('n3dinfluencer_videos').doc(id).delete();
      if (videoUrl) {
        const videoRef = firebase.storage().refFromURL(videoUrl);
        await videoRef.delete().catch(err => console.log("Storage file may already be deleted:", err));
      }
    } catch (error) {
      console.error("Error deleting video: ", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-8 font-sans text-gray-800 dark:text-gray-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-neutral-800 pb-5 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <FaVideo className="text-red-500" /> Influencer Videos
            </h1>
            <p className="text-sm text-gray-500 mt-1">Upload and manage promotional video content.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <FaPlus /> Add New Video
          </button>
        </div>

        {/* Video Grid */}
        <div>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-sm">
              <div className="text-6xl mb-4 opacity-20 flex justify-center"><FaVideo /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Videos Found</h3>
              <p className="text-gray-500 font-medium mb-6">You haven't uploaded any influencer videos yet.</p>
              <button onClick={openAddModal} className="text-red-600 font-bold hover:underline">Click here to upload</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div key={video.id} className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-neutral-800 hover:shadow-lg transition-all duration-300 flex flex-col group">
                  
                  {/* Video Player - Added #t=0.1 to fix the black screen issue */}
                  <div className="w-full aspect-[9/16] sm:aspect-video bg-black relative">
                    <video 
                      src={`${video.videoUrl}#t=0.1`} 
                      controls 
                      preload="metadata"
                      className="w-full h-96 object-cover"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 leading-snug">
                        {video.title}
                      </h4>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-neutral-800">
                      <button 
                        onClick={() => handleEdit(video)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 dark:bg-neutral-950 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-800 font-semibold text-xs uppercase tracking-wider transition-colors"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(video.id, video.videoUrl)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold text-xs uppercase tracking-wider transition-colors"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingId ? <><FaEdit className="text-red-500"/> Edit Video</> : <><FaUpload className="text-red-500"/> Upload Video</>}
              </h2>
              <button onClick={closeModal} disabled={uploading} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Video Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summer Collection Promo"
                  className="w-full border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-950 px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  required
                />
              </div>

              {/* File Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {editingId ? "Replace Video File (Optional)" : "Video File (MP4, WebM)"}
                </label>
                <div className="relative border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl px-4 py-6 hover:border-red-500 dark:hover:border-red-500 transition-colors bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center cursor-pointer text-center overflow-hidden">
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-48 opacity-0 cursor-pointer"
                  />
                  <div className="bg-red-100 text-red-500 p-3 rounded-full mb-3">
                    <FaUpload size={20} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file ? file.name : (editingId ? "Drop a new video here to replace" : "Click or drag video here to upload")}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">Maximum file size: 50MB recommended</span>
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex-[2] px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {uploading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Processing...</>
                  ) : (
                    editingId ? "Save Changes" : "Upload Video"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Influencer;