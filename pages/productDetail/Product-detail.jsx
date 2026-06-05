"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../../Firebase/config'; // Adjust path as needed
import { FaStar, FaRegStar } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id; // Assumes route is /product/[id]

  // State
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState("description");
  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // Review Form State
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  const db = firebase.firestore();

  useEffect(() => {
    if (!id) return;
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      // 1. Fetch Product
      const docSnap = await db.collection('n3dproducts').doc(id).get();
      if (!docSnap.exists) {
        setLoading(false);
        return;
      }
      
      const prodData = { id: docSnap.id, ...docSnap.data() };
      setProduct(prodData);
      setMainImage(prodData.images?.[0] || "");
      setSelectedVariant(prodData.variants?.[0] || null);

      // 2. Fetch Related Products (Same Category, limit to 4)
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

      // 3. Fetch Reviews
      const reviewsSnap = await db.collection('n3dproducts').doc(id).collection('reviews').orderBy('createdAt', 'desc').get();
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating of at least 1 star.");
    if (!reviewText.trim()) return alert("Please write a review.");

    try {
      const reviewData = {
        rating,
        text: reviewText,
        userName: "Guest User", // Replace with auth user if you have login
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Save review to subcollection
      await db.collection('n3dproducts').doc(id).collection('reviews').add(reviewData);

      // Recalculate Average Rating and update main product doc
      const newReviewCount = (product.reviewCount || 0) + 1;
      const currentTotalScore = (product.averageRating || 0) * (product.reviewCount || 0);
      const newAverage = (currentTotalScore + rating) / newReviewCount;

      await db.collection('n3dproducts').doc(id).update({
        averageRating: newAverage,
        reviewCount: newReviewCount
      });

      alert("Review submitted successfully!");
      setReviewText("");
      setRating(0);
      fetchProductData(); // Refresh data

    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  // Star rendering helper
  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className="flex text-yellow-400 text-lg cursor-pointer">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} onClick={() => interactive && setRating(star)}>
            {star <= ratingValue ? <FaStar /> : <FaRegStar />}
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center">Loading product details...</div>;
  if (!product) return <div className="p-10 text-center">Product not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 font-sans text-gray-800">
      
      {/* ================= TOP SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: IMAGES */}
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 overflow-auto">
            {product.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setMainImage(img)}
                className={`w-16 h-16 border rounded cursor-pointer object-cover transition-colors ${mainImage === img ? 'border-red-500 shadow-md' : 'hover:border-red-300'}`}
                alt="thumbnail"
              />
            ))}
          </div>

          {/* Main Image */}
          <div className="border border-gray-200 rounded-lg p-4 flex-1 flex items-center justify-center bg-white shadow-sm">
            <img src={mainImage || '/placeholder.png'} className="h-96 w-full object-contain" alt={product.name} />
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="col-span-2 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* RATING */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {renderStars(product.averageRating || 0)}
            <span className="cursor-pointer hover:text-red-500" onClick={() => setActiveTab("reviews")}>
              {product.reviewCount || 0} reviews | Write a review
            </span>
          </div>

          {/* PRICE (Based on selected variant) */}
          {selectedVariant && (
            <div className="flex items-end gap-3 pt-2">
              <span className="text-red-500 text-3xl font-black">
                ₹{selectedVariant.offerPrice || selectedVariant.price}
              </span>
              {selectedVariant.offerPrice && selectedVariant.offerPrice < selectedVariant.price && (
                <span className="line-through text-gray-400 text-lg mb-1">₹{selectedVariant.price}</span>
              )}
            </div>
          )}

          {/* VARIANTS */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="font-semibold mb-3 uppercase tracking-wide text-xs text-gray-500">Available Options</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 text-sm border rounded-lg font-medium transition-colors ${
                      selectedVariant === variant ? "border-red-500 bg-red-50 text-red-700" : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {variant.optionValue}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                 <p className={`text-sm mt-3 font-semibold ${selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                   {selectedVariant.stock > 0 ? `In Stock (${selectedVariant.stock} available)` : 'Out of Stock'}
                 </p>
              )}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-3 pt-6">
            <input type="number" defaultValue={1} min={1} max={selectedVariant?.stock || 1} className="w-20 border border-gray-300 rounded-lg px-3 py-3 text-center outline-none focus:border-red-500" />
            <button disabled={!selectedVariant || selectedVariant.stock <= 0} className="bg-gray-900 text-white font-bold px-8 py-3 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              ADD TO CART
            </button>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
        
        {/* RELATED PRODUCTS SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-red-500 text-white px-4 py-3 font-bold uppercase tracking-wide rounded-t-lg">
            Related Products
          </div>
          <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 space-y-4">
            {relatedProducts.length > 0 ? relatedProducts.map((rel) => {
              const relPrice = rel.variants?.[0]?.offerPrice || rel.variants?.[0]?.price || 0;
              return (
                <div key={rel.id} className="flex gap-3 items-center group cursor-pointer border-b pb-4 last:border-0 last:pb-0" onClick={() => router.push(`/product/${rel.id}`)}>
                  <img src={rel.images?.[0] || '/placeholder.png'} className="w-16 h-16 object-cover rounded border" alt={rel.name} />
                  <div>
                    <p className="text-sm font-semibold group-hover:text-red-500 transition-colors line-clamp-2">{rel.name}</p>
                    <p className="text-red-500 font-bold text-sm mt-1">₹{relPrice}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-gray-500">No related products found.</p>
            )}
          </div>
        </div>

        {/* TABS & DETAILS */}
        <div className="lg:col-span-3">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 gap-2">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
                  activeTab === tab ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab} {tab === 'reviews' && `(${reviews.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="border border-t-0 border-gray-200 p-6 rounded-b-lg bg-white min-h-[300px]">
            
            {/* Description Tab */}
            {activeTab === "description" && (
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description || "No description provided for this product."}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Existing Reviews */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Customer Reviews</h3>
                  {reviews.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {reviews.map(review => (
                        <div key={review.id} className="border-b pb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-sm">{review.userName}</span>
                            <span className="text-xs text-gray-400">
                              {review.createdAt?.toDate().toLocaleDateString() || "Just now"}
                            </span>
                          </div>
                          {renderStars(review.rating)}
                          <p className="text-sm text-gray-600 mt-2">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
                  )}
                </div>

                {/* Write a Review Form */}
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Rating</label>
                      {renderStars(rating, true)} {/* True enables interactive clicking */}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Your Review</label>
                      <textarea 
                        required
                        rows="4" 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-red-500 resize-none"
                        placeholder="What did you think about this product?"
                      ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors">
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