'use client';

import React from 'react';

interface ExamSubmitModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExamSubmitModal({
  isOpen,
  totalQuestions,
  answeredCount,
  flaggedCount,
  isSubmitting,
  onConfirm,
  onCancel,
}: ExamSubmitModalProps) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#4B5320]/10 text-[#4B5320] flex items-center justify-center text-3xl mx-auto font-bold">
            📝
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">Submit Exam?</h3>
          <p className="text-xs text-gray-500">
            Please review your completion breakdown before confirming submission.
          </p>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs">
          <div>
            <span className="text-gray-400 font-semibold uppercase block text-[10px]">Answered</span>
            <span className="text-base font-extrabold text-emerald-700">{answeredCount}</span>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase block text-[10px]">Flagged</span>
            <span className="text-base font-extrabold text-purple-700">{flaggedCount}</span>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase block text-[10px]">Unanswered</span>
            <span className="text-base font-extrabold text-amber-700">{unansweredCount}</span>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            ⚠️ You still have <strong>{unansweredCount}</strong> unanswered question(s). You will not be able to change your answers after submitting.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Return to Exam
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#4B5320] hover:bg-[#3d4419] rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Yes, Submit Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
