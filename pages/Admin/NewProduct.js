import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';
import dynamic from 'next/dynamic';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'react-quill-new/dist/quill.snow.css';
import {  useRouter } from "next/navigation";

// --- DYNAMICALLY IMPORT REACT QUILL ---
const ReactQuill = dynamic(
    async () => {
      const reactQuillModule = await import('react-quill-new'); 
      const Quill = reactQuillModule.default.Quill;
      
      window.Quill = Quill;
      
      const ImageResize = (await import('quill-image-resize-module-react')).default;
      Quill.register('modules/imageResize', ImageResize);
      
      if (Quill) {
        const SizeStyle = Quill.import('attributors/style/size');
        SizeStyle.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px'];
        Quill.register(SizeStyle, true);
      }
      
      return reactQuillModule.default;
    },
    { 
      ssr: false,
      loading: () => <p className="text-gray-500 animate-pulse">Loading MS-Office style editor...</p>
    }
);

// =========================================================================
// FIX: MOVED OUTSIDE THE COMPONENT!
// This prevents the toolbar from crashing and disappearing when you paste.
// =========================================================================
const quillModules = {
  toolbar: [
    [{ 'font': [] }], 
    [{ 'size': ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '32px'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }], 
    ['bold', 'italic', 'underline', 'strike'], 
    [{ 'color': [] }, { 'background': [] }], 
    [{ 'script': 'sub'}, { 'script': 'super' }], 
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
    [{ 'indent': '-1'}, { 'indent': '+1' }], 
    [{ 'direction': 'rtl' }], 
    [{ 'align': [] }], 
    ['blockquote', 'code-block'],
    ['link', 'image', 'video', 'formula'], 
    ['clean'] 
  ],
  clipboard: {
    matchVisual: false, 
  },
  imageResize: {
    modules: ['Resize', 'DisplaySize']
  }
};

const Products = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  // Edit States
  const [editProdId, setEditProdId] = useState(null);

  // Data State
  const [products, setProducts] = useState([]);

  // Form States
  const initialProdForm = {
    name: '', 
    description: '', 
    variants: [{ optionValue: '', price: '', offerPrice: '', resellPrice: '', stock: '' }],
    existingMedia: [], 
    isHotDeal: false,
    isTrending: false,
    isPopular: false
  };
  const [prodForm, setProdForm] = useState(initialProdForm);

  // New Media File State (Holds { file, previewUrl, type })
  const [prodMedia, setProdMedia] = useState([]);

  const db = firebase.firestore();
  const storage = firebase.storage();

  // --- SETUP KATEX FOR QUILL ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.katex = katex;
    }
  }, []);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodSnap = await db.collection('Newproducts').orderBy('createdAt', 'desc').get();
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  // --- MEDIA HANDLING HELPER ---
  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image'
      };
    });
    setProdMedia(prev => [...prev, ...newMedia]);
  };

  const removeNewMedia = (index) => {
    const newMedia = [...prodMedia];
    URL.revokeObjectURL(newMedia[index].preview); 
    newMedia.splice(index, 1);
    setProdMedia(newMedia);
  };

  const uploadMediaToStorage = async (mediaArray) => {
    const uploadedMedia = [];
    for (const item of mediaArray) {
      const fileName = `${Date.now()}_${item.file.name}`;
      const storageRef = storage.ref(`product_media/${fileName}`);
      await storageRef.put(item.file);
      const downloadURL = await storageRef.getDownloadURL();
      uploadedMedia.push({ url: downloadURL, type: item.type });
    }
    return uploadedMedia;
  };

  // --- CRUD: PRODUCTS ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    if(prodForm.variants.length === 0 || !prodForm.variants[0].price) {
      alert("Please add at least one variant with a valid price.");
      return;
    }

    setIsUploading(true);
    try {
      const newMediaUrls = await uploadMediaToStorage(prodMedia);
      const finalMedia = [...(prodForm.existingMedia || []), ...newMediaUrls];

      const productData = {
        name: prodForm.name,
        description: prodForm.description,
        variants: prodForm.variants,
        media: finalMedia, 
        isHotDeal: prodForm.isHotDeal,
        isTrending: prodForm.isTrending,
        isPopular: prodForm.isPopular,
      };

      if (editProdId) {
        await db.collection('Newproducts').doc(editProdId).update({
          ...productData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Product updated successfully!');
      } else {
        await db.collection('Newproducts').add({
          ...productData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Product published successfully!');
      }

      setProdForm(initialProdForm);
      setProdMedia([]);
      setEditProdId(null);
      fetchData();
    } catch (error) { 
      console.error(error); 
      alert('Failed to save product.');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditProduct = (prod) => {
    const normalizedMedia = (prod.media || prod.images || []).map(item => {
      if (typeof item === 'string') return { url: item, type: 'image' };
      return item;
    });

    setProdForm({
      name: prod.name,
      description: prod.description || '',
      variants: prod.variants && prod.variants.length > 0 ? prod.variants : [{ optionValue: '', price: '', offerPrice: '', resellPrice: '', stock: '' }],
      existingMedia: normalizedMedia,
      isHotDeal: prod.isHotDeal || false,
      isTrending: prod.isTrending || false,
      isPopular: prod.isPopular || false,
    });
    setProdMedia([]);
    setEditProdId(prod.id);
    setActiveTab('Newproducts');
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Delete this product?")) {
      await db.collection('Newproducts').doc(id).delete();
      fetchData();
    }
  };

  // --- DYNAMIC FIELD HANDLERS ---
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...prodForm.variants];
    newVariants[index][field] = value;
    setProdForm({ ...prodForm, variants: newVariants });
  };

  const addVariant = () => {
    setProdForm({
      ...prodForm, 
      variants: [...prodForm.variants, { optionValue: '', price: '', offerPrice: '', resellPrice: '', stock: '' }]
    });
  };

  const removeVariant = (index) => {
    const newVars = [...prodForm.variants];
    newVars.splice(index, 1);
    setProdForm({...prodForm, variants: newVars});
  };

  // --- RENDER HELPERS ---
  const tabClasses = (tab) => `px-6 py-3 font-semibold text-sm rounded-t-xl transition-all duration-200 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm border-t-2 border-indigo-600' : 'bg-transparent text-gray-500 hover:text-indigo-500 hover:bg-gray-100'}`;

  const renderMediaThumbnail = (mediaItem, className = "") => {
    const isVideo = mediaItem.type === 'video' || (typeof mediaItem === 'string' && mediaItem.includes('.mp4'));
    const url = mediaItem.url || mediaItem;
    
    if (isVideo) {
      return (
        <video className={className} muted playsInline>
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
    return <img src={url} alt="thumbnail" className={className} />;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-gray-800 relative">
      
      {/* QUILL EDITOR STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .ql-editor { 
          white-space: pre-wrap !important; 
          word-wrap: break-word !important; 
          font-size: 16px !important;
        }
        .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        .ql-editor p { margin-bottom: 0.75rem !important; min-height: 1rem !important; }
        .ql-editor h1, .ql-editor h2, .ql-editor h3 { font-weight: 700 !important; color: #111827 !important; }
        .ql-editor h1 { font-size: 2rem !important; margin-bottom: 0.75rem !important; }
        .ql-editor h2 { font-size: 1.75rem !important; margin-bottom: 0.75rem !important; }
        .ql-editor h3 { font-size: 1.5rem !important; margin-bottom: 0.75rem !important; }
        .ql-editor strong, .ql-editor b { font-weight: 700 !important; }
        .ql-editor em, .ql-editor i { font-style: italic !important; }
        .ql-editor u { text-decoration: underline !important; }
        
        .ql-toolbar.ql-snow {
          background-color: #f3f4f6;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #d1d5db !important;
          padding: 12px !important;
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: #d1d5db !important;
          background: #ffffff;
        }

        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before { content: '10'; }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before { content: '12'; }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before { content: '14'; }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before { content: '16'; } 
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before { content: '18'; }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before { content: '20'; }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before { content: '24'; }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="32px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="32px"]::before { content: '32'; }

        .ql-snow .ql-picker.ql-size .ql-picker-label::before { content: '16'; } 

        .ql-editor img { max-width: 100%; height: auto; border-radius: 4px; }
        .ql-formula { 
          margin: 0 4px; 
          padding: 2px 4px;
          background-color: #f8fafc;
          border-radius: 4px;
          cursor: text;
        }
        .katex { font-size: 1.15em !important; }
        
        .ql-editor ul li, .ql-editor ol li { margin-bottom: 0.25rem !important; }
        
        .display-ql .ql-editor { padding: 0 !important; background: transparent !important; }
      `}} />

      {/* GLOBAL UPLOAD OVERLAY */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
          <h2 className="text-xl font-bold">Uploading & Saving...</h2>
          <p className="text-sm text-gray-200">Please do not close the window.</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Products Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your store products, pricing, and media.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 space-x-1 overflow-x-auto">
          <button onClick={() => setActiveTab('dashboard')} className={tabClasses('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('Newproducts')} className={tabClasses('Newproducts')}>Add / Edit Products</button>
        </div>

        {loading && !isUploading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* ================= DASHBOARD VIEW ================= */}
            {activeTab === 'dashboard' && (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10">
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                    <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide">Total Products</p>
                    <p className="text-4xl font-black text-gray-900 mt-2">{products.length}</p>
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-4">All Products List</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Product</th>
                        <th className="p-4 font-semibold">Flags</th>
                        <th className="p-4 font-semibold">Variants / Stock</th>
                        <th className="p-4 font-semibold">Starting Price</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(p => {
                        const totalStock = p.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;
                        const firstMedia = (p.media && p.media[0]) || (p.images && p.images[0]);
                        
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              {firstMedia && (
                                <div className="w-12 h-12 flex-shrink-0 bg-black rounded-lg overflow-hidden border">
                                  {renderMediaThumbnail(firstMedia, "w-full h-full object-cover")}
                                </div>
                              )}
                              <span className="font-medium text-gray-900">{p.name}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {p.isHotDeal && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">Hot</span>}
                                {p.isTrending && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded">Trending</span>}
                                {p.isPopular && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">Popular</span>}
                                {!p.isHotDeal && !p.isTrending && !p.isPopular && <span className="text-xs text-gray-400">-</span>}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {p.variants?.length || 0} Options <br/>
                              <span className="text-xs font-semibold text-indigo-500">{totalStock} Total Stock</span>
                            </td>
                            <td className="p-4 font-semibold text-gray-900">
                              ₹{p.variants && p.variants.length > 0 ? p.variants[0].price : 'N/A'}
                            </td>
                            <td className="p-4 text-right space-x-2">
                            <button onClick={() => router.push(`/Newwebsite/Product-details?id=${p.id}`)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium bg-indigo-50 px-3 py-1 rounded-lg">View</button>
                              <button onClick={() => startEditProduct(p)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium bg-indigo-50 px-3 py-1 rounded-lg">Edit</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium bg-red-50 px-3 py-1 rounded-lg">Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                      {products.length === 0 && (
                        <tr><td colSpan="5" className="p-4 text-center text-gray-500">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= PRODUCTS VIEW ================= */}
            {activeTab === 'Newproducts' && (
              <div className="p-8">
                <div className="max-w-6xl mx-auto">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold">{editProdId ? 'Edit Product' : 'Publish New Product'}</h3>
                    {editProdId && (
                      <button type="button" onClick={() => { setEditProdId(null); setProdForm(initialProdForm); setProdMedia([]); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-8">
                    
                    {/* Basic Info */}
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-4">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                          <input type="text" required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. MacBook Pro M2" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
                        </div>
                      </div>

                      {/* REACT QUILL EDITOR REPLACEMENT */}
                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Description</label>
                        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                          <ReactQuill
                            value={prodForm.description}
                            onChange={(content) => setProdForm({...prodForm, description: content})}
                            modules={quillModules}
                            style={{ height: '650px', paddingBottom: '42px' }} 
                            placeholder="Describe the product details, paste images, use formatting..."
                            className="bg-white"
                          />
                        </div>
                      </div>

                      {/* Store Placement Flags */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Store Placement & Tags</label>
                        <div className="flex flex-wrap gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={prodForm.isHotDeal} onChange={e => setProdForm({...prodForm, isHotDeal: e.target.checked})} />
                            <span className="text-sm font-medium text-gray-700">🔥 Hot Deal</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={prodForm.isTrending} onChange={e => setProdForm({...prodForm, isTrending: e.target.checked})} />
                            <span className="text-sm font-medium text-gray-700">📈 Trending</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={prodForm.isPopular} onChange={e => setProdForm({...prodForm, isPopular: e.target.checked})} />
                            <span className="text-sm font-medium text-gray-700">⭐ Popular</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Media Upload (Images & Videos) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-4">Product Media (Images & Videos)</h4>
                      
                      {/* Existing Media (Edit Mode) */}
                      {prodForm.existingMedia?.length > 0 && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Already Uploaded Media</p>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {prodForm.existingMedia.map((mediaObj, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden border shadow-sm aspect-square bg-black">
                                {renderMediaThumbnail(mediaObj, "w-full h-full object-cover")}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => {
                                    const newExisting = [...prodForm.existingMedia];
                                    newExisting.splice(idx, 1);
                                    setProdForm({...prodForm, existingMedia: newExisting});
                                  }} className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600">✕</button>
                                </div>
                                {mediaObj.type === 'video' && <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Video</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-8 text-center hover:bg-indigo-50 transition-colors relative cursor-pointer">
                        <input type="file" multiple accept="image/*,video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleMediaSelect} />
                        <div className="text-indigo-500 text-4xl mb-3">📸 / 🎥</div>
                        <p className="text-base text-gray-700 font-medium">Click or drag images/videos to upload</p>
                      </div>

                      {/* New Media Previews */}
                      {prodMedia.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {prodMedia.map((mediaObj, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border shadow-sm aspect-square bg-black">
                              {mediaObj.type === 'video' ? (
                                <video src={mediaObj.preview} className="w-full h-full object-cover" controls muted />
                              ) : (
                                <img src={mediaObj.preview} alt="Preview" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                <button type="button" onClick={() => removeNewMedia(idx)} className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 pointer-events-auto">
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Variants with Independent Pricing & Stock */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">Product Variants, Pricing & Stock</h4>
                          <p className="text-sm text-gray-500">Set independent pricing and inventory stock levels.</p>
                        </div>
                        <button type="button" onClick={addVariant} className="text-sm text-white font-bold bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm">
                          + Add Variant
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {prodForm.variants.map((v, idx) => (
                          <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200 relative group">
                            
                            {/* Remove Variant Button */}
                            {prodForm.variants.length > 1 && (
                              <button type="button" onClick={() => removeVariant(idx)} className="absolute top-3 right-3 text-red-500 p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Remove Variant">
                                ✕
                              </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pr-8">
                              {/* Option Value */}
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Variant (e.g. XL, Red)</label>
                                <input type="text" required placeholder="Variant Value" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={v.optionValue} onChange={e => handleVariantChange(idx, 'optionValue', e.target.value)} />
                              </div>

                              {/* Stock */}
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 text-indigo-600">Stock Qty</label>
                                <input type="number" required placeholder="0" className="w-full border border-indigo-200 bg-indigo-50 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={v.stock} onChange={e => handleVariantChange(idx, 'stock', e.target.value)} />
                              </div>

                              {/* Price */}
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Price</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                                  <input type="number" required placeholder="0.00" className="w-full border border-gray-300 pl-7 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={v.price} onChange={e => handleVariantChange(idx, 'price', e.target.value)} />
                                </div>
                              </div>

                              {/* Offer Price */}
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Offer Price</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                                  <input type="number" placeholder="0.00" className="w-full border border-gray-300 pl-7 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={v.offerPrice} onChange={e => handleVariantChange(idx, 'offerPrice', e.target.value)} />
                                </div>
                              </div>

                              {/* Resell Price */}
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Resell Price</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                                  <input type="number" placeholder="0.00" className="w-full border border-gray-300 pl-7 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={v.resellPrice} onChange={e => handleVariantChange(idx, 'resellPrice', e.target.value)} />
                                </div>
                              </div>

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                      <button type="submit" disabled={isUploading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? 'Processing & Saving...' : (editProdId ? 'Update Product in Store' : 'Publish Product to Store')}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Products;