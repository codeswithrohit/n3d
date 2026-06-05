"use client";

import React, { useState, useEffect, Suspense } from "react";
import { firebase } from '../Firebase/config'; 
import { 
  FaStar, FaRegStar, FaFacebookF, FaPinterestP, FaWhatsapp, FaLinkedinIn, 
  FaShoppingCart, FaTruck, FaBoxOpen, FaCamera, FaVideo 
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6"; 
import { useSearchParams, useRouter } from "next/navigation";

function ProductDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); 

  // States
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartItemId, setCartItemId] = useState(null); 
  const [addingToCart, setAddingToCart] = useState(false);
  
  // UI States
  const [descOpen, setDescOpen] = useState(true); 
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewMediaFiles, setReviewMediaFiles] = useState([]);
  const [uploadingReview, setUploadingReview] = useState(false);

  const db = firebase.firestore();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      const docSnap = await db.collection('n3dproducts').doc(id).get();
      if (!docSnap.exists) {
        setLoading(false);
        return;
      }
      
      const prodData = { id: docSnap.id, ...docSnap.data() };
      setProduct(prodData);
      setMainImage(prodData.images?.[0] || "");
      setSelectedVariant(prodData.variants?.[0] || null);

      const reviewsSnap = await db.collection('n3dproducts').doc(id).collection('reviews').orderBy('createdAt', 'desc').get();
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      let relatedQuery = db.collection('n3dproducts').limit(6);
      if (prodData.categoryId) {
         relatedQuery = db.collection('n3dproducts').where('categoryId', '==', prodData.categoryId).limit(6);
      }
      const relatedSnap = await relatedQuery.get();
      const related = [];
      relatedSnap.forEach(doc => {
         if (doc.id !== id) related.push({ id: doc.id, ...doc.data() });
      });
      setRelatedProducts(related);

    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !selectedVariant || !id) {
      setCartItemId(null);
      setQuantity(1);
      return;
    }

    const cartRef = db.collection('n3duser').doc(user.uid).collection('cart');
    const unsubscribe = cartRef
      .where('productId', '==', id)
      .where('variant.optionValue', '==', selectedVariant.optionValue)
      .onSnapshot(snap => {
        if (!snap.empty) {
          setCartItemId(snap.docs[0].id);
          setQuantity(snap.docs[0].data().quantity);
        } else {
          setCartItemId(null);
          setQuantity(1);
        }
      });

    return () => unsubscribe();
  }, [user, selectedVariant, id]);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1 || newQty > (selectedVariant?.stock || 1)) return;
    setQuantity(newQty); 
    if (cartItemId && user) {
      try {
        await db.collection('n3duser').doc(user.uid).collection('cart').doc(cartItemId).update({
          quantity: newQty,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {}
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert("Please login to add items to your cart.");
      router.push('/login'); return;
    }
    if (!selectedVariant && product?.variants?.length > 0) return alert("Please select an option/variant first.");

    setAddingToCart(true);
    try {
      await db.collection('n3duser').doc(user.uid).collection('cart').add({
        productId: id,
        productName: product.name,
        image: mainImage || product.images?.[0] || '',
        variant: selectedVariant || null,
        price: selectedVariant?.offerPrice || selectedVariant?.price || product.price,
        quantity: quantity,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      alert("Failed to add item to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      alert("Please login to purchase items.");
      router.push('/login'); 
      return;
    }
    
    if (!selectedVariant && product?.variants?.length > 0) {
      return alert("Please select an option/variant first.");
    }

    setAddingToCart(true);
    try {
      if (!cartItemId) {
        await db.collection('n3duser').doc(user.uid).collection('cart').add({
          productId: id, 
          productName: product.name,
          image: mainImage || product.images?.[0] || '', 
          variant: selectedVariant || null,
          price: selectedVariant?.offerPrice || selectedVariant?.price || product.price, 
          quantity: quantity,
          addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/cart/cart-page');
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to process request.");
      setAddingToCart(false); 
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating of at least 1 star.");
    if (!reviewText.trim()) return alert("Please write a review.");

    setUploadingReview(true);
    try {
      let uploadedMedia = [];
      if (reviewMediaFiles.length > 0) {
        const storage = firebase.storage();
        for (const file of reviewMediaFiles) {
          const storageRef = storage.ref(`product_reviews/${id}/${Date.now()}_${file.name}`);
          await storageRef.put(file);
          uploadedMedia.push({
            url: await storageRef.getDownloadURL(),
            type: file.type.startsWith("video/") ? "video" : "image"
          });
        }
      }

      await db.collection('n3dproducts').doc(id).collection('reviews').add({
        rating, text: reviewText, userName: user?.phoneNumber || "Guest User",
        media: uploadedMedia, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      const newReviewCount = (product.reviewCount || 0) + 1;
      const newAverage = (((product.averageRating || 0) * (product.reviewCount || 0)) + rating) / newReviewCount;

      await db.collection('n3dproducts').doc(id).update({ averageRating: newAverage, reviewCount: newReviewCount });

      setReviewText(""); setRating(0); setReviewMediaFiles([]); fetchProductData(); 
    } catch (error) {
      alert("Failed to submit review.");
    } finally {
      setUploadingReview(false);
    }
  };

  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className={`flex text-amber-500 ${interactive ? 'text-3xl cursor-pointer gap-1.5' : 'text-sm'}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} onClick={() => interactive && setRating(star)} className={interactive ? 'hover:scale-110 transition-transform' : ''}>
            {star <= Math.round(ratingValue) ? <FaStar /> : <FaRegStar className="text-neutral-300" />}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-[1300px] mx-auto p-4 md:p-8 font-sans pb-24 animate-pulse bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex gap-4">
             <div className="w-20 h-96 bg-neutral-200 rounded-2xl hidden md:block"></div>
             <div className="flex-1 h-96 bg-neutral-200 rounded-3xl"></div>
          </div>
          <div className="space-y-4 pt-4">
             <div className="h-10 bg-neutral-200 w-3/4 rounded-lg"></div>
             <div className="h-6 bg-neutral-200 w-1/3 rounded-lg"></div>
             <div className="h-12 bg-neutral-200 w-1/4 rounded-lg"></div>
             <div className="h-14 bg-neutral-200 w-full mt-6 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) return <div className="py-32 text-center text-xl font-bold text-black bg-white min-h-screen">Product not found.</div>;

  const price = Number(selectedVariant?.offerPrice || selectedVariant?.price || product.price || 0);
  const oldPrice = Number(selectedVariant?.price || product.originalPrice || 0);
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const today = new Date();
  const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
  const day2 = new Date(today); day2.setDate(day2.getDate() + 2);
  const day5 = new Date(today); day5.setDate(day5.getDate() + 5);
  const day6 = new Date(today); day6.setDate(day6.getDate() + 6);
  const getMonthDate = (d) => `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;

  return (
    <div className="bg-white text-black min-h-screen font-sans">
      <div className="max-w-[1250px] mx-auto p-4 md:px-8 md:py-8 pb-24">
        
        {/* Breadcrumb */}
        <div className="text-xs font-medium text-neutral-500 mb-6 tracking-wide">
          Home <span className="mx-2">/</span> Products <span className="mx-2">/</span> <span className="text-black">{product.name}</span>
        </div>

        {/* ================= TOP SECTION (IMAGES & DETAILS) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 mb-16 items-start">
          
          {/* LEFT: IMAGES */}
          <div className="flex flex-col-reverse md:flex-row gap-4 md:sticky md:top-24">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-20 flex-shrink-0 p-1">
              {product.images?.map((img, i) => (
                <img
                  key={i} src={img} onClick={() => setMainImage(img)}
                  className={`w-16 h-16 md:w-20 md:h-20 cursor-pointer object-cover rounded-xl transition-all flex-shrink-0 ${
                    mainImage === img 
                      ? 'border-2 border-black scale-105 shadow-md' 
                      : 'border border-neutral-200 opacity-70 hover:opacity-100 bg-neutral-50'
                  }`}
                  alt={`thumbnail-${i}`}
                />
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 aspect-square bg-neutral-50 border border-neutral-100 flex items-center justify-center relative rounded-3xl overflow-hidden shadow-sm">
              {discount > 0 && (
                <span className="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg tracking-wide shadow-md">
                  {discount}% OFF
                </span>
              )}
              <img 
                src={mainImage || '/placeholder.png'} 
                className="w-full h-full object-contain p-4 mix-blend-multiply" 
                alt={product.name} 
              />
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="flex flex-col justify-start">
            <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight mb-2">
              {product.name}
            </h1>

            <p className="text-sm text-neutral-500 mb-3">by <span className="font-bold text-red-600">RSA</span></p>

            <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-4">
              {renderStars(product.averageRating || 0)}
              <span className="text-sm font-medium text-neutral-500 ml-1">({product.reviewCount || 0} reviews)</span>
            </div>

            {/* Price Section */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-black text-red-600">Rs. {price.toFixed(2)}</span>
              {oldPrice > price && (
                <span className="text-lg font-medium text-neutral-400 line-through mb-1">Rs. {oldPrice.toFixed(2)}</span>
              )}
            </div>

            {/* VARIANTS */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <p className="font-bold text-sm text-black mb-3 uppercase tracking-wider">Select Variant</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant, idx) => (
                    <button
                      key={idx} onClick={() => setSelectedVariant(variant)}
                      className={`px-5 py-2.5 text-sm font-semibold transition-all rounded-xl ${
                        selectedVariant?.optionValue === variant.optionValue 
                          ? "border-2 border-black bg-black text-white shadow-md scale-105" 
                          : "border-2 border-neutral-200 bg-transparent text-black hover:border-black"
                      }`}
                    >
                      {variant.optionValue}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADD TO CART & BUY NOW SECTION */}
            <div className="flex flex-col gap-4 mt-2 pb-8 border-b border-neutral-100">
              
              {/* Row: Qty + Add to Cart */}
              <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-4">
                
                {/* Quantity Box */}
                <div className="flex items-center justify-between border-2 border-neutral-200 bg-transparent h-14 w-36 flex-shrink-0 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => handleQtyChange(quantity - 1)} disabled={quantity <= 1 || !selectedVariant}
                    className="w-12 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 text-xl font-medium"
                  >−</button>
                  <span className="text-base font-bold text-black flex-1 text-center">{quantity}</span>
                  <button 
                    onClick={() => handleQtyChange(quantity + 1)} disabled={!selectedVariant}
                    className="w-12 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 text-xl font-medium"
                  >+</button>
                </div>

                {/* Add To Cart Button */}
                <button 
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || addingToCart || cartItemId} 
                  className="flex-1 h-14 text-sm font-black tracking-widest uppercase transition-all rounded-xl border-2 border-transparent bg-black text-white hover:bg-neutral-800 flex items-center justify-center gap-2 shadow-lg disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
                >
                  <FaShoppingCart size={18} />
                  {addingToCart ? "Adding..." : cartItemId ? "Added to Cart" : "Add to Cart"}
                </button>
              </div>

              {/* Buy Now Button (Red) */}
              <button 
                onClick={handleBuyNow} disabled={!selectedVariant || addingToCart} 
                className="w-full h-14 text-sm font-black tracking-widest uppercase transition-all bg-red-600 text-white rounded-xl hover:bg-red-700 mt-2 flex items-center justify-center gap-2 shadow-lg disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
              >
                Buy Now
              </button>
            </div>

            {/* Delivery Timeline */}
            <div className="mt-8 mb-6 flex items-center justify-center gap-1 sm:gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
               {/* Order Today */}
               <div className="flex flex-col items-center text-center w-24">
                  <div className="bg-white text-black w-12 h-12 flex items-center justify-center rounded-full mb-2 shadow-sm border border-neutral-100">
                     <FaShoppingCart size={18} />
                  </div>
                  <p className="text-[11px] font-bold text-black leading-tight">{getMonthDate(today)}<br/><span className="text-neutral-500">Order Today</span></p>
               </div>

               <div className="text-neutral-300 text-xs font-bold tracking-widest -mt-6">▶▶</div>

               {/* Order Ready */}
               <div className="flex flex-col items-center text-center w-24">
                  <div className="bg-white text-black w-12 h-12 flex items-center justify-center rounded-full mb-2 shadow-sm border border-neutral-100">
                     <FaTruck size={20} />
                  </div>
                  <p className="text-[11px] font-bold text-black leading-tight">{getMonthDate(tmrw)} - {getMonthDate(day2)}<br/><span className="text-neutral-500">Order Ready</span></p>
               </div>

               <div className="text-neutral-300 text-xs font-bold tracking-widest -mt-6">▶▶</div>

               {/* Delivered */}
               <div className="flex flex-col items-center text-center w-24">
                  <div className="bg-white text-black w-12 h-12 flex items-center justify-center rounded-full mb-2 shadow-sm border border-neutral-100">
                     <FaBoxOpen size={18} />
                  </div>
                  <p className="text-[11px] font-bold text-black leading-tight">{getMonthDate(day5)} - {getMonthDate(day6)}<br/><span className="text-emerald-600">Delivered</span></p>
               </div>
            </div>

            {/* Social Sharing Icons */}
            <div className="flex items-center gap-4 mt-2">
               <span className="text-sm font-bold text-black">Share this:</span>
               <div className="flex gap-2.5">
                 <button className="bg-blue-600 text-white p-2.5 rounded-full hover:scale-110 transition-transform shadow-sm"><FaFacebookF size={14}/></button>
                 <button className="bg-black text-white p-2.5 rounded-full hover:scale-110 transition-transform shadow-sm"><FaXTwitter size={14}/></button>
                 <button className="bg-green-700 text-white p-2.5 rounded-full hover:scale-110 transition-transform shadow-sm"><FaWhatsapp size={14}/></button>
               </div>
            </div>

            {/* Accordion: Description */}
            <div className="mt-8 mb-8 border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50/50">
              <div 
                className="flex justify-between items-center p-5 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => setDescOpen(!descOpen)}
              >
                <h3 className="text-base font-bold text-black">Product Description</h3>
                <span className="text-2xl text-neutral-400 font-light leading-none">{descOpen ? '−' : '+'}</span>
              </div>
              
              {descOpen && (
                <div className="px-5 pb-6 text-sm text-neutral-600 leading-relaxed whitespace-pre-line border-t border-neutral-200 pt-4">
                  {product.description || <span className="italic">No description available for this product.</span>}
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* ================= YOU MAY ALSO LIKE ================= */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 mb-16 border-t border-neutral-200">
            <h2 className="text-2xl mt-8 font-black text-black mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 mb-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {relatedProducts.map(item => {
                const itemPrice = Number(item.variants?.[0]?.offerPrice || item.variants?.[0]?.price || item.price || 0);
                const itemOldPrice = Number(item.variants?.[0]?.price || item.originalPrice || 0);
                return (
                  <div key={item.id} onClick={() => router.push(`/product-detail?id=${item.id}`)} className="group cursor-pointer flex flex-col border border-neutral-200 p-3 rounded-2xl hover:shadow-lg hover:border-neutral-300 transition-all bg-white">
                    <div className="aspect-square bg-neutral-50 mb-3 rounded-xl overflow-hidden relative">
                      <img src={item.images?.[0] || '/placeholder.png'} className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                    </div>
                    <div className="flex flex-col flex-1 px-1">
                      <div className="flex items-center gap-1 mb-1.5">
                        {renderStars(item.averageRating || 0)}
                        <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400">({item.reviewCount || 0})</span>
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug mb-2 group-hover:text-black transition-colors">{item.name}</h3>
                      <div className="mt-auto flex items-end gap-2 flex-wrap">
                         <span className="text-base font-black text-red-600">Rs. {itemPrice.toFixed(2)}</span>
                         {itemOldPrice > itemPrice && <span className="text-[11px] font-medium text-neutral-400 line-through mb-[2px]">Rs. {itemOldPrice.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================= CUSTOMER REVIEWS ================= */}
        <div className="pt-10 border-t border-neutral-200">
          <h2 className="text-2xl mt-8 font-black text-black mb-10 text-center uppercase tracking-wider">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 max-w-5xl mx-auto">
            
            {/* Review Form */}
            <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-3xl h-fit">
              <h3 className="text-lg font-black mb-6 text-black uppercase tracking-wide">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Select Rating</label>
                  {renderStars(rating, true)} 
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 block mb-3 uppercase tracking-widest">Your Experience</label>
                  <textarea 
                    required rows="4" value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                    className="w-full bg-white border border-neutral-200 text-black p-4 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm transition-all"
                    placeholder="Tell us what you loved about this..."
                  ></textarea>
                </div>
                <div>
                   <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Add Media (Optional)</label>
                   <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center justify-center gap-2 cursor-pointer bg-white border border-dashed border-neutral-300 hover:border-black text-black font-semibold py-3 px-5 rounded-xl transition-colors shadow-sm">
                         <FaCamera /> <FaVideo /> <span className="text-sm">Upload Photos/Videos</span>
                         <input type="file" accept="image/*,video/*" multiple onChange={(e) => setReviewMediaFiles(Array.from(e.target.files).slice(0,3))} className="hidden" />
                      </label>
                      {reviewMediaFiles.length > 0 && <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{reviewMediaFiles.length} file(s) ready</span>}
                   </div>
                </div>
                <button type="submit" disabled={uploadingReview} className="w-full bg-black text-white font-black tracking-widest uppercase py-4 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 text-sm mt-4 shadow-lg">
                  {uploadingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>

            {/* Review List */}
            <div>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border border-neutral-100 bg-white p-5 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 uppercase">
                             {review.userName.charAt(0)}
                           </div>
                           <div>
                             <span className="font-bold text-black block text-sm">{review.userName}</span>
                             {renderStars(review.rating)}
                           </div>
                        </div>
                        <span className="text-xs font-medium text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-md">
                          {review.createdAt?.toDate().toLocaleDateString() || "Just now"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-3 leading-relaxed">{review.text}</p>
                      {review.media && review.media.length > 0 && (
                        <div className="flex gap-3 mt-4 overflow-x-auto pb-2 hide-scrollbar">
                          {review.media.map((item, idx) => (
                            item.type === 'video' 
                              ? <video key={idx} src={item.url} controls className="h-20 w-20 object-cover border border-neutral-200 rounded-xl flex-shrink-0" />
                              : <img key={idx} src={item.url} alt="Review" className="h-20 w-20 object-cover border border-neutral-200 rounded-xl flex-shrink-0" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-neutral-300 rounded-3xl bg-neutral-50">
                   <div className="text-5xl mb-4 opacity-50">⭐</div>
                   <h3 className="text-lg font-bold text-black mb-1">No reviews yet</h3>
                   <p className="text-sm text-neutral-500 max-w-xs">Be the first to share your experience with this product!</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function ProductDetails() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">Loading Product...</div>}>
      <ProductDetailsContent />
    </Suspense>
  );
}