import ProductSection from "../reusable/ProductSection";

export default function Computer() {
  return (
    <div className="max-w-6xl mx-auto px-3 md:px-0 pb-5">
      <ProductSection
        title="COMPUTER"
        themeColor="#4BAE4F"
        banner={{
          left: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/s23.jpg",
          center: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/t23.jpg",
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
          image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/t23.jpg",
        }}
        products={[
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/f14.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/f14.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/m16.png",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/m16.png",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/m16.png",
            rating: 5,
            sale: true,
          },
        ]}
      />
    </div>
  );
}
