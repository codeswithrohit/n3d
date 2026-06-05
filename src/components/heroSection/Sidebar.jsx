"use client";

import React, { useState, useEffect } from "react";
import { firebase } from '../../../Firebase/config';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  // States to hold dynamic data from Firebase
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and subcategories when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = firebase.firestore();
        
        // Fetch Categories
        const catSnap = await db.collection('n3dcategories').orderBy('createdAt', 'desc').get();
        const fetchedCategories = catSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch Subcategories
        const subSnap = await db.collection('n3dsubcategories').orderBy('createdAt', 'desc').get();
        const fetchedSubcategories = subSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(fetchedCategories);
        setSubcategories(fetchedSubcategories);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static top-0 left-0 h-full w-[260px] bg-[#2c2c2c] text-white z-50 transform transition-transform duration-300 shadow-xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 overflow-y-auto custom-scrollbar`}
      >
        {/* Header */}
        <div className="bg-red-500 px-4 py-4 font-bold text-sm tracking-wider flex justify-between items-center sticky top-0 z-10 shadow-md">
          <span>CATEGORIES</span>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden text-white hover:text-red-200 text-xl font-bold"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white opacity-50"></div>
          </div>
        ) : (
          <ul className="text-sm font-medium pb-20">
            {categories.length > 0 ? (
              categories.map((item) => {
                // Filter subcategories that belong to this category
                const catSubs = subcategories.filter(sub => sub.categoryId === item.id);

                return (
                  <li
                    key={item.id}
                    className="group border-b border-gray-700 cursor-pointer flex flex-col"
                  >
                    {/* Category Header */}
                    <div className="px-5 py-3.5 hover:bg-gray-700/50 hover:text-red-400 transition-all duration-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 opacity-50 group-hover:bg-red-400"></span>
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {item.name}
                        </span>
                      </div>
                      
                      {/* Show Arrow only if Subcategories exist */}
                      {catSubs.length > 0 && (
                        <span className="text-gray-500 text-xs group-hover:rotate-90 transition-transform duration-300">
                          ▶
                        </span>
                      )}
                    </div>

                    {/* Subcategories Dropdown (Expands smoothly on hover) */}
                    {catSubs.length > 0 && (
                      <div className="max-h-0 overflow-hidden group-hover:max-h-[500px] transition-all duration-500 ease-in-out bg-[#1f1f1f]">
                        <ul className="py-2 space-y-1 border-t border-gray-800">
                          {catSubs.map((sub) => (
                            <li
                              key={sub.id}
                              className="px-10 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                              {sub.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-5 py-4 text-gray-400 italic text-center">
                No categories found.
              </li>
            )}
          </ul>
        )}
      </div>
    </>
  );
}