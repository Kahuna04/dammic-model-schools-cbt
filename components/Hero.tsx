import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  // Placeholder images - replace with actual student photos later
  const studentPhotos = [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=600",
    "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=600",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=600",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=600",
    "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=400&h=600",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600",
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-brand-dark shadow-2xl animate-fade-in">
      {/* Scrolling Student Photos Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 flex gap-6 animate-scroll-rtl">
          {[...studentPhotos, ...studentPhotos].map((photo, i) => (
            <div key={i} className="relative flex-shrink-0 w-64 md:w-80 h-full">
              <Image
                src={photo}
                alt=""
                fill
                className="object-cover brightness-75"
                sizes="320px"
                priority={i < 3}
              />
            </div>
          ))}
        </div>
        {/* Gradient overlay - lighter for more image visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/80 via-brand-green/60 to-brand-dark/80"></div>
      </div>
      
      {/* Content wrapper with backdrop blur */}
      <div className="relative p-6 sm:p-8 md:p-12 lg:p-16 backdrop-blur-sm">
      <div className="relative max-w-3xl">
        <div className="inline-block mb-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur rounded-full">
          <p className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">🏫 Dammic Model Schools</p>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-lg">
          Solid and steady steps to <span className="text-brand-cream">greatness</span>
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-light">
          Creche · Nursery · Primary · Secondary<br/>
          <span className="text-brand-cream font-semibold">Nurturing excellence since 2005</span>
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <Link href="/admissions" className="btn-primary bg-white text-brand-green hover:bg-brand-cream text-center">📝 Start Admissions</Link>
          <Link href="/about" className="btn-outline border-white text-white hover:bg-white hover:text-brand-green text-center">Learn More →</Link>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 sm:h-72 sm:w-72 md:h-96 md:w-96 rounded-full bg-brand-cream/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 sm:h-64 sm:w-64 md:h-80 md:w-80 rounded-full bg-white/10 blur-2xl" />
      </div>
    </section>
  );
}
