"use client";

const data = [
  {
    img: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/m1.jpg",
  },
  {
    img: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/m2.jpg",
  },
  {
    img: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/m3.jpg",
  },
  {
    img: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/m4.jpg",
  },
];

export default function PromoGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-0 p-3 lg:p-0  max-w-6xl">
      {data.map((item, index) => (
        <div
          key={index}
          className={`relative overflow-hidden ${item.color} group`}
        >
          {/* IMAGE */}
          <img
            src={item.img}
            alt=""
            className="w-full  sm:h-[140px] md:h-[160px] lg:h-[180px] object-cover"
          />

          {/* 🔥 HOVER BLACK SHADOW (CENTER → BOTH SIDE) */}
          <div
            className="absolute inset-0 
            bg-gradient-to-r from-black/60 via-black/20 to-black/60 
            opacity-0 group-hover:opacity-100 
            transition duration-500"
          ></div>
        </div>
      ))}
    </div>
  );
}
