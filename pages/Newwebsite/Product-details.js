"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head"; // <-- Imported next/head
import { firebase } from '../../Firebase/config'; 
import { 
  FaStar, FaRegStar, FaCheckCircle, FaShoppingBag, 
  FaShareAlt, FaLink, FaTimes, FaBolt, FaShieldAlt, FaTruck 
} from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import 'react-quill-new/dist/quill.snow.css'; 

export default function ProductDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = searchParams.get("id"); 

  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("description");
  const [mainImage, setMainImage] = useState(null); 
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [cartItemId, setCartItemId] = useState(null); 
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Review Form States
  const [reviewerName, setReviewerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  const [showResellModal, setShowResellModal] = useState(false);
  const [resellPriceInput, setResellPriceInput] = useState("");
  const [resellError, setResellError] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

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
      const docSnap = await db.collection('Newproducts').doc(id).get();
      if (!docSnap.exists) {
        setLoading(false);
        return;
      }
      
      const rawData = docSnap.data();
      let normalizedMedia = [];
      if (rawData.media && rawData.media.length > 0) {
        normalizedMedia = rawData.media;
      } else if (rawData.images && rawData.images.length > 0) {
        normalizedMedia = rawData.images.map(img => ({ url: img, type: 'image' }));
      }

      const prodData = { id: docSnap.id, ...rawData, media: normalizedMedia };
      
      setProduct(prodData);
      setMainImage(normalizedMedia[0] || null);
      setSelectedVariant(prodData.variants?.[0] || null);

      if (prodData.categoryId) {
        const relatedSnap = await db.collection('Newproducts')
          .where('categoryId', '==', prodData.categoryId)
          .limit(5)
          .get();
        
        const related = [];
        relatedSnap.forEach(doc => {
          if (doc.id !== id) {
            const rData = doc.data();
            let rMedia = [];
            if (rData.media && rData.media.length > 0) rMedia = rData.media;
            else if (rData.images && rData.images.length > 0) rMedia = rData.images.map(img => ({ url: img, type: 'image' }));
            related.push({ id: doc.id, ...rData, media: rMedia });
          }
        });
        setRelatedProducts(related.slice(0, 4));
      }

      const reviewsSnap = await db.collection('Newproducts').doc(id).collection('reviews').orderBy('createdAt', 'desc').get();
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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
      } catch (error) {
        console.error("Error auto-updating cart quantity:", error);
      }
    }
  };

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
      const cartRef = db.collection('n3duser').doc(user.uid).collection('cart');
      await cartRef.add({
        productId: id,
        productName: product.name,
        image: mainImage?.url || product.media?.[0]?.url || '',
        variant: selectedVariant,
        price: selectedVariant.offerPrice || selectedVariant.price,
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

  const handleBuyNow = () => {
    if (!selectedVariant) {
      alert("Please select an option/variant first.");
      return;
    }
    const urlResellPrice = searchParams.get("resellPrice");
    const activePrice = urlResellPrice || selectedVariant.offerPrice || selectedVariant.price || product.price || 0;

    const query = new URLSearchParams({
      id: id,
      variant: selectedVariant.optionValue,
      qty: quantity.toString(),
      price: activePrice.toString()
    }).toString();

    router.push(`/Newwebsite/Checkout?${query}`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim()) return alert("Please enter your name.");
    if (rating === 0) return alert("Please select a rating.");
    if (!reviewText.trim()) return alert("Please write a review.");

    try {
      const reviewData = {
        rating,
        text: reviewText,
        userName: reviewerName.trim(), 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('Newproducts').doc(id).collection('reviews').add(reviewData);

      const newReviewCount = (product.reviewCount || 0) + 1;
      const currentTotalScore = (product.averageRating || 0) * (product.reviewCount || 0);
      const newAverage = (currentTotalScore + rating) / newReviewCount;

      await db.collection('Newproducts').doc(id).update({
        averageRating: newAverage,
        reviewCount: newReviewCount
      });

      setReviewerName("");
      setReviewText("");
      setRating(0);
      fetchProductData(); 
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleResellPriceChange = (e) => {
    const val = e.target.value;
    setResellPriceInput(val);

    if (val === "") {
      setResellError("");
      setShareLink("");
      return;
    }

    const enteredPrice = Number(val);
    const maxResellPrice = Number(selectedVariant?.resellPrice || 0);
    const baseOfferPrice = Number(selectedVariant?.offerPrice || 0);

    if (enteredPrice <= 0) {
      setResellError("Please enter a valid price.");
      setShareLink("");
      return;
    }
    
    if (enteredPrice > maxResellPrice) {
      setResellError(`Resell price cannot exceed ₹${maxResellPrice}`);
      setShareLink("");
      return;
    }

    if (enteredPrice < baseOfferPrice) {
      setResellError(`Resell price cannot be lower than ₹${baseOfferPrice}`);
      setShareLink("");
      return;
    }

    setResellError("");
    const host = typeof window !== "undefined" ? window.location.origin : "";
    const generatedUrl = `${host}/productdetails?id=${id}&resellPrice=${enteredPrice}`;
    setShareLink(generatedUrl);
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${product?.name}`,
          text: `Check out this product at a special price!`,
          url: shareLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("System sharing is not supported on this browser. Please use the Copy Link button.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className={`flex text-yellow-400 ${interactive ? 'text-2xl cursor-pointer gap-1' : 'text-sm'}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} onClick={() => interactive && setRating(star)} className={interactive ? 'hover:scale-110 transition-transform' : ''}>
            {star <= Math.round(ratingValue) ? <FaStar /> : <FaRegStar className="text-gray-300 dark:text-gray-600" />}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-3xl h-[500px]"></div>
          <div className="space-y-6 pt-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl w-1/4 mt-8"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) return <div className="py-32 text-center text-xl font-medium text-gray-500">Product not found.</div>;

  const urlResellPrice = searchParams.get("resellPrice");
  const price = urlResellPrice || selectedVariant?.offerPrice || selectedVariant?.price || product.price || 0;
  const oldPrice = selectedVariant?.price || product.originalPrice || 0;
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const maxResellPrice = selectedVariant?.resellPrice || 0;

  return (
    <div className="bg-white dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 min-h-screen pb-24">
      
      {/* ================= DYNAMIC HEAD TAGS ================= */}
      <Head>
        <title>{product ? `${product.name} | Store` : 'Product Details'}</title>
        {product && (
          <>
            <meta name="title" content={product.name} />
            <meta name="description" content={`Buy ${product.name} for just ₹${price}. Secure checkout and fast delivery.`} />
            
            {/* Open Graph / Social Media Sharing */}
            <meta property="og:type" content="product" />
            <meta property="og:title" content={product.name} />
            <meta property="og:description" content={`Buy ${product.name} for just ₹${price}. Secure checkout and fast delivery.`} />
            <meta property="og:image" content={mainImage?.url || '/placeholder.png'} />
            
            {/* E-commerce Specific Meta Tags */}
            <meta property="product:price:amount" content={price} />
            <meta property="product:price:currency" content="INR" />
            <meta property="product:availability" content={selectedVariant?.stock > 0 ? "in stock" : "out of stock"} />
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={product.name} />
            <meta name="twitter:description" content={`Buy ${product.name} for just ₹${price}.`} />
            <meta name="twitter:image" content={mainImage?.url || '/placeholder.png'} />
          </>
        )}
      </Head>

      {/* RESELL MODAL */}
      {showResellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
            <button onClick={() => { setShowResellModal(false); setShareLink(""); setResellPriceInput(""); }} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors">
              <FaTimes className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold mb-2">Resell Product</h2>
            <p className="text-sm text-gray-500 mb-6">Max allowed price: <strong className="text-green-600">₹{maxResellPrice}</strong></p>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Your Price (₹)</label>
              <input type="number" value={resellPriceInput} onChange={handleResellPriceChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold outline-none focus:border-gray-900" placeholder={`e.g. ${maxResellPrice}`} />
              {resellError && <p className="text-red-500 text-xs mt-2">{resellError}</p>}
            </div>
            {shareLink && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Shareable Link:</p>
                  <p className="text-sm truncate font-medium">{shareLink}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSystemShare} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 text-sm font-semibold">
                    <FaShareAlt /> Share
                  </button>
                  <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 rounded-xl hover:bg-gray-200 text-sm font-semibold">
                    <FaLink /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: MEDIA GALLERY */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-24 h-fit">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:w-20 flex-shrink-0 hide-scrollbar">
              {product.media?.map((item, i) => (
                <div key={i} onClick={() => setMainImage(item)} className={`w-16 h-20 md:w-full md:h-24 rounded-xl cursor-pointer overflow-hidden relative transition-all ${mainImage?.url === item.url ? 'ring-2 ring-gray-900 ring-offset-2 opacity-100' : 'opacity-60 hover:opacity-100 bg-gray-50'}`}>
                  {item.type === 'video' ? (
                    <><video src={item.url} className="w-full h-full object-cover" muted playsInline /><div className="absolute inset-0 bg-black/10 flex items-center justify-center"><div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center pl-0.5 text-[10px]">▶</div></div></>
                  ) : (<img src={item.url} className="w-full h-full object-cover" alt="thumb" />)}
                </div>
              ))}
            </div>

            <div className="flex-1 aspect-[4/5] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
              {mainImage?.type === 'video' ? (
                <video src={mainImage.url} controls autoPlay className="w-full h-full object-contain bg-black" />
              ) : (
                <img src={mainImage?.url || '/placeholder.png'} className="w-full h-full object-contain" alt={product.name} />
              )}
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="lg:col-span-5 flex flex-col pt-2 lg:pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              {renderStars(product.averageRating || 0)}
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer transition-colors" onClick={() => setActiveTab("reviews")}>
                ({product.reviewCount || 0} customer reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">₹{price}</span>
              {discount > 0 && <span className="text-lg text-gray-400 line-through">₹{oldPrice}</span>}
            </div>

            {/* VARIANTS */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Variant</p>
                  {selectedVariant && (
                    <p className={`text-xs font-medium ${selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {selectedVariant.stock > 0 ? `In Stock` : 'Out of Stock'}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, idx) => {
                    const isSelected = selectedVariant?.optionValue === variant.optionValue;
                    return (
                      <button
                        key={idx}
                        onClick={() => { setSelectedVariant(variant); setShareLink(""); setResellPriceInput(""); setResellError(""); }}
                        className={`px-5 py-2.5 text-sm font-medium rounded-full border transition-all ${
                          isSelected ? "border-gray-900 bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-900 bg-white"
                        }`}
                      >
                        {variant.optionValue}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUANTITY & ACTIONS */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-between border border-gray-200 rounded-full h-12 px-1 w-32 bg-white">
                  <button onClick={() => handleQtyChange(quantity - 1)} disabled={quantity <= 1 || !selectedVariant} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg rounded-full"> − </button>
                  <span className="font-medium text-sm w-8 text-center">{quantity}</span>
                  <button onClick={() => handleQtyChange(quantity + 1)} disabled={!selectedVariant || quantity >= (selectedVariant?.stock || 1)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 text-lg rounded-full"> + </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button 
                  onClick={handleBuyNow}
                  disabled={!selectedVariant || selectedVariant.stock <= 0} 
                  className="w-full flex items-center justify-center gap-3 h-14 font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-300 bg-red-600 text-white hover:bg-red-900 shadow-xl shadow-indigo-600/20"
                >
                  <FaBolt /> Buy It Now
                </button>
              </div>
            </div>

            {/* TRUST BADGES */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2"><FaShieldAlt className="text-gray-400" /> Secure Checkout</div>
              <div className="flex items-center gap-2"><FaTruck className="text-gray-400" /> Fast Delivery</div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: TABS */}
        <div className="mt-24">
          <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
            {["description", "reviews"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-colors relative ${activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-700"}`}>
                {tab} {tab === 'reviews' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-1">{reviews.length}</span>}
                {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></span>}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {activeTab === "description" && (
              <div className="max-w-4xl">
                {product.description ? (
                  <div className="ql-snow"><div className="ql-editor p-0 text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} /></div>
                ) : (<span className="italic text-gray-500">No description provided.</span>)}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7">
                  <h3 className="text-lg font-bold mb-6">Customer Reviews</h3>
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-gray-50 p-6 rounded-2xl">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-gray-900">{review.userName}</span>
                            <span className="text-xs text-gray-500">{review.createdAt?.toDate().toLocaleDateString() || "Just now"}</span>
                          </div>
                          {renderStars(review.rating)}
                          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (<p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>)}
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-gray-50 border border-gray-100 p-8 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6">Write a Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Name</label>
                        <input 
                          type="text" 
                          required 
                          value={reviewerName} 
                          onChange={(e) => setReviewerName(e.target.value)} 
                          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 transition-all text-sm" 
                          placeholder="Your Name" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Rating</label>
                        {renderStars(rating, true)} 
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Review</label>
                        <textarea required rows="4" value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 transition-all resize-none text-sm" placeholder="What did you love about this product?"></textarea>
                      </div>
                      <button type="submit" className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors">Submit Review</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-gray-100 pt-16">
            <h3 className="font-bold text-2xl mb-8">You May Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relPrice = rel.variants?.[0]?.offerPrice || rel.variants?.[0]?.price || rel.price || 0;
                const relImgUrl = rel.media?.[0]?.url || '/placeholder.png';
                return (
                  <div key={rel.id} className="group cursor-pointer" onClick={() => router.push(`/product-detail?id=${rel.id}`)}>
                    <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden mb-4 relative">
                      {rel.media?.[0]?.type === 'video' ? (
                        <video src={relImgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted playsInline />
                      ) : (
                        <img src={relImgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={rel.name} />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">{rel.name}</p>
                    <p className="text-gray-500 font-medium text-sm">₹{relPrice}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}