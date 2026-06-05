import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';

const Products = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit States
  const [editCatId, setEditCatId] = useState(null);
  const [editSubId, setEditSubId] = useState(null);
  const [editProdId, setEditProdId] = useState(null);

  // Data State
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Form States
  const [catForm, setCatForm] = useState({ name: '', existingSliders: [] });
  const [subCatForm, setSubCatForm] = useState({ name: '', categoryId: '' });
  
  const initialProdForm = {
    name: '', categoryId: '', subcategoryId: '', description: '', 
    variants: [{ optionValue: '', price: '', offerPrice: '', resellPrice: '', stock: '' }],
    existingImages: [],
    // New Flags
    isHotDeal: false,
    isTrending: false,
    isPopular: false
  };
  const [prodForm, setProdForm] = useState(initialProdForm);

  // New Image File States (Holds { file, previewUrl })
  const [catImages, setCatImages] = useState([]);
  const [prodImages, setProdImages] = useState([]);

  const db = firebase.firestore();
  const storage = firebase.storage();

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await db.collection('n3dcategories').orderBy('createdAt', 'desc').get();
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const subSnap = await db.collection('n3dsubcategories').orderBy('createdAt', 'desc').get();
      setSubcategories(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const prodSnap = await db.collection('n3dproducts').orderBy('createdAt', 'desc').get();
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  // --- IMAGE HANDLING HELPER ---
  const handleImageSelect = (e, setImagesState) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImagesState(prev => [...prev, ...newImages]);
  };

  const removeNewImage = (index, imagesState, setImagesState) => {
    const newImages = [...imagesState];
    URL.revokeObjectURL(newImages[index].preview); 
    newImages.splice(index, 1);
    setImagesState(newImages);
  };

  const uploadImagesToStorage = async (imageArray, folderName) => {
    const uploadedUrls = [];
    for (const item of imageArray) {
      const fileName = `${Date.now()}_${item.file.name}`;
      const storageRef = storage.ref(`${folderName}/${fileName}`);
      await storageRef.put(item.file);
      const downloadURL = await storageRef.getDownloadURL();
      uploadedUrls.push(downloadURL);
    }
    return uploadedUrls;
  };

  // --- CRUD: CATEGORIES ---
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const newSliderUrls = await uploadImagesToStorage(catImages, 'category_sliders');
      const finalSliders = [...(catForm.existingSliders || []), ...newSliderUrls];

      if (editCatId) {
        await db.collection('n3dcategories').doc(editCatId).update({
          name: catForm.name,
          sliders: finalSliders,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Category updated successfully!');
      } else {
        await db.collection('n3dcategories').add({
          name: catForm.name,
          sliders: finalSliders,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Category added successfully!');
      }

      setCatForm({ name: '', existingSliders: [] });
      setCatImages([]);
      setEditCatId(null);
      fetchData();
    } catch (error) { 
      console.error(error); 
      alert('Failed to save category.');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditCategory = (cat) => {
    setCatForm({ name: cat.name, existingSliders: cat.sliders || [] });
    setCatImages([]);
    setEditCatId(cat.id);
  };

  const handleDeleteCategory = async (id) => {
    if(window.confirm("Delete this category?")) {
      await db.collection('n3dcategories').doc(id).delete();
      fetchData();
    }
  };

  // --- CRUD: SUBCATEGORIES ---
  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    try {
      if (editSubId) {
        await db.collection('n3dsubcategories').doc(editSubId).update({
          name: subCatForm.name,
          categoryId: subCatForm.categoryId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Subcategory updated!');
      } else {
        await db.collection('n3dsubcategories').add({
          name: subCatForm.name,
          categoryId: subCatForm.categoryId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Subcategory added!');
      }
      setSubCatForm({ name: '', categoryId: '' });
      setEditSubId(null);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const startEditSubcategory = (sub) => {
    setSubCatForm({ name: sub.name, categoryId: sub.categoryId });
    setEditSubId(sub.id);
  };

  const handleDeleteSubcategory = async (id) => {
    if(window.confirm("Delete this subcategory?")) {
      await db.collection('n3dsubcategories').doc(id).delete();
      fetchData();
    }
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
      const newImageUrls = await uploadImagesToStorage(prodImages, 'product_images');
      const finalImages = [...(prodForm.existingImages || []), ...newImageUrls];

      const productData = {
        name: prodForm.name,
        categoryId: prodForm.categoryId,
        subcategoryId: prodForm.subcategoryId,
        description: prodForm.description,
        variants: prodForm.variants,
        images: finalImages,
        isHotDeal: prodForm.isHotDeal,
        isTrending: prodForm.isTrending,
        isPopular: prodForm.isPopular,
      };

      if (editProdId) {
        await db.collection('n3dproducts').doc(editProdId).update({
          ...productData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Product updated successfully!');
      } else {
        await db.collection('n3dproducts').add({
          ...productData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Product published successfully!');
      }

      setProdForm(initialProdForm);
      setProdImages([]);
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
    setProdForm({
      name: prod.name,
      categoryId: prod.categoryId,
      subcategoryId: prod.subcategoryId,
      description: prod.description || '',
      variants: prod.variants && prod.variants.length > 0 ? prod.variants : [{ optionValue: '', price: '', offerPrice: '', resellPrice: '', stock: '' }],
      existingImages: prod.images || [],
      isHotDeal: prod.isHotDeal || false,
      isTrending: prod.isTrending || false,
      isPopular: prod.isPopular || false,
    });
    setProdImages([]);
    setEditProdId(prod.id);
    setActiveTab('n3dproducts'); // Jump to products tab
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Delete this product?")) {
      await db.collection('n3dproducts').doc(id).delete();
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

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-gray-800 relative">
      
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
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your store inventory and categories.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 space-x-1 overflow-x-auto">
          <button onClick={() => setActiveTab('dashboard')} className={tabClasses('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('n3dcategories')} className={tabClasses('n3dcategories')}>Categories</button>
          <button onClick={() => setActiveTab('n3dsubcategories')} className={tabClasses('n3dsubcategories')}>Subcategories</button>
          <button onClick={() => setActiveTab('n3dproducts')} className={tabClasses('n3dproducts')}>Products</button>
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
                <h2 className="text-xl font-bold mb-6">Store Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                    <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide">Total Products</p>
                    <p className="text-4xl font-black text-gray-900 mt-2">{products.length}</p>
                  </div>
                  <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 flex flex-col justify-center">
                    <p className="text-sm text-green-600 font-semibold uppercase tracking-wide">Categories</p>
                    <p className="text-4xl font-black text-gray-900 mt-2">{categories.length}</p>
                  </div>
                  <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 flex flex-col justify-center">
                    <p className="text-sm text-orange-600 font-semibold uppercase tracking-wide">Subcategories</p>
                    <p className="text-4xl font-black text-gray-900 mt-2">{subcategories.length}</p>
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-4">All Products Dashboard</h2>
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
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              {p.images && p.images[0] && (
                                <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover border" />
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

            {/* ================= CATEGORIES VIEW ================= */}
            {activeTab === 'n3dcategories' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="p-8 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/30">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{editCatId ? 'Edit Category' : 'Create Category'}</h3>
                    {editCatId && (
                      <button onClick={() => { setEditCatId(null); setCatForm({name:'', existingSliders:[]}); setCatImages([]); }} className="text-sm text-gray-500 hover:text-gray-800">Cancel Edit</button>
                    )}
                  </div>
                  <form onSubmit={handleSaveCategory} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
                      <input type="text" required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Electronics" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                    </div>

                    {/* Existing Images (Edit Mode) */}
                    {catForm.existingSliders?.length > 0 && (
                      <div className="bg-white p-4 border rounded-xl">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Existing Slider Images</label>
                        <div className="grid grid-cols-3 gap-3">
                          {catForm.existingSliders.map((imgUrl, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border">
                              <img src={imgUrl} alt="Existing" className="w-full h-16 object-cover" />
                              <button type="button" onClick={() => {
                                const newExisting = [...catForm.existingSliders];
                                newExisting.splice(idx, 1);
                                setCatForm({...catForm, existingSliders: newExisting});
                              }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Images */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Upload New Sliders</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleImageSelect(e, setCatImages)} />
                        <div className="text-indigo-600 text-3xl mb-2">📷</div>
                        <p className="text-sm text-gray-600 font-medium">Click or drag images to upload</p>
                      </div>
                      {catImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {catImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border">
                              <img src={img.preview} alt="Preview" className="w-full h-20 object-cover" />
                              <button type="button" onClick={() => removeNewImage(idx, catImages, setCatImages)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-colors">
                      {editCatId ? 'Update Category' : 'Save Category'}
                    </button>
                  </form>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-6">Existing Categories</h3>
                  <ul className="space-y-4">
                    {categories.map(cat => (
                      <li key={cat.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          {cat.sliders && cat.sliders[0] && <img src={cat.sliders[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                          <div>
                            <p className="font-bold text-gray-900">{cat.name}</p>
                            <p className="text-xs text-gray-500">{cat.sliders?.length || 0} slider images</p>
                          </div>
                        </div>
                        <div className="space-x-2">
                          <button onClick={() => startEditCategory(cat)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-sm font-medium transition-colors">Edit</button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition-colors">Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ================= SUBCATEGORIES VIEW ================= */}
            {activeTab === 'n3dsubcategories' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="p-8 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/30">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{editSubId ? 'Edit Subcategory' : 'Create Subcategory'}</h3>
                    {editSubId && (
                      <button onClick={() => { setEditSubId(null); setSubCatForm({name:'', categoryId:''}); }} className="text-sm text-gray-500 hover:text-gray-800">Cancel Edit</button>
                    )}
                  </div>
                  <form onSubmit={handleSaveSubcategory} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Category</label>
                      <select required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={subCatForm.categoryId} onChange={e => setSubCatForm({...subCatForm, categoryId: e.target.value})}>
                        <option value="">Select a category...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategory Name</label>
                      <input type="text" required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Laptops" value={subCatForm.name} onChange={e => setSubCatForm({...subCatForm, name: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-semibold px-4 py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-colors">
                      {editSubId ? 'Update Subcategory' : 'Save Subcategory'}
                    </button>
                  </form>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-6">Existing Subcategories</h3>
                  <ul className="space-y-4">
                    {subcategories.map(sub => {
                      const parentCat = categories.find(c => c.id === sub.categoryId);
                      return (
                        <li key={sub.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                          <div>
                            <p className="font-bold text-gray-900">{sub.name}</p>
                            <p className="text-xs text-gray-500">Parent: <span className="font-medium text-indigo-600">{parentCat?.name || 'Unknown'}</span></p>
                          </div>
                          <div className="space-x-2">
                            <button onClick={() => startEditSubcategory(sub)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-sm font-medium transition-colors">Edit</button>
                            <button onClick={() => handleDeleteSubcategory(sub.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition-colors">Delete</button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )}

            {/* ================= PRODUCTS VIEW ================= */}
            {activeTab === 'n3dproducts' && (
              <div className="p-8">
                <div className="max-w-6xl mx-auto">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h3 className="text-2xl font-bold">{editProdId ? 'Edit Product' : 'Publish New Product'}</h3>
                    {editProdId && (
                      <button onClick={() => { setEditProdId(null); setProdForm(initialProdForm); setProdImages([]); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-8">
                    
                    {/* Basic Info */}
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-4">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                          <input type="text" required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. MacBook Pro M2" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                          <select required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={prodForm.categoryId} onChange={e => setProdForm({...prodForm, categoryId: e.target.value, subcategoryId: ''})}>
                            <option value="">Select Category...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategory</label>
                          <select required className="w-full border border-gray-300 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={prodForm.subcategoryId} onChange={e => setProdForm({...prodForm, subcategoryId: e.target.value})} disabled={!prodForm.categoryId}>
                            <option value="">Select Subcategory...</option>
                            {subcategories.filter(s => s.categoryId === prodForm.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Description</label>
                        <textarea rows="4" className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Describe the product details..." value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})}></textarea>
                      </div>

                      {/* Store Placement Flags (Hot, Trending, Popular) */}
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

                    {/* Images Upload */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-4">Product Images</h4>
                      
                      {/* Existing Product Images (Edit Mode) */}
                      {prodForm.existingImages?.length > 0 && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Already Uploaded Images</p>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {prodForm.existingImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden border shadow-sm aspect-square">
                                <img src={imgUrl} alt="Existing" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => {
                                    const newExisting = [...prodForm.existingImages];
                                    newExisting.splice(idx, 1);
                                    setProdForm({...prodForm, existingImages: newExisting});
                                  }} className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600">✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-8 text-center hover:bg-indigo-50 transition-colors relative cursor-pointer">
                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleImageSelect(e, setProdImages)} />
                        <div className="text-indigo-500 text-4xl mb-3">🖼️</div>
                        <p className="text-base text-gray-700 font-medium">Click or drag NEW images to upload</p>
                      </div>

                      {/* New Image Previews */}
                      {prodImages.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {prodImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border shadow-sm aspect-square">
                              <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => removeNewImage(idx, prodImages, setProdImages)} className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600">
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