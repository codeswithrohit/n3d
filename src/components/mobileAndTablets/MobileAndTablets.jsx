import ProductSection from "../reusable/ProductSection";

export default function MobileAndTablets() {
  return (
    <div className="max-w-6xl mx-auto px-3 md:px-0">
      <ProductSection
        title="Mobiles & Tablets"
        themeColor="#FE5621"
        banner={{
          left: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/s21.jpg",
          center: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/s21.jpg",
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
          image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/t3.jpg",
        }}
        products={[
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/19.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/e6.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/11.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/4.jpg",
            rating: 5,
            sale: true,
          },
          {
            id: 1,
            title: "Lampac Sende cuisei",
            price: 95,
            oldPrice: 119,
            image: "https://demo.smartaddons.com/templates/html/maxshop/image/demo/shop/product/e2.jpg",
            rating: 5,
            sale: true,
          },
        ]}
      />
      <img src="https://demo.smartaddons.com/templates/html/maxshop/image/demo/banner/m7.jpg" alt="image" className="w-full h-auto my-8" />
    </div>
  );
}
