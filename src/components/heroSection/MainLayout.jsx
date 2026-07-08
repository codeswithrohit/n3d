"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Carousel from "./Carousel";
import PromoGrid from "./PromoGrid";
import Topcategories from "@/components/Topcategories";
import Influencer from "@/components/Influencer";
import Pricerange from "@/components/Pricerange";
import Gstinvoice from "@/components/Gstinvoice";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-black">
      {/* Header */}
      {/* <Header setSidebarOpen={setSidebarOpen} /> */}

      <div className="w-full   px-0">
        <div className="flex md:gap-4">
        

          {/* Carousel */}
          <div className="flex-1">
            <Carousel />
          </div>
    
        </div>
        <Topcategories/>
        <Influencer/>
        <Pricerange/>

        {/* <div className="my-5 md:my-8">
          <PromoGrid />
        </div> */}
      </div>
    </div>
  );
}
