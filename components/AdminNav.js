import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const AdminNav = () => {
  const router = useRouter();

  // Helper to safely check paths, avoiding errors during SSR
  const currentPath = router ? router.pathname.toLowerCase() : '';

  // Defined navigation tabs with UNIQUE, professional icons
  const navItems = [
    {
      name: 'Dashboard',
      path: '/Admin',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Products',
      path: '/Admin/Products',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: 'Users',
      path: '/Admin/Users',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Influencer',
      path: '/Admin/Influencer',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      name: 'Contact',
      path: '/Admin/contactus',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Review',
      path: '/Admin/Review',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      name: 'Gallery',
      path: '/Admin/gallery',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Orders',
      path: '/Admin/orders',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Inline styles to hide the scrollbar for a seamless UI */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Spacer to prevent content from hiding behind the fixed navigation */}
      <div className="h-24 sm:h-32 w-full pb-safe"></div>

      {/* Floating Bottom Navigation Container */}
      <div className="fixed bottom-0 left-0 w-full z-50 sm:bottom-6 sm:px-4 pointer-events-none flex justify-center">
        
        {/* Glassmorphism Dock */}
        <nav className="pointer-events-auto w-full sm:w-auto bg-white/85 backdrop-blur-xl border-t sm:border border-gray-200/60 sm:rounded-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] sm:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          
          {/* Scrollable Container (Crucial for 8 items on mobile) */}
          <ul className="flex items-center overflow-x-auto hide-scrollbar px-2 py-2 sm:px-3 gap-1 sm:gap-2">
            
            {navItems.map((item) => {
              const itemPath = item.path.toLowerCase();
              
              // Exact match for the dashboard, or startsWith logic for sub-routes
              const isActive = currentPath === itemPath || 
                               (itemPath !== '/admin' && currentPath.startsWith(itemPath));

              return (
                <li key={item.name} className="flex-shrink-0">
                  <Link
                    href={item.path}
                    className={`relative flex flex-col items-center justify-center w-[72px] sm:w-20 py-2 sm:py-2.5 rounded-xl transition-all duration-300 ease-out group ${
                      isActive 
                        ? 'bg-indigo-50/80 text-indigo-600' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                  >
                    {/* Icon Container */}
                    <div className={`transition-transform duration-300 ease-out mb-1 ${
                      isActive ? 'scale-110' : 'group-hover:-translate-y-0.5'
                    }`}>
                      {item.icon}
                    </div>

                    {/* Text Label */}
                    <span className={`text-[10px] sm:text-xs tracking-wide transition-colors duration-300 ${
                      isActive ? 'font-semibold' : 'font-medium opacity-90 group-hover:opacity-100'
                    }`}>
                      {item.name}
                    </span>

                    {/* Subtle Active Indicator Dot */}
                    {isActive && (
                      <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-600 shadow-sm"></span>
                    )}
                  </Link>
                </li>
              );
            })}

          </ul>
        </nav>
      </div>
    </>
  );
};

export default AdminNav;