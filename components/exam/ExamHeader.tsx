'use client';

import React from 'react';

interface ExamHeaderProps {
  title: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  timeRemaining: number;
  isSaved?: boolean;
}

export function ExamHeader({
  title,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  timeRemaining,
  isSaved = true,
}: ExamHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Color dynamics for timer
  const getTimerBadgeStyle = (seconds: number) => {
    if (seconds <= 180) {
      return 'bg-red-600 text-white animate-pulse border-red-400 shadow-red-200';
    }
    if (seconds <= 600) {
      return 'bg-amber-500 text-white border-amber-400 shadow-amber-200';
    }
    return 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-200';
  };

  const progressPercent = Math.round((answeredCount / totalQuestions) * 100) || 0;

  return (
    <header className="sticky top-0 z-40 bg-[#4B5320] text-white shadow-md border-b border-[#3b4119] backdrop-blur-md bg-[#4B5320]/95">
      <div className="container mx-auto px-4 py-3 max-w-5xl">
        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* Title & Question Index */}
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight line-clamp-1">{title}</h1>
            <div className="flex items-center gap-3 text-xs opacity-90">
              <span>
                Question <strong className="text-white font-bold">{currentQuestionIndex + 1}</strong> of{' '}
                <strong className="text-white font-bold">{totalQuestions}</strong>
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <span>{isSaved ? '✓ Saved' : '💾 Saving...'}</span>
              </span>
            </div>
          </div>

          {/* Progress & Countdown Timer */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {/* Progress Pill */}
            <div className="hidden sm:flex flex-col items-end gap-1 text-xs">
              <span className="font-semibold text-white/90">
                {answeredCount} of {totalQuestions} Answered ({progressPercent}%)
              </span>
              <div className="w-32 bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Countdown Badge */}
            <div
              className={`px-3.5 py-1.5 rounded-xl border font-mono font-bold shadow-md flex items-center gap-2 ${getTimerBadgeStyle(
                timeRemaining
              )}`}
            >
              <span className="text-sm">⏱️</span>
              <span className="text-base sm:text-lg tracking-wider">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
