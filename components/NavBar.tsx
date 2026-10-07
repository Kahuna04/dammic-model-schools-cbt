"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home", icon: "🏠" },
  { 
    href: "/about", 
    label: "About Us", 
    icon: "ℹ️",
    submenu: [
      { href: "/about", label: "Our Story", icon: "📖" },
      { href: "/academics", label: "Academics", icon: "📚" },
    ]
  },
  { href: "/admissions", label: "Admissions", icon: "📝" },
  { 
    href: "/gallery", 
    label: "Community", 
    icon: "👥",
    submenu: [
      { href: "/gallery", label: "Gallery", icon: "🖼️" },
      { href: "/news", label: "News", icon: "📰" },
      { href: "/calendar", label: "Calendar", icon: "📅" },
    ]
  },
  { href: "/contact", label: "Contact", icon: "📩" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const isLoginPage = pathname === '/login';

  const getDashboardHref = () => {
    if (session?.user.role === 'ADMIN') return '/dashboard/admin';
    if (session?.user.role === 'STAFF') return '/dashboard/staff';
    return '/dashboard/student';
  };

  return (
    <header className={`bg-gradient-to-r from-white via-brand-cream/50 to-white backdrop-blur border-b-2 border-brand-green/20 shadow-md sticky top-0 z-50 ${isLoginPage ? 'lg:hidden' : ''}`}>
      <div className="container-responsive flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-xl font-bold text-brand-dark hover:text-brand-green transition">
          <span className="text-xl sm:text-2xl">🎓</span>
          <span className="hidden sm:inline">Dammic Model Schools</span>
          <span className="sm:hidden">Dammic</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-4 xl:gap-6 text-sm font-medium ml-auto mr-4">
          {nav.map((n) => (
            <div 
              key={n.href} 
              className="relative group"
              onMouseEnter={() => 'submenu' in n && setOpenSubmenu(n.label)}
              onMouseLeave={() => setOpenSubmenu(null)}
            >
              <Link 
                href={n.href} 
                className="hover:text-brand-green hover:scale-105 transition-all flex items-center gap-1"
              >
                {n.label}
                {'submenu' in n && <span className="text-xs">▼</span>}
              </Link>
              
              {/* Dropdown Menu */}
              {'submenu' in n && openSubmenu === n.label && (
                <div className="absolute top-full left-0 mt-2 bg-white border-2 border-brand-green/20 rounded-lg shadow-xl min-w-[180px] py-2 animate-fade-in">
                  {n.submenu?.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-brand-cream transition text-brand-dark"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {status === 'authenticated' ? (
            <Link
              href={getDashboardHref()}
              className="bg-[#4B5320] text-white hover:bg-[#3b4219] transition-all text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>📊</span> Dashboard
            </Link>
          ) : !isLoginPage ? (
            <Link href="/login" className="btn-outline text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5">
              <span className="hidden xs:inline">🔐 </span>Login
            </Link>
          ) : null}

          <Link href="/admissions" className="btn-primary text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3">
            <span className="hidden xs:inline">📝 </span>Apply
          </Link>
          
          {/* Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-brand-cream transition"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-brand-dark transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-full bg-brand-dark transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-full bg-brand-dark transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <nav className="container-responsive pb-4 space-y-1">
          {nav.map((n) => (
            <div key={n.href}>
              <Link
                href={n.href}
                onClick={() => {
                  if (!('submenu' in n)) setIsOpen(false);
                  else setOpenSubmenu(openSubmenu === n.label ? null : n.label);
                }}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg hover:bg-brand-cream transition text-brand-dark font-medium"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{n.icon}</span>
                  {n.label}
                </div>
                {'submenu' in n && (
                  <span className={`text-xs transition-transform ${openSubmenu === n.label ? 'rotate-180' : ''}`}>▼</span>
                )}
              </Link>
              
              {/* Mobile Submenu */}
              {'submenu' in n && openSubmenu === n.label && (
                <div className="ml-8 mt-1 space-y-1">
                  {n.submenu?.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-brand-cream/50 transition text-brand-dark text-sm"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
