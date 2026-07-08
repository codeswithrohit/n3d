import React, { useState, useEffect } from 'react';
import { firebase } from '../../Firebase/config';

const Products = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit States
  const [editCatId, setEditCatId] = useState(null);
  const [editSubId, setEditSubId] = useState(null);
  const [editProdId, setEditProdId] = useState(null);

  // Data State
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Form States
  const [catForm, setCatForm] = useState({ name: '', existingSliders: [], existingLogo: '' });
  const [subCatForm, setSubCatForm] = useState({ name: '', categoryId: '', existingLogo: '' });
  
  const initialProdForm = {
    name: '', categoryId: '', subcategoryId: '', description: '', 
    variants: [{ optionValue: '', price: '', offerPrice: '', resellPrice: '', stock: '' }],
    existingImages: [],
    isHotDeal: false,
    isTrending: false,
    isPopular: false
  };
  const [prodForm, setProdForm] = useState(initialProdForm);

  // Image File States 
  const [catImages, setCatImages] = useState([]); 
  const [prodImages, setProdImages] = useState([]);
  const [catLogoImage, setCatLogoImage] = useState(null);
  const [subCatLogoImage, setSubCatLogoImage] = useState(null);

  const db = firebase.firestore();
  const storage = firebase.storage();

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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

  // --- PAGINATION HELPERS ---
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- IMAGE HANDLING HELPERS ---
  const handleImageSelect = (e, setImagesState) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setImagesState(prev => [...prev, ...newImages]);
  };

  const removeNewImage = (index, imagesState, setImagesState) => {
    const newImages = [...imagesState];
    URL.revokeObjectURL(newImages[index].preview); 
    newImages.splice(index, 1);
    setImagesState(newImages);
  };

  const handleSingleImageSelect = (e, setImageState) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageState({ file, preview: URL.createObjectURL(file) });
    }
  };

  const removeSingleImage = (imageState, setImageState) => {
    if (imageState && imageState.preview) URL.revokeObjectURL(imageState.preview);
    setImageState(null);
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

      let finalLogoUrl = catForm.existingLogo || '';
      if (catLogoImage?.file) {
        const logoUrls = await uploadImagesToStorage([{ file: catLogoImage.file }], 'category_logos');
        finalLogoUrl = logoUrls[0];
      }

      const payload = { name: catForm.name, sliders: finalSliders, logo: finalLogoUrl };

      if (editCatId) {
        await db.collection('n3dcategories').doc(editCatId).update({ ...payload, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } else {
        await db.collection('n3dcategories').add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }

      setCatForm({ name: '', existingSliders: [], existingLogo: '' });
      setCatImages([]);
      removeSingleImage(catLogoImage, setCatLogoImage);
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
    setCatForm({ name: cat.name, existingSliders: cat.sliders || [], existingLogo: cat.logo || '' });
    setCatImages([]);
    removeSingleImage(catLogoImage, setCatLogoImage);
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
    setIsUploading(true);
    try {
      let finalLogoUrl = subCatForm.existingLogo || '';
      if (subCatLogoImage?.file) {
        const logoUrls = await uploadImagesToStorage([{ file: subCatLogoImage.file }], 'subcategory_logos');
        finalLogoUrl = logoUrls[0];
      }

      const payload = { name: subCatForm.name, categoryId: subCatForm.categoryId, logo: finalLogoUrl };

      if (editSubId) {
        await db.collection('n3dsubcategories').doc(editSubId).update({ ...payload, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } else {
        await db.collection('n3dsubcategories').add({ ...payload, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      
      setSubCatForm({ name: '', categoryId: '', existingLogo: '' });
      removeSingleImage(subCatLogoImage, setSubCatLogoImage);
      setEditSubId(null);
      fetchData();
    } catch (error) { 
      console.error(error); 
      alert('Failed to save subcategory.');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditSubcategory = (sub) => {
    setSubCatForm({ name: sub.name, categoryId: sub.categoryId, existingLogo: sub.logo || '' });
    removeSingleImage(subCatLogoImage, setSubCatLogoImage);
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
        name: prodForm.name, categoryId: prodForm.categoryId, subcategoryId: prodForm.subcategoryId,
        description: prodForm.description, variants: prodForm.variants, images: finalImages,
        isHotDeal: prodForm.isHotDeal, isTrending: prodForm.isTrending, isPopular: prodForm.isPopular,
      };

      if (editProdId) {
        await db.collection('n3dproducts').doc(editProdId).update({ ...productData, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } else {
        await db.collection('n3dproducts').add({ ...productData, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
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
      name: prod.name, categoryId: prod.categoryId, subcategoryId: prod.subcategoryId, description: prod.description || '',
      variants: prod.variants && prod.variants.length > 0 ? prod.variants : [initialProdForm.variants[0]],
      existingImages: prod.images || [],
      isHotDeal: prod.isHotDeal || false, isTrending: prod.isTrending || false, isPopular: prod.isPopular || false,
    });
    setProdImages([]);
    setEditProdId(prod.id);
    setActiveTab('n3dproducts'); 
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
    setProdForm({ ...prodForm, variants: [...prodForm.variants, initialProdForm.variants[0]] });
  };

  const removeVariant = (index) => {
    const newVars = [...prodForm.variants];
    newVars.splice(index, 1);
    setProdForm({...prodForm, variants: newVars});
  };

  // --- UI HELPERS ---
  const tabClasses = (tab) => `px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`;
  const inputClasses = "w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-md text-sm text-slate-800 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all";
  const labelClasses = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="min-h-screen bg-white p-2 md:p-6 font-sans text-slate-800 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      
      {/* GLOBAL LOADING OVERLAY */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-4"></div>
          <h2 className="text-lg font-bold">Processing Transaction...</h2>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto flex flex-col min-h-[90vh]">
        
        {/* HEADER & NAVIGATION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-white shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">System Workspace</h1>
            <p className="text-xs text-slate-500 font-medium">Inventory & Classification Management</p>
          </div>
          <div className="flex bg-slate-100/50 border border-slate-200 p-1 rounded-lg w-full lg:w-auto overflow-x-auto">
            <button onClick={() => setActiveTab('dashboard')} className={tabClasses('dashboard')}>Overview</button>
            <button onClick={() => setActiveTab('n3dcategories')} className={tabClasses('n3dcategories')}>Categories</button>
            <button onClick={() => setActiveTab('n3dsubcategories')} className={tabClasses('n3dsubcategories')}>Subcategories</button>
            <button onClick={() => setActiveTab('n3dproducts')} className={tabClasses('n3dproducts')}>Inventory</button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        {loading && !isUploading ? (
          <div className="flex justify-center items-center py-20 flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900"></div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 transition-all">
            
            {/* ================= DASHBOARD VIEW ================= */}
            {activeTab === 'dashboard' && (
              <div className="p-4 md:p-6">
                
                {/* Compact KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900 p-4 rounded-lg text-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Products</p>
                      <p className="text-2xl font-bold">{products.length}</p>
                    </div>
                    <div className="text-slate-700 opacity-50">📦</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Categories</p>
                      <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                    </div>
                    <div className="text-slate-300">📁</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Subcategories</p>
                      <p className="text-2xl font-bold text-slate-900">{subcategories.length}</p>
                    </div>
                    <div className="text-slate-300">📂</div>
                  </div>
                </div>
                
                {/* Compact Data Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3">Product Identifier</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Stock Overview</th>
                        <th className="px-4 py-3">Base Price</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentProducts.map((p, index) => {
                        const totalStock = p.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            {/* PAGINATION INDEX */}
                            <td className="px-4 py-2.5 text-center text-xs font-bold text-slate-400">
                              {indexOfFirstProduct + index + 1}
                            </td>
                            <td className="px-4 py-2.5 flex items-center gap-3">
                              {p.images && p.images[0] ? (
                                <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 font-bold">N/A</div>
                              )}
                              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{p.name}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1.5">
                                {p.isHotDeal && <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">HOT</span>}
                                {p.isTrending && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">TREND</span>}
                                {p.isPopular && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded">POP</span>}
                                {!p.isHotDeal && !p.isTrending && !p.isPopular && <span className="text-[10px] text-slate-400">-</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs">
                              <span className="text-slate-500">{p.variants?.length || 0} Var. | </span>
                              <span className={`font-bold ${totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>{totalStock} Qty</span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">
                              ₹{p.variants && p.variants.length > 0 ? p.variants[0].price : 'N/A'}
                            </td>
                            <td className="px-4 py-2.5 text-right space-x-2">
                              <button onClick={() => startEditProduct(p)} className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors">Edit</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors">Del</button>
                            </td>
                          </tr>
                        );
                      })}
                      {products.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-sm text-slate-500">No records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase">
                      Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, products.length)} of {products.length}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">Prev</button>
                      <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= CATEGORIES VIEW ================= */}
            {activeTab === 'n3dcategories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                
                {/* Form Side */}
                <div className="p-4 md:p-6 lg:col-span-4 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">{editCatId ? 'Edit Category' : 'New Category'}</h3>
                    {editCatId && (
                      <button onClick={() => { setEditCatId(null); setCatForm({name:'', existingSliders:[], existingLogo:''}); setCatImages([]); removeSingleImage(catLogoImage, setCatLogoImage); }} className="text-[10px] font-bold bg-white border border-slate-300 px-2 py-1 rounded text-slate-600 hover:bg-slate-100">Cancel</button>
                    )}
                  </div>
                  
                  <form onSubmit={handleSaveCategory} className="space-y-4">
                    <div>
                      <label className={labelClasses}>Name</label>
                      <input type="text" required className={inputClasses} value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-slate-600">Icon Logo</label>
                        {catForm.existingLogo && !catLogoImage && <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Present</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded border border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0 relative">
                          {catLogoImage?.preview ? (
                             <><img src={catLogoImage.preview} className="w-full h-full object-cover" /><button type="button" onClick={() => removeSingleImage(catLogoImage, setCatLogoImage)} className="absolute top-0 right-0 bg-slate-900 text-white w-4 h-4 text-[8px]">✕</button></>
                          ) : catForm.existingLogo ? (
                             <img src={catForm.existingLogo} className="w-full h-full object-cover" />
                          ) : <span className="text-[8px] text-slate-400">N/A</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleSingleImageSelect(e, setCatLogoImage)} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-900 file:text-white" />
                      </div>
                    </div>

                    {catForm.existingSliders?.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <label className="text-xs font-semibold text-slate-600 block mb-2">Existing Banners</label>
                        <div className="grid grid-cols-4 gap-2">
                          {catForm.existingSliders.map((imgUrl, idx) => (
                            <div key={idx} className="relative rounded overflow-hidden border border-slate-200">
                              <img src={imgUrl} className="w-full h-10 object-cover" />
                              <button type="button" onClick={() => {
                                const newExisting = [...catForm.existingSliders];
                                newExisting.splice(idx, 1);
                                setCatForm({...catForm, existingSliders: newExisting});
                              }} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[8px]">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={labelClasses}>New Banners</label>
                      <input type="file" multiple accept="image/*" className="w-full text-xs border border-dashed border-slate-300 p-2 rounded bg-white file:hidden cursor-pointer" onChange={(e) => handleImageSelect(e, setCatImages)} />
                      {catImages.length > 0 && (
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          {catImages.map((img, idx) => (
                            <div key={idx} className="relative rounded overflow-hidden border border-slate-200">
                              <img src={img.preview} className="w-full h-10 object-cover" />
                              <button type="button" onClick={() => removeNewImage(idx, catImages, setCatImages)} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[8px]">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" className="w-full bg-slate-900 text-white font-semibold text-xs py-2.5 rounded-md hover:bg-slate-800 transition-all">
                      {editCatId ? 'Save Changes' : 'Create'}
                    </button>
                  </form>
                </div>
                
                {/* List Side */}
                <div className="p-4 md:p-6 lg:col-span-8">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Directory List</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat, index) => (
                      <div key={cat.id} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-colors gap-3">
                        <span className="text-xs font-bold text-slate-300 w-4 text-right">{index + 1}</span>
                        {cat.logo ? <img src={cat.logo} className="w-10 h-10 rounded object-cover border border-slate-100" /> : <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[8px] text-slate-400">N/A</div>}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{cat.name}</p>
                          <p className="text-[10px] text-slate-500">{cat.sliders?.length || 0} banners</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => startEditCategory(cat)} className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded">Edit</button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-[10px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= SUBCATEGORIES VIEW ================= */}
            {activeTab === 'n3dsubcategories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                
                <div className="p-4 md:p-6 lg:col-span-4 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">{editSubId ? 'Edit Subcategory' : 'New Subcategory'}</h3>
                    {editSubId && (
                      <button onClick={() => { setEditSubId(null); setSubCatForm({name:'', categoryId:'', existingLogo:''}); removeSingleImage(subCatLogoImage, setSubCatLogoImage); }} className="text-[10px] font-bold bg-white border border-slate-300 px-2 py-1 rounded text-slate-600 hover:bg-slate-100">Cancel</button>
                    )}
                  </div>
                  <form onSubmit={handleSaveSubcategory} className="space-y-4">
                    <div>
                      <label className={labelClasses}>Parent Category</label>
                      <select required className={inputClasses} value={subCatForm.categoryId} onChange={e => setSubCatForm({...subCatForm, categoryId: e.target.value})}>
                        <option value="">Select...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Name</label>
                      <input type="text" required className={inputClasses} value={subCatForm.name} onChange={e => setSubCatForm({...subCatForm, name: e.target.value})} />
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-slate-600">Icon Logo</label>
                        {subCatForm.existingLogo && !subCatLogoImage && <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Present</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded border border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0 relative">
                          {subCatLogoImage?.preview ? (
                             <><img src={subCatLogoImage.preview} className="w-full h-full object-cover" /><button type="button" onClick={() => removeSingleImage(subCatLogoImage, setSubCatLogoImage)} className="absolute top-0 right-0 bg-slate-900 text-white w-4 h-4 text-[8px]">✕</button></>
                          ) : subCatForm.existingLogo ? (
                             <img src={subCatForm.existingLogo} className="w-full h-full object-cover" />
                          ) : <span className="text-[8px] text-slate-400">N/A</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => handleSingleImageSelect(e, setSubCatLogoImage)} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-900 file:text-white" />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white font-semibold text-xs py-2.5 rounded-md hover:bg-slate-800 transition-all">
                      {editSubId ? 'Save Changes' : 'Create'}
                    </button>
                  </form>
                </div>
                
                <div className="p-4 md:p-6 lg:col-span-8">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Directory List</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subcategories.map((sub, index) => {
                      const parentCat = categories.find(c => c.id === sub.categoryId);
                      return (
                        <div key={sub.id} className="flex items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-colors gap-3">
                          <span className="text-xs font-bold text-slate-300 w-4 text-right">{index + 1}</span>
                          {sub.logo ? <img src={sub.logo} className="w-10 h-10 rounded object-cover border border-slate-100" /> : <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[8px] text-slate-400">N/A</div>}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">Dir: {parentCat?.name || 'Unlinked'}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={() => startEditSubcategory(sub)} className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded">Edit</button>
                            <button onClick={() => handleDeleteSubcategory(sub.id)} className="text-[10px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded">Del</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= PRODUCTS VIEW ================= */}
            {activeTab === 'n3dproducts' && (
              <div className="p-4 md:p-6 bg-white">
                <div className="w-full mx-auto">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">{editProdId ? 'Edit Product Configuration' : 'Register Product Configuration'}</h3>
                    {editProdId && (
                      <button onClick={() => { setEditProdId(null); setProdForm(initialProdForm); setProdImages([]); }} className="text-[10px] font-bold bg-white border border-slate-300 px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 shadow-sm">
                        Abort
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-6">
                    
                    {/* Primary Grid */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                          <label className={labelClasses}>Product Title</label>
                          <input type="text" required className={inputClasses} value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className={labelClasses}>Root Category</label>
                          <select required className={inputClasses} value={prodForm.categoryId} onChange={e => setProdForm({...prodForm, categoryId: e.target.value, subcategoryId: ''})}>
                            <option value="">Select...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClasses}>Subcategory</label>
                          <select required className={inputClasses} value={prodForm.subcategoryId} onChange={e => setProdForm({...prodForm, subcategoryId: e.target.value})} disabled={!prodForm.categoryId}>
                            <option value="">Select...</option>
                            {subcategories.filter(s => s.categoryId === prodForm.categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end pb-1 gap-3">
                           <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-slate-900" checked={prodForm.isHotDeal} onChange={e => setProdForm({...prodForm, isHotDeal: e.target.checked})} /><span className="text-[11px] font-semibold text-slate-700">HOT</span></label>
                           <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-slate-900" checked={prodForm.isTrending} onChange={e => setProdForm({...prodForm, isTrending: e.target.checked})} /><span className="text-[11px] font-semibold text-slate-700">TREND</span></label>
                           <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 accent-slate-900" checked={prodForm.isPopular} onChange={e => setProdForm({...prodForm, isPopular: e.target.checked})} /><span className="text-[11px] font-semibold text-slate-700">POP</span></label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className={labelClasses}>Description</label>
                        <textarea rows="3" className={`${inputClasses} h-48 resize-none`} value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})}></textarea>
                      </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className={labelClasses}>Upload Assets</label>
                        <input type="file" multiple accept="image/*" className="w-full text-xs border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50 cursor-pointer" onChange={(e) => handleImageSelect(e, setProdImages)} />
                      </div>
                      
                      <div className="flex-1">
                         <label className={labelClasses}>Preview</label>
                         <div className="flex flex-wrap gap-2">
                           {prodForm.existingImages?.map((imgUrl, idx) => (
                             <div key={idx} className="relative rounded border border-slate-200 w-12 h-12">
                               <img src={imgUrl} className="w-full h-full object-cover rounded" />
                               <button type="button" onClick={() => {
                                 const newExisting = [...prodForm.existingImages];
                                 newExisting.splice(idx, 1);
                                 setProdForm({...prodForm, existingImages: newExisting});
                               }} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[8px]">✕</button>
                             </div>
                           ))}
                           {prodImages.map((img, idx) => (
                             <div key={idx} className="relative rounded border border-blue-200 w-12 h-12">
                               <img src={img.preview} className="w-full h-full object-cover rounded" />
                               <button type="button" onClick={() => removeNewImage(idx, prodImages, setProdImages)} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[8px]">✕</button>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>

                    {/* Compact Variants Array */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-700 uppercase">SKU / Variant Control</h4>
                        <button type="button" onClick={addVariant} className="text-[10px] font-bold bg-white border border-slate-300 px-2 py-1 rounded text-slate-700 hover:bg-slate-100 shadow-sm">+ Append SKU</button>
                      </div>
                      <div className="p-5 space-y-3">
                        {prodForm.variants.map((v, idx) => (
                          <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 relative bg-slate-50/50 p-2 rounded border border-slate-100">
                            <input type="text" required placeholder="Attributes (e.g. XL/Red)" className={`${inputClasses} flex-1 min-w-[120px]`} value={v.optionValue} onChange={e => handleVariantChange(idx, 'optionValue', e.target.value)} />
                            <input type="number" required placeholder="Stock" className="w-20 bg-slate-900 border border-slate-900 px-2 py-2 rounded-md text-sm text-white focus:ring-1 focus:ring-slate-400 outline-none" value={v.stock} onChange={e => handleVariantChange(idx, 'stock', e.target.value)} />
                            <input type="number" required placeholder="₹ Price" className={`${inputClasses} w-24`} value={v.price} onChange={e => handleVariantChange(idx, 'price', e.target.value)} />
                            <input type="number" placeholder="₹ Offer Price" className={`${inputClasses} w-24`} value={v.offerPrice} onChange={e => handleVariantChange(idx, 'offerPrice', e.target.value)} />
                            {/* <input type="number" placeholder="₹ Dist." className={`${inputClasses} w-24`} value={v.resellPrice} onChange={e => handleVariantChange(idx, 'resellPrice', e.target.value)} />
                             */}
                            {prodForm.variants.length > 1 && (
                              <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 font-bold px-2 hover:bg-red-50 rounded h-full">✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white text-sm font-bold uppercase tracking-wider py-4 rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all">
                      {isUploading ? 'Executing...' : (editProdId ? 'Commit Update' : 'Initialize Product')}
                    </button>

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