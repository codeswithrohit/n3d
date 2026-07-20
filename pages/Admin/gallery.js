"use client";
import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaImage,
  FaSpinner
} from 'react-icons/fa';

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImagePath, setExistingImagePath] = useState(''); // Used to delete old image when editing/deleting

  // 1. Fetch Data from Firestore
  useEffect(() => {
    const unsubscribe = firebase.firestore()
      .collection("n3dgallery")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGalleryItems(items);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching gallery:", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({ title: '', subtitle: '' });
    setImageFile(null);
    setPreviewUrl('');
    setExistingImagePath('');
    setEditId(null);
    setIsModalOpen(false);
  };

  const openEditModal = (item) => {
    setFormData({ title: item.title, subtitle: item.subtitle });
    setPreviewUrl(item.imageUrl);
    setExistingImagePath(item.imagePath);
    setEditId(item.id);
    setIsModalOpen(true);
  };

  // 2. Submit Data (Add & Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || (!imageFile && !previewUrl)) {
      alert("Please provide a title and select an image.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = previewUrl; // Use existing URL by default if editing
      let finalImagePath = existingImagePath;

      // If user selected a NEW image, upload it
      if (imageFile) {
        const storageRef = firebase.storage().ref(`n3dgallery/${Date.now()}_${imageFile.name}`);
        await storageRef.put(imageFile);
        finalImageUrl = await storageRef.getDownloadURL();
        finalImagePath = storageRef.fullPath;

        // Optional: Delete the old image from storage if we are replacing it
        if (editId && existingImagePath) {
          try {
            await firebase.storage().ref(existingImagePath).delete();
          } catch (err) {
            console.error("Failed to delete old image:", err);
          }
        }
      }

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        imageUrl: finalImageUrl,
        imagePath: finalImagePath, // Save path to make deletion easier later
      };

      if (editId) {
        // UPDATE existing document
        await firebase.firestore().collection("n3dgallery").doc(editId).update(payload);
        alert("Item updated successfully!");
      } else {
        // ADD new document
        payload.timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await firebase.firestore().collection("n3dgallery").add(payload);
        alert("Item added to gallery!");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Data
  const handleDelete = async (id, imagePath) => {
    if (window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
      try {
        // Delete document from Firestore
        await firebase.firestore().collection("n3dgallery").doc(id).delete();
        
        // Delete image from Storage
        if (imagePath) {
          await firebase.storage().ref(imagePath).delete();
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
            <p className="text-gray-500 mt-1">Manage your images, titles, and subtitles.</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-sm"
          >
            <FaPlus /> Add New Image
          </button>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <FaSpinner className="animate-spin text-blue-600 text-3xl" />
            <span className="ml-3 text-gray-600 font-medium text-lg">Loading gallery...</span>
          </div>
        ) : galleryItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleryItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
                {/* Image Container with Hover Overlay */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="bg-white/90 hover:bg-white text-blue-600 p-2 rounded-full shadow backdrop-blur-sm transition-colors"
                      title="Edit"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.imagePath)}
                      className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-full shadow backdrop-blur-sm transition-colors"
                      title="Delete"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 truncate" title={item.subtitle}>
                    {item.subtitle || "No subtitle"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border border-dashed border-gray-300 rounded-lg">
            <FaImage className="mx-auto text-gray-300 text-5xl mb-3" />
            <p className="text-gray-500 text-lg">Your gallery is empty.</p>
            <p className="text-gray-400 text-sm mt-1">Click the button above to add your first image.</p>
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                {editId ? 'Edit Gallery Item' : 'Add New Gallery Item'}
              </h2>
              <button 
                onClick={resetForm} 
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Enter title"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Enter Subtitle"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Image *</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors relative">
                  <div className="space-y-1 text-center">
                    {previewUrl ? (
                      <div className="flex flex-col items-center">
                        <img src={previewUrl} alt="Preview" className="h-32 w-auto object-cover rounded shadow-sm mb-3" />
                        <span className="text-sm text-blue-600 font-medium">Click below to change image</span>
                      </div>
                    ) : (
                      <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                      </label>
                      {!previewUrl && <p className="pl-1">or drag and drop</p>}
                    </div>
                    {!previewUrl && <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" /> Saving...
                    </>
                  ) : (
                    editId ? "Update Item" : "Upload Image"
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

export default Gallery;