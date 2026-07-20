"use client";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { firebase } from '../Firebase/config';
import {
  FaStar, FaRegStar, FaShoppingCart, FaUserCircle
} from "react-icons/fa";
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

  // Review & Accordion States
  const [descOpen, setDescOpen] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewMediaFiles, setReviewMediaFiles] = useState([]);
  const [uploadingReview, setUploadingReview] = useState(false);

  const db = firebase.firestore();

  // Optimized Fetching
  const fetchProductData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [productSnap, reviewsSnap] = await Promise.all([
        db.collection('n3dproducts').doc(id).get(),
        db.collection('n3dproducts').doc(id).collection('reviews')
          .orderBy('createdAt', 'desc').limit(10).get()
      ]);

      if (!productSnap.exists) {
        setLoading(false);
        return;
      }

      const prodData = { id: productSnap.id, ...productSnap.data() };
      setProduct(prodData);
      setMainImage(prodData.images?.[0] || "");
      setSelectedVariant(prodData.variants?.[0] || null);
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Related Products
      let relatedQuery = db.collection('n3dproducts').limit(8);
      if (prodData.categoryId) {
        relatedQuery = db.collection('n3dproducts')
          .where('categoryId', '==', prodData.categoryId)
          .limit(8);
      }
      const relatedSnap = await relatedQuery.get();
      const related = relatedSnap.docs
        .filter(doc => doc.id !== id)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setRelatedProducts(related);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [id, db]);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Cart Listener
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
          const cartData = snap.docs[0].data();
          setCartItemId(snap.docs[0].id);
          setQuantity(cartData.quantity);
        } else {
          setCartItemId(null);
          setQuantity(1);
        }
      });
    return () => unsubscribe();
  }, [user, selectedVariant, id, db]);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1 || newQty > (selectedVariant?.stock || 10)) return;
    setQuantity(newQty);
    if (cartItemId && user) {
      try {
        await db.collection('n3duser').doc(user.uid).collection('cart')
          .doc(cartItemId)
          .update({ quantity: newQty, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } catch (error) {
        console.error("Failed to update quantity", error);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!user) { alert("Please login to add items to your cart."); router.push('/login'); return; }
    if (!selectedVariant) return alert("Please select a variant first.");
    setAddingToCart(true);
    try {
      await db.collection('n3duser').doc(user.uid).collection('cart').add({
        productId: id,
        productName: product.name,
        image: mainImage || product.images?.[0] || '',
        variant: selectedVariant,
        price: selectedVariant?.offerPrice || selectedVariant?.price || product.price,
        quantity,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      alert("Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) { alert("Please login to complete your purchase."); router.push('/login'); return; }
    if (!selectedVariant) return alert("Please select a variant first.");
    setAddingToCart(true);
    try {
      if (!cartItemId) await handleAddToCart();
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/cart/Cart-page');
    } catch (error) {
      alert("Failed to process purchase.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a star rating.");
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
        rating, text: reviewText,
        userName: user?.phoneNumber || user?.email?.split('@')[0] || "Guest",
        media: uploadedMedia,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setReviewText(""); setRating(0); setReviewMediaFiles([]);
      fetchProductData();
    } catch (error) {
      alert("Failed to submit review.");
    } finally {
      setUploadingReview(false);
    }
  };

  const renderStars = (ratingValue, interactive = false) => (
    <div className={`flex ${interactive ? 'text-3xl md:text-4xl gap-2 cursor-pointer' : 'text-lg gap-1'}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} onClick={() => interactive && setRating(star)} className="transition-transform hover:scale-110">
          {star <= Math.round(ratingValue) ? <FaStar className="text-amber-400" /> : <FaRegStar className="text-zinc-600" />}
        </span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pb-20">
        <div className="max-w-[1300px] mx-auto px-5 md:px-8 py-10">
          <div className="h-4 bg-zinc-800 w-64 md:w-80 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="flex flex-col-reverse md:flex-row gap-4">
              <div className="flex md:flex-col gap-3 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-zinc-800 rounded-2xl flex-shrink-0 animate-pulse" />
                ))}
              </div>
              <div className="flex-1 aspect-square bg-zinc-900 rounded-3xl animate-pulse" />
            </div>
            <div className="space-y-6 md:space-y-8">
              <div className="h-10 bg-zinc-800 w-3/4 rounded-lg animate-pulse" />
              <div className="h-6 bg-zinc-800 w-32 rounded animate-pulse" />
              <div className="h-14 bg-zinc-800 w-48 rounded-xl animate-pulse" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 w-24 bg-zinc-800 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-14 w-full sm:w-40 bg-zinc-800 rounded-2xl animate-pulse" />
                <div className="flex-1 h-14 bg-zinc-800 rounded-2xl animate-pulse" />
              </div>
              <div className="h-14 bg-zinc-800 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-4">Product Not Found</h2>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-white text-black rounded-xl font-medium">
          Return to Shop
        </button>
      </div>
    );
  }

  const price = Number(selectedVariant?.offerPrice || selectedVariant?.price || product.price || 0);
  const oldPrice = Number(selectedVariant?.price || product.originalPrice || 0);
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans pb-20">
      <div className="max-w-[1300px] mx-auto px-5 md:px-8 py-6 md:py-10">
        
        {/* Breadcrumb */}
        <div className="text-xs md:text-sm text-zinc-500 mb-8 truncate">
          Home <span className="mx-2">›</span> Shop <span className="mx-2">›</span>
          <span className="text-zinc-300">{product.name}</span>
        </div>

        {/* Combined Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">
          
          {/* Product Gallery Grid Side */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 pb-2 md:pb-0 hide-scrollbar">
              {product.images?.map((img, i) => (
                <img
                  key={i} src={img} onClick={() => setMainImage(img)}
                  className={`w-20 h-20 object-cover rounded-2xl cursor-pointer transition-all flex-shrink-0 border-2 ${
                    mainImage === img ? 'border-white scale-105' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                  alt={`${product.name} thumbnail ${i + 1}`}
                />
              ))}
            </div>
            
            {/* Responsive Main Image Wrapper */}
            <div className="flex-1 bg-zinc-900 rounded-3xl overflow-hidden relative border border-zinc-800 aspect-square lg:aspect-square flex items-center justify-center min-h-[400px] lg:min-h-[500px]">
              {discount > 0 && (
                <span className="absolute top-4 left-4 md:top-6 md:left-6 bg-white text-black text-xs font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-xl z-10 shadow-lg">
                  {discount}% OFF
                </span>
              )}
              <img 
                src={mainImage || '/placeholder.png'} 
                alt={product.name} 
                className="w-full h-full object-contain p-6 md:p-8 transition-transform duration-500 hover:scale-105" 
              />
            </div>
          </div>

          {/* Product Info & Actions Side */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">{product.name}</h1>
            <p className="text-zinc-400 mb-6 text-sm md:text-base">by <span className="text-zinc-200">N3D</span></p>

            <div className="flex items-center gap-3 mb-6">
              {renderStars(product.averageRating || 0)}
              <span className="text-zinc-400 text-sm md:text-base">({product.reviewCount || reviews.length} reviews)</span>
            </div>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl md:text-5xl font-bold text-white">₹{price.toFixed(0)}</span>
              {oldPrice > price && (
                <span className="text-xl md:text-2xl text-zinc-500 line-through mb-1">₹{oldPrice.toFixed(0)}</span>
              )}
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mb-8">
                <p className="text-xs md:text-sm uppercase tracking-widest text-zinc-400 mb-3 font-semibold">Select Variant</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-5 py-2.5 md:px-6 md:py-3 rounded-2xl font-medium transition-all border-2 text-sm md:text-base ${
                        selectedVariant?.optionValue === variant.optionValue
                          ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                          : 'border-zinc-700 hover:border-zinc-500 text-zinc-300'
                      }`}
                    >
                      {variant.optionValue}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 mb-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center border border-zinc-700 rounded-2xl overflow-hidden w-full sm:w-40 bg-zinc-900/50">
                  <button onClick={() => handleQtyChange(quantity - 1)} className="w-12 h-14 text-2xl hover:bg-zinc-800 transition-colors">-</button>
                  <span className="flex-1 text-center font-bold text-xl">{quantity}</span>
                  <button onClick={() => handleQtyChange(quantity + 1)} className="w-12 h-14 text-2xl hover:bg-zinc-800 transition-colors">+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || addingToCart}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  <FaShoppingCart /> {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant || addingToCart}
                className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_4px_14px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Buy Now
              </button>
            </div>

            {/* Description Accordion */}
            <div className="border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-900/30">
              <button 
                className="w-full flex justify-between items-center p-6 hover:bg-zinc-800/50 transition-colors focus:outline-none" 
                onClick={() => setDescOpen(!descOpen)}
              >
                <h3 className="font-bold text-lg">Product Description</h3>
                <span className="text-2xl text-zinc-400">{descOpen ? '−' : '+'}</span>
              </button>
              {descOpen && (
                <div className="px-6 pb-8 text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base border-t border-zinc-800/50 pt-4">
                  {product.description || "No description available for this product."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= REVIEWS SECTION ================= */}
        <div className="mt-20 lg:mt-32 pt-10 border-t border-zinc-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Review Form */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6">Write a Review</h2>
              {user ? (
                <form onSubmit={handleSubmitReview} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                  <div className="mb-6">
                    <label className="block text-sm text-zinc-400 mb-2">Overall Rating</label>
                    {renderStars(rating, true)}
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm text-zinc-400 mb-2">Your Review</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What did you like or dislike?"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-zinc-500 transition-colors resize-none h-32"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-zinc-400 mb-2">Attach Media (Optional)</label>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*"
                      onChange={(e) => setReviewMediaFiles(Array.from(e.target.files))}
                      className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 transition-colors"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={uploadingReview}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {uploadingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center">
                  <FaUserCircle className="text-5xl text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-6">You need to be logged in to share your thoughts.</p>
                  <button onClick={() => router.push('/login')} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-zinc-200 transition-colors">
                    Log In to Review
                  </button>
                </div>
              )}
            </div>

            {/* Review List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
              {reviews.length === 0 ? (
                <div className="p-8 border border-zinc-800 border-dashed rounded-3xl text-center text-zinc-500">
                  No reviews yet. Be the first to review this product!
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-400 uppercase">
                            {review.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-sm md:text-base">{review.userName || 'Anonymous'}</p>
                            <div className="mt-1">{renderStars(review.rating)}</div>
                          </div>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm md:text-base leading-relaxed">{review.text}</p>
                      
                      {review.media && review.media.length > 0 && (
                        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                          {review.media.map((m, idx) => (
                            m.type === 'video' ? (
                              <video key={idx} src={m.url} controls className="h-24 rounded-lg border border-zinc-700 flex-shrink-0" />
                            ) : (
                              <img key={idx} src={m.url} alt="review media" className="h-24 w-24 object-cover rounded-lg border border-zinc-700 flex-shrink-0" />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RELATED PRODUCTS ================= */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 lg:mt-32 pt-10 border-t border-zinc-800">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(item => (
                <div key={item.id} onClick={() => router.push(`/product-detail?id=${item.id}`)} className="cursor-pointer group flex flex-col h-full">
                  <div className="aspect-square bg-zinc-900 rounded-2xl md:rounded-3xl overflow-hidden mb-4 relative border border-zinc-800/50 group-hover:border-zinc-600 transition-colors">
                    <img src={item.images?.[0] || '/placeholder.png'} className="w-full h-full object-contain p-4 md:p-6 group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                  </div>
                  <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2 text-zinc-300 group-hover:text-white transition-colors flex-1">{item.name}</h3>
                  <p className="text-lg md:text-xl font-bold text-white">₹{Number(item.variants?.[0]?.offerPrice || item.price || 0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetails() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-medium tracking-widest uppercase text-sm">Loading Store...</p>
      </div>
    }>
      <ProductDetailsContent />
    </Suspense>
  );
}