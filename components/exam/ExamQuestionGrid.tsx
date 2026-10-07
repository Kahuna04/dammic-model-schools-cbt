'use client';

import React from 'react';
import { Question } from './ExamQuestionCard';

interface ExamQuestionGridProps {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: Set<string>;
  onSelectQuestion: (index: number) => void;
}

export function ExamQuestionGrid({
  questions,
  currentQuestionIndex,
  answers,
  flaggedQuestions,
  onSelectQuestion,
}: ExamQuestionGridProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">Question Navigator</h3>
        <span className="text-xs text-gray-500 font-medium">
          {Object.keys(answers).filter((k) => answers[k]?.trim()).length} / {questions.length} Answered
        </span>
      </div>

      {/* Grid Palette */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = Boolean(answers[q.id]?.trim());
          const isFlagged = flaggedQuestions.has(q.id);

          let buttonStyle = 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';

          if (isFlagged) {
            buttonStyle = 'bg-purple-600 text-white border-purple-700 shadow-purple-200 font-bold';
          } else if (isAnswered) {
            buttonStyle = 'bg-emerald-600 text-white border-emerald-700 font-bold';
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`relative h-10 rounded-xl font-medium text-xs transition-all border flex items-center justify-center ${buttonStyle} ${
                isCurrent ? 'ring-2 ring-offset-1 ring-[#4B5320] font-extrabold scale-105 z-10' : ''
              }`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <span className="absolute -top-1 -right-1 text-[10px]">🔖</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-4 text-[11px] text-gray-600 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-200" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-[#4B5320] bg-white" />
          <span>Current</span>
        </div>
      </div>
    </div>
  );
}
