'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on login page and dashboard routes
  if (pathname === '/login' || pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="mt-12 sm:mt-14 md:mt-16 border-t-4 border-brand-green bg-gradient-to-br from-brand-dark via-brand-green to-brand-light text-white shadow-2xl">
      <div className="container-responsive py-8 sm:py-10 md:py-12 grid gap-6 sm:gap-7 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
            <span>🎓</span> Dammic Model Schools
          </h3>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-brand-cream italic font-semibold">“Solid and steady steps to greatness”</p>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/80">🎉 Founded: 17 Oct, 2005</p>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/80">✨ Proprietress: Pst. Mrs T. M. Ogundele</p>
        </div>
        <div>
          <h4 className="font-bold text-base sm:text-lg text-white">🏫 Campuses</h4>
          <ul className="mt-2 sm:mt-3 text-xs sm:text-sm space-y-2 sm:space-y-3 text-white/90">
            <li>
              <span className="font-semibold text-brand-cream">Main (Creche/Nursery/Primary):</span>
              <br />📍 9, Mojisola Badru, Orile-Iloye, Sango Otta, Ogun State, Nigeria
            </li>
            <li>
              <span className="font-semibold text-brand-cream">Secondary:</span>
              <br />📍 7, Ogundele Close, Orile-Iloye, Sango Otta, Ogun State, Nigeria
            </li>
          </ul>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <h4 className="font-bold text-base sm:text-lg text-white">📩 Contact</h4>
          <ul className="mt-2 sm:mt-3 text-xs sm:text-sm space-y-2 text-white/90">
            <li>📞 08134897661, 08034730895</li>
            <li>✉️ <a href="mailto:dammicsch@gmail.com" className="underline hover:text-brand-cream transition break-all">dammicsch@gmail.com</a></li>
            <li>
              <Link className="inline-flex items-center gap-1 font-semibold underline hover:text-brand-cream transition" href="/contact">🗺️ Contact form & maps →</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs sm:text-sm text-white/70 pb-6 sm:pb-8 pt-4 sm:pt-6 border-t border-white/20">© {new Date().getFullYear()} Dammic Model Schools. All rights reserved.</div>
    </footer>
  );
}
