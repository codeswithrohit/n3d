"use client";

import { FaStar, FaRegStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const news = [
  {
    date: "28",
    month: "MAR",
    title: "Pellentesque Tincidunt Suspendis Malesu",
    desc: "Commodo laoreet semper tincidunt lorem Vestibulum nunc at In Curabitur magna.....",
  },
  {
    date: "01",
    month: "SEP",
    title: "Biten Demonst Raverunt Lector Legere",
    desc: "Commodo laoreet semper tincidunt lorem Vestibulum nunc at In Curabitur magna. Eu.....",
  },
];

const bestsellers = [
  {
    title: "Fuzan Sumata masen itcute",
    price: 88,
    old: 129,
    image:
      "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
  },
  {
    title: "Duidem gokensie rerum facilis",
    price: 123,
    old: 159,
    image:
      "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
  },
];

const brands = [
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/2.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
  "https://demo.smartaddons.com/templates/html/maxshop/image/demo/brands/3.jpg",
 
];

const Stars = () => (
  <div className="flex text-yellow-400 text-sm mb-1">
    <FaStar />
    <FaStar />
    <FaStar />
    <FaStar />
    <FaRegStar />
  </div>
);

export default function NewsBestSellerTestimonial() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      
      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* NEWS */}
        <div>
          <h2 className="font-bold text-lg mb-4 text-gray-700">NEWS UPDATES</h2>

          <div className="space-y-6">
            {news.map((item, i) => (
              <div key={i} className="flex gap-4">
                
                {/* DATE BOX */}
                <div className="bg-gray-200 w-30 h-15 flex flex-col items-center justify-center text-sm font-semibold text-gray-700">
                  <span>{item.date}</span>
                  <span>{item.month}</span>
                </div>

                {/* CONTENT */}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BESTSELLERS */}
        <div>
          <h2 className="font-bold text-lg mb-4 text-gray-700">BESTSELLERS</h2>

          <div className="space-y-6">
            {bestsellers.map((item, i) => (
              <div key={i} className="flex gap-4">
                
                <img
                  src={item.image}
                  alt=""
                  className="w-16 h-16 object-contain border p-2"
                />

                <div>
                  <Stars />
                  <h3 className="text-sm font-semibold text-gray-800">
                    {item.title}
                  </h3>

                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-red-500 font-bold">
                      ₹{item.price}.00
                    </span>
                    <span className="line-through text-gray-400 text-sm">
                      ₹{item.old}.00
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIAL */}
        <div className="bg-gray-200 p-6">
          <h2 className="font-bold text-lg mb-4 text-gray-700">TESTIMONIAL</h2>

          <div className="flex gap-4">
            
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt=""
              className="w-16 h-16 rounded-md object-cover"
            />

            <div>
              <p className="text-sm text-gray-600 italic leading-6">
                “Aliquam ut tellus dignissim, cursus erat ultricies tellus cursus erat ultricies tellus..
                Nulla tempus sollicitudin mauris cursus dictum. Commodo laoreet semper lorem.”
              </p>

              <p className="text-red-500 font-semibold mt-3">
                - BonBon Supper
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BRAND SLIDER */}
      <div className="mt-10 border-1 border-gray-300 p-4 relative">
        
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2000 }}
          slidesPerView={5}
          spaceBetween={30}
          breakpoints={{
            320: { slidesPerView: 2 },
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
          }}
        >
          {brands.map((brand, i) => (
            <SwiperSlide key={i}>
              <div className="flex justify-center items-center h-16">
                <img src={brand} className="h-20 object-contain" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ARROWS (static like design) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200 p-2 cursor-pointer">
          <FaChevronLeft />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 p-2 cursor-pointer">
          <FaChevronRight />
        </div>
      </div>
    </div>
  );
}