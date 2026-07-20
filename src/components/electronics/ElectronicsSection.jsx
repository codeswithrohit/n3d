import ProductSection from "../reusable/ProductSection";

export default function ElectronicsSection() {
  return (
    <div className="max-w-6xl mx-auto px-3 md:px-0">
      <ProductSection
        title="ELECTRONICS"
        themeColor="#009688"
        banner={{
          left: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/s22.jpg",
          center: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/t22.jpg",
        }}
        categories={[
          "Tange manue",
          "Punge nenune",
          "Hanet magente",
          "Knage unget",
        ]}
        featuredProduct={{
          title: "Meagi Gemdcu inges",
          price: 125,
          oldPrice: 159,
          image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/b7.jpg",
        }}
        products={[
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/b9.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/b9.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/b13.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/b15.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/b15.jpg",
            rating: 5,
            sale: true,
          },
        ]}
      />
      <img src="https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/m5.jpg" alt="image" className="w-full h-auto my-8" />
    </div>
  );
}
