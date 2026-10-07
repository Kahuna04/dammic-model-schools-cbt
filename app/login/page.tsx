'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CAROUSEL_SLIDES = [
  {
    title: 'Computer-Based Examinations',
    subtitle: 'Stay ahead of your academic progress with real-time test evaluations.',
    icon: '🎓',
  },
  {
    title: 'Real-Time Performance Analytics',
    subtitle: 'Comprehensive score breakdowns and instant grade reports.',
    icon: '📊',
  },
  {
    title: 'Class Promotion & Alumni Archive',
    subtitle: 'Seamless end-of-year student progression and directory management.',
    icon: '🚀',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [emailOrAdmission, setEmailOrAdmission] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance carousel slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: emailOrAdmission,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email/admission number or password');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const currentSlide = CAROUSEL_SLIDES[activeSlide];

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
      {/* Left Panel - School Green Hero with Circular Gold Ring Emblem (Matching Inspiration Image) */}
      <div className="hidden lg:flex flex-col justify-between p-8 xl:p-12 relative overflow-hidden bg-[#4B5320] text-white select-none h-full">
        {/* Decorative background ambient glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-[#4B5320] flex items-center justify-center font-bold text-xl shadow-lg">
            🎓
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Dammic Model Schools
          </span>
        </div>

        {/* Center Hero Golden Circular Ring Badge (No Rectangular Box) */}
        <div className="relative z-10 my-auto text-center max-w-md mx-auto flex flex-col items-center">
          <div className="w-44 h-44 xl:w-52 xl:h-52 rounded-full border-[7px] border-[#F59E0B] bg-[#3B4219]/30 flex items-center justify-center shadow-2xl mb-8 transform transition-transform duration-500 hover:scale-105">
            <span className="text-7xl xl:text-8xl drop-shadow-lg text-[#F59E0B]">
              {currentSlide.icon}
            </span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-extrabold text-white mb-3 tracking-tight">
            {currentSlide.title}
          </h2>
          <p className="text-emerald-100 text-xs xl:text-sm leading-relaxed max-w-xs">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Bottom Carousel Indicator Dots (Matching Inspiration Image) */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === idx
                  ? 'w-8 bg-white'
                  : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Clean Login Form Container */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 relative bg-slate-50 lg:bg-white h-full overflow-hidden">
        {/* Back to Home Link */}
        <div className="absolute top-6 right-6">
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#4B5320] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Login Form Card */}
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xl sm:shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#4B5320] tracking-tight mb-1">
              Welcome back.
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Please enter your login details below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Admission No */}
            <div>
              <label
                htmlFor="emailOrAdmission"
                className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider"
              >
                Email address or Admission Number
              </label>
              <input
                type="text"
                id="emailOrAdmission"
                value={emailOrAdmission}
                onChange={(e) => setEmailOrAdmission(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#F4F7F2] border border-transparent focus:border-[#4B5320] focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B5320]/20 text-xs sm:text-sm font-medium transition-all"
                placeholder="e.g. student@dammic.edu or DMS/2026/001"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-11 bg-[#F4F7F2] border border-transparent focus:border-[#4B5320] focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4B5320]/20 text-xs sm:text-sm font-medium transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12c1.374-4.97 6.175-8.5 11.964-8.5s10.59 3.53 11.964 8.5c-1.374 4.97-6.175 8.5-11.964 8.5S3.41 16.97 2.036 12z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => alert('Please contact school administration to reset your password.')}
                  className="text-xs font-semibold text-slate-500 hover:text-[#4B5320] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4B5320] hover:bg-[#3b4219] text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Proceed'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
