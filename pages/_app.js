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