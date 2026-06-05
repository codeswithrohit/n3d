import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const AdminNav = () => {
  const router = useRouter();

  // Define your navigation tabs and their routes
  const navItems = [
    {
      name: 'Dashboard',
      path: '/Admin', 
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'n3dproducts',
      path: '/Admin/Products',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: 'Users',
      path: '/Admin/Users',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Influencer',
      path: '/Admin/Influencer',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Orders',
      path: '/Admin/orders',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  // Helper to safely check paths, avoiding errors during SSR
  const currentPath = router ? router.pathname.toLowerCase() : '';

  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed navigation */}
      <div className="h-24 sm:h-32 w-full"></div>

      {/* Floating Bottom Navigation Container */}
      <div className="fixed bottom-0 left-0 w-full z-50 sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-max px-4 pb-6 sm:pb-0 pointer-events-none">
        <nav className="pointer-events-auto bg-white/75 backdrop-blur-lg border border-gray-200/50 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden">
          <ul className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 p-2">
            
            {navItems.map((item) => {
              const itemPath = item.path.toLowerCase();
              
              // Exact match for the dashboard, or startsWith logic for sub-routes
              const isActive = currentPath === itemPath || 
                               (itemPath !== '/admin' && currentPath.startsWith(itemPath));

              return (
                <li key={item.name} className="flex-1 sm:flex-none">
                  <Link
                    href={item.path}
                    className={`relative flex flex-col items-center justify-center w-full sm:w-24 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out group ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    {/* Icon Container with smooth bounce on hover */}
                    <div className={`transition-transform duration-300 ease-out mb-1 ${isActive ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
                      {item.icon}
                    </div>

                    {/* Text Label */}
                    <span className={`text-[10px] sm:text-xs tracking-wide transition-colors duration-300 ${isActive ? 'font-medium' : 'font-medium opacity-80 group-hover:opacity-100'}`}>
                      {item.name}
                    </span>

                    {/* Active Dot Indicator for Mobile (Optional, adds a nice touch if space is tight) */}
                    {isActive && (
                      <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-white sm:hidden opacity-80"></span>
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