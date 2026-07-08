"use client";

import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config';
import { useRouter } from 'next/navigation';

const Topcategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const db = firebase.firestore();
        // Fetch categories from Firestore
        const snapshot = await db.collection('n3dcategories').orderBy('createdAt', 'desc').get();
        
        const fetchedCats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(fetchedCats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Skeleton Loader for when data is fetching
  if (loading) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-12">
         <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-gray-900 tracking-wide">Top Categories</h2>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
           {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                 <div className="w-full aspect-square bg-gray-200 dark:bg-neutral-800 rounded-2xl mb-4"></div>
                 <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-2/3"></div>
              </div>
           ))}
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-2 font-sans">
      <h2 className="text-2xl md:text-3xl font-bold underline text-center mb-10 text-white dark:text-white tracking-wide">
        Top Categories
      </h2>

      {/* Grid: 2 cols on mobile, 3 on small tablets, 4 on medium, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              // Pass only the parent category details to the routing URL
              router.push(`/category?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`);
            }}
            className="flex flex-col items-center group cursor-pointer"
          >
            {/* Image Card Container */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#e0f2fe] dark:bg-neutral-800 shadow-sm mb-3">
              <img
                src={cat.logo || (cat.sliders && cat.sliders[0]) || "/placeholder-category.png"} 
                alt={cat.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-in-out"
              />

              {cat.badge && (
                <div className="absolute bottom-2 left-0 bg-white/80 dark:bg-black/60 backdrop-blur-sm text-gray-800 dark:text-white text-[11px] font-bold px-3 py-1 rounded-r-lg shadow-sm">
                  {cat.badge}
                </div>
              )}
            </div>

            {/* Category Name */}
            <h3 className="text-sm sm:text-[15px] font-bold text-white text-center group-hover:text-red-700 transition-colors capitalize">
              {cat.name}
            </h3>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No categories found. Please add them from the admin panel.
        </div>
      )}
    </div>
  );
};

export default Topcategories;