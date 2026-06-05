"use client";

import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config'; // Adjust path to your config if needed

import Category from '@/src/components/Category/category';
import MainLayout from '@/src/components/heroSection/MainLayout';
import HotDealsSection from '@/src/components/hotDeals/HotDealsSection';
import Gstinvoice from '@/components/Gstinvoice';

const Index = () => {
  // State to manage the loading spinner
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch data before rendering the page
    const fetchPageData = async () => {
      try {
        const db = firebase.firestore();
        
        // Example: Ping the products collection to ensure data is ready 
        // (You can also pass this fetched data down to your components as props if needed)
        await db.collection('n3dproducts').limit(1).get();
        
      } catch (error) {
        console.error("Error fetching initial page data:", error);
      } finally {
        // Stop the spinner regardless of success or error
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  // 1. Show a loading spinner while fetching initial data
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors duration-300">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
  //     </div>
  //   );
  // }

  // 2. Show the actual page content when loading is false
  return (
    <div className="bg-white  min-h-screen transition-colors duration-300">
      <MainLayout />
      <HotDealsSection />
      <Category />
      {/* <Gstinvoice/> */}
    </div>
  );
}

export default Index;