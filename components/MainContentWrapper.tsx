'use client';

import { usePathname } from 'next/navigation';

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On login page or dashboard, don't restrict container width or padding
  if (pathname === '/login' || pathname?.startsWith('/dashboard')) {
    return <main className="w-full h-full min-h-screen">{children}</main>;
  }

  return <main className="container-responsive py-4 sm:py-6 md:py-8">{children}</main>;
}
