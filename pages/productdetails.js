"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../Firebase/config'; 
import { FaStar, FaRegStar, FaCheckCircle, FaShoppingBag } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";

export default function ProductDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = searchParams.get("id"); 
  const resellPriceParam = searchParams.get("resellPrice"); // Fetching resell price from link

  // Auth State
  const [user, setUser] = useState(null);

  // Product Data State
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState("description");
  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // Cart & Review State
  const [quantity, setQuantity] = useState(1);
  const [cartItemId, setCartItemId] = useState(null); 
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  const db = firebase.firestore();

  // 1. Track Authentication State
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Product Data
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

      if (prodData.categoryId) {
        const relatedSnap = await db.collection('n3dproducts')
          .where('categoryId', '==', prodData.categoryId)
          .limit(5)
          .get();
        
        const related = [];
        relatedSnap.forEach(doc => {
          if (doc.id !== id) related.push({ id: doc.id, ...doc.data() });
        });
        setRelatedProducts(related.slice(0, 4));
      }

      const reviewsSnap = await db.collection('n3dproducts').doc(id).collection('reviews').orderBy('createdAt', 'desc').get();
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Real-time Cart Listener
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

  // 4. Handle Quantity
  const handleQtyChange = async (newQty) => {
    if (newQty < 1 || newQty > (selectedVariant?.stock || 1)) return;
    setQuantity(newQty); 

    if (cartItemId && user) {
      try {
        await db.collection('n3duser').doc(user.uid).collection('cart').doc(cartItemId).update({
          quantity: newQty,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error("Error auto-updating cart quantity:", error);
      }
    }
  };

  // 5. Handle Add To Cart
  const handleAddToCart = async () => {
    if (!user) {
      alert("Please login to add items to your cart.");
      router.push('/login'); 
      return;
    }

    if (!selectedVariant) {
      alert("Please select an option/variant first.");
      return;
    }

    setAddingToCart(true);

    try {
      // Use the URL resell price if it exists, otherwise use standard offerPrice
      const finalPrice = resellPriceParam 
        ? Number(resellPriceParam) 
        : (selectedVariant.offerPrice || selectedVariant.price);

      const cartRef = db.collection('n3duser').doc(user.uid).collection('cart');
      await cartRef.add({
        productId: id,
        productName: product.name,
        image: mainImage || product.images?.[0] || '',
        variant: selectedVariant,
        price: finalPrice, // Passes the Resell link price to the cart
        isResell: !!resellPriceParam, // Optional: marks the cart item as a resold product
        quantity: quantity,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  // 6. Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating of at least 1 star.");
    if (!reviewText.trim()) return alert("Please write a review.");

    try {
      const reviewData = {
        rating,
        text: reviewText,
        userName: user?.phoneNumber || "Guest User", 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('n3dproducts').doc(id).collection('reviews').add(reviewData);

      const newReviewCount = (product.reviewCount || 0) + 1;
      const currentTotalScore = (product.averageRating || 0) * (product.reviewCount || 0);
      const newAverage = (currentTotalScore + rating) / newReviewCount;

      await db.collection('n3dproducts').doc(id).update({
        averageRating: newAverage,
        reviewCount: newReviewCount
      });

      setReviewText("");
      setRating(0);
      fetchProductData(); 
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className={`flex text-amber-400 ${interactive ? 'text-2xl cursor-pointer gap-1' : 'text-sm'}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} onClick={() => interactive && setRating(star)} className={interactive ? 'hover:scale-110 transition-transform' : ''}>
            {star <= Math.round(ratingValue) ? <FaStar /> : <FaRegStar className="text-neutral-300 dark:text-neutral-600" />}
          </span>
        ))}
      </div>
    );
  };

  // ==========================================
  // SKELETON LOADER
  // ==========================================
  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 mt-4 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="flex flex-col-reverse md:flex-row gap-4 h-[500px]">
            <div className="flex md:flex-col gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 dark:bg-neutral-800 rounded-2xl flex-shrink-0"></div>)}
            </div>
            <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-3xl h-full"></div>
          </div>
          <div className="space-y-6 pt-4">
            <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-3/4"></div>
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-1/3"></div>
            <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl w-1/4 mt-8"></div>
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-1/5 mt-8 mb-2"></div>
            <div className="flex gap-3"><div className="h-12 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div><div className="h-12 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div></div>
            <div className="flex gap-4 mt-10"><div className="h-14 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div><div className="h-14 flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) return <div className="py-32 text-center text-xl font-bold text-neutral-500 dark:text-neutral-400">Product not found.</div>;

  // Pricing Logic Modified Here
  // If resellPriceParam exists in the URL, that becomes the display price. Otherwise, fallback to offerPrice.
  const price = resellPriceParam ? Number(resellPriceParam) : (selectedVariant?.offerPrice || selectedVariant?.price || product.price || 0);
  const oldPrice = selectedVariant?.price || product.originalPrice || 0;
  
  // Update discount based on the new price
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 font-sans text-neutral-900 dark:text-neutral-100 pb-24">
      
      {/* ================= TOP SECTION (PRODUCT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* LEFT: IMAGES */}
        <div className="flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-24 h-fit">
          <div className="flex md:flex-col gap-3 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
            {product.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setMainImage(img)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl cursor-pointer object-cover transition-all duration-300 ${
                  mainImage === img 
                    ? 'ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-neutral-950 scale-95' 
                    : 'hover:opacity-80 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'
                }`}
                alt="thumbnail"
              />
            ))}
          </div>

          <div className="flex-1 aspect-[4/5] sm:aspect-square bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-4 flex items-center justify-center relative overflow-hidden group">
            {discount > 0 && (
              <span className="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-sm tracking-wider">
                {discount}% OFF
              </span>
            )}
            <img 
              src={mainImage || '/placeholder.png'} 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" 
              alt={product.name} 
            />
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="flex flex-col justify-center">
          <h1 className="text-xl sm:text-xl lg:text-xl font-black text-black dark:text-white leading-tight tracking-tight mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            {renderStars(product.averageRating || 0)}
            <span 
              className="text-sm font-medium text-neutral-500 dark:text-neutral-400 cursor-pointer hover:text-black dark:hover:text-white underline underline-offset-4 transition-colors"
              onClick={() => {
                setActiveTab("reviews");
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
            >
              {product.reviewCount || 0} Reviews
            </span>
          </div>

          <div className="flex items-end gap-3 mb-8">
            <span className="text-4xl font-black text-black dark:text-white">₹{price}</span>
            {discount > 0 && (
              <span className="text-xl font-semibold text-neutral-400 dark:text-neutral-500 line-through mb-1">₹{oldPrice}</span>
            )}
          </div>

          {/* VARIANTS */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <p className="font-bold uppercase tracking-widest text-xs text-neutral-900 dark:text-neutral-100">Select Option</p>
                {selectedVariant && (
                  <p className={`text-xs font-bold ${selectedVariant.stock > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500 dark:text-red-400'}`}>
                    {selectedVariant.stock > 0 ? `✓ In Stock (${selectedVariant.stock})` : '✕ Out of Stock'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant, idx) => {
                  const isSelected = selectedVariant?.optionValue === variant.optionValue;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-6 py-3 text-sm font-bold rounded-xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-md scale-105" 
                          : "border-neutral-200 text-neutral-600 hover:border-black hover:text-black bg-white dark:bg-neutral-950 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-white dark:hover:text-white"
                      }`}
                    >
                      {variant.optionValue}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD TO CART & QUANTITY */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4 pb-8 border-b border-neutral-200 dark:border-neutral-800">
            
            {/* Quantity Pill */}
            <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 rounded-2xl h-14 px-2 w-full sm:w-36 flex-shrink-0">
              <button 
                onClick={() => handleQtyChange(quantity - 1)}
                disabled={quantity <= 1 || !selectedVariant}
                className="w-10 h-10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-all disabled:opacity-30 font-bold text-xl"
              >
                −
              </button>
              <span className="font-bold text-lg w-8 text-center text-black dark:text-white">{quantity}</span>
              <button 
                onClick={() => handleQtyChange(quantity + 1)}
                disabled={!selectedVariant || quantity >= (selectedVariant?.stock || 1)}
                className="w-10 h-10 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-all disabled:opacity-30 font-bold text-xl"
              >
                +
              </button>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock <= 0 || addingToCart || cartItemId} 
              className={`w-full flex items-center justify-center gap-3 h-14 font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-300 bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 ${
                cartItemId 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xl shadow-black/20 dark:shadow-white/10 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:shadow-none disabled:text-neutral-500 dark:disabled:text-neutral-600'
              }`}
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : cartItemId ? (
                <><FaCheckCircle className="text-lg" /> Added To Cart</>
              ) : (
                <><FaShoppingBag className="text-lg mb-0.5" /> Add To Cart</>
              )}
            </button>
          </div>

          {/* Secure Checkout Badges */}
          <div className="mt-8">
             <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Guaranteed Safe Checkout</p>
             <div className="flex gap-4 opacity-50 dark:opacity-40 grayscale">
                <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" className="h-6 object-contain dark:invert" alt="Visa" />
                <img src="https://cdn-icons-png.flaticon.com/512/196/196566.png" className="h-6 object-contain dark:invert" alt="Mastercard" />
                <img src="https://cdn-icons-png.flaticon.com/512/196/196565.png" className="h-6 object-contain dark:invert" alt="Paypal" />
             </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION (TABS & RELATED) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-20 pt-16 border-t border-neutral-200 dark:border-neutral-800">
        
        {/* RELATED PRODUCTS (Sidebar) */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <h3 className="font-black text-lg uppercase tracking-tight mb-6 text-black dark:text-white">You May Also Like</h3>
          <div className="flex flex-col gap-6">
            {relatedProducts.length > 0 ? relatedProducts.map((rel) => {
              const relPrice = rel.variants?.[0]?.offerPrice || rel.variants?.[0]?.price || rel.price || 0;
              return (
                <div key={rel.id} className="flex gap-4 items-center group cursor-pointer" onClick={() => router.push(`/product-detail?id=${rel.id}`)}>
                  <div className="w-20 h-24 bg-neutral-50 dark:bg-neutral-900 rounded-2xl overflow-hidden flex-shrink-0 relative">
                     <img src={rel.images?.[0] || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rel.name} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-2 leading-snug">{rel.name}</p>
                    <p className="text-black dark:text-white font-black mt-1.5">₹{relPrice}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl">No related products found.</p>
            )}
          </div>
        </div>

        {/* TABS (Description / Reviews) */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          
          {/* Tab Headers */}
          <div className="flex gap-8 border-b border-neutral-200 dark:border-neutral-800 mb-8 overflow-x-auto hide-scrollbar">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-base font-black uppercase tracking-widest whitespace-nowrap transition-colors relative ${
                  activeTab === tab ? "text-black dark:text-white" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                }`}
              >
                {tab} {tab === 'reviews' && <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full ml-1">{reviews.length}</span>}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-black dark:bg-white rounded-t-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === "description" && (
              <div className="prose prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 leading-loose whitespace-pre-line">
                {product.description || <span className="italic">No description provided for this product.</span>}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Review List */}
                <div>
                  <h3 className="text-xl font-black mb-6 text-black dark:text-white">Customer Reviews</h3>
                  {reviews.length > 0 ? (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-black dark:text-white">{review.userName}</span>
                            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500">
                              {review.createdAt?.toDate().toLocaleDateString() || "Just now"}
                            </span>
                          </div>
                          {renderStars(review.rating)}
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-3xl text-center">
                      <span className="text-3xl mb-3 block">💬</span>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">No reviews yet</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <div className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-black/[0.03] dark:shadow-none h-fit">
                  <h3 className="text-xl font-black mb-6 text-black dark:text-white">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 dark:text-neutral-200 mb-3 uppercase tracking-widest">Select Rating</label>
                      {renderStars(rating, true)} 
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-900 dark:text-neutral-200 mb-3 uppercase tracking-widest">Your Review</label>
                      <textarea 
                        required
                        rows="4" 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none transition-all"
                        placeholder="What did you love about this product?"
                      ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}