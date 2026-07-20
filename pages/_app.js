import Head from "next/head";
import { useRouter } from "next/router";
import Footer from "@/src/components/reusable/Footer";
import Header from "@/src/components/reusable/Header";
import AdminNav from "@/components/AdminNav";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  // Check if the current route starts with /Admin or /admin
  const isAdminRoute = router.pathname.toLowerCase().startsWith('/admin');

  return (
    <>
      {/* Next.js Head for SEO and Meta tags */}
      <Head>
        <title>N3d – Elevate your space</title>
        <meta 
          name="description" 
          content="Elevate your space with stylish, modern, and timeless decor pieces. Address: Moh-Dhanpurwa, PO+PS-Sasaram(Rohtas)Bihar, Bihar, Sasaram, 821115" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Only show standard Header if it's NOT an admin route */}
      {!isAdminRoute && <Header />}

      {/* Main Page Content */}
      <Component {...pageProps} />

      {/* Only show standard Footer if it's NOT an admin route */}
      {!isAdminRoute && <Footer />}

      {/* Show Admin Navigation ONLY if it IS an admin route */}
      {isAdminRoute && <AdminNav />}
    </>
  );
}