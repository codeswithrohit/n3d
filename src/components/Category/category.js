"use client";

import React, { useState, useEffect } from 'react';
import { firebase } from '../../../Firebase/config'; // Adjust path
import ProductSection from "../reusable/ProductSection"; // Adjust path

export default function CategorySectionsWrapper() {
  const [sectionsData, setSectionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Array of theme colors to cycle through for different categories
  const themeColors = ["#4BAE4F", "#F44336", "#2196F3", "#FF9800", "#9C27B0", "#E91E63"];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const db = firebase.firestore();

        // 1. Fetch all data in parallel for speed
        const [catsSnap, subsSnap, prodsSnap] = await Promise.all([
          db.collection('n3dcategories').get(),
          db.collection('n3dsubcategories').get(),
          db.collection('n3dproducts').get()
        ]);

        const categories = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const subcategories = subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const products = prodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Group Products and Subcategories by Category
        const groupedData = categories.map((cat, index) => {
          const catProducts = products.filter(p => p.categoryId === cat.id);
          const catSubs = subcategories.filter(s => s.categoryId === cat.id);
          
          return {
            ...cat,
            products: catProducts,
            subcategories: catSubs,
            themeColor: themeColors[index % themeColors.length] // Assign a rotating color
          };
        }).filter(cat => cat.products.length > 0); // Only show categories that actually have products

        setSectionsData(groupedData);

      } catch (error) {
        console.error("Error fetching category sections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading Categories...</p>
        </div>
      </div>
    );
  }

  return (
    // 🔥 FIX: Removed hardcoded bg-[#FFFFFF] and replaced with dark mode responsive backgrounds
    <div className="bg-black  space-y-10 pb-10 transition-colors duration-300 min-h-screen">
      {sectionsData.map((category) => {
        
        // Define featured product (e.g., the first product in the list or highest rated)
        const featured = category.products[0];
        
        // Extract pricing for featured product safely
        const featPrice = featured?.variants?.[0]?.offerPrice || featured?.variants?.[0]?.price || 0;
        const featOldPrice = featured?.variants?.[0]?.price || 0;

        return (
          <div key={category.id} className="mx-auto px-3 md:px-0">
            <ProductSection
              title={category.name?.toUpperCase() || "CATEGORY"}
              
              // 🔥 FIX 1: Pass the actual Category ID down to the ProductSection
              categoryId={category.id} 
              
              themeColor={category.themeColor}
              banner={{
                // If category has sliders, use them, otherwise use placeholders
                left: category.sliders?.[0] || "https://dummyimage.com/200x400/ccc/fff&text=Ad",
                center: category.sliders?.[1] || category.sliders?.[0] || "https://dummyimage.com/800x400/eee/999&text=Category+Banner",
              }}
              
              // 🔥 FIX 2: Pass the entire subcategory object so we don't lose the subcategory ID!
              categories={category.subcategories} 
              
              products={category.products}
              featuredProduct={featured ? {
                id: featured.id,
                title: featured.name,
                price: featPrice,
                oldPrice: featOldPrice,
                image: featured.images?.[0] || "/placeholder.png",
                rating: featured.averageRating || 0,
                sale: featPrice < featOldPrice
              } : null}
            />
          </div>
        );
      })}
    </div>
  );
}