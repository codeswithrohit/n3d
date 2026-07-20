"use client";

import React, { useState, useEffect } from 'react';
import { firebase } from '../Firebase/config'; // Adjust path to your config if needed
import { FaWhatsapp } from 'react-icons/fa'; // Imported WhatsApp icon

import Category from '@/src/components/Category/category';
import MainLayout from '@/src/components/heroSection/MainLayout';
import HotDealsSection from '@/src/components/hotDeals/HotDealsSection';
import Gstinvoice from '@/components/Gstinvoice';
import Review from '@/components/Review';
import Gallery from '../components/Gallery';

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

  // Function to handle WhatsApp click
  const handleWhatsAppClick = () => {
    const phoneNumber = "919155242261"; // Number without the '+' for the wa.me link
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  // 2. Show the actual page content when loading is false
  return (
    <div className="bg-black min-h-screen transition-colors duration-300 relative">
      <MainLayout />
      <HotDealsSection />
      <Category />
      <Gallery/>
      <Review/>

      {/* <Gstinvoice/> */}

      {/* Floating WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-20 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-2xl transition-all duration-300 z-50 flex items-center justify-center focus:outline-none"
        aria-label="Chat with us on WhatsApp"
      >
        <FaWhatsapp className="w-8 h-8" />
      </button>
    </div>
  );
}

export default Index;