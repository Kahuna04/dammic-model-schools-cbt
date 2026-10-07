'use client';

import React from 'react';

export interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  marks: number;
  order: number;
}

interface ExamQuestionCardProps {
  question: Question;
  questionNumber: number;
  currentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
}

export function ExamQuestionCard({
  question,
  questionNumber,
  currentAnswer = '',
  onAnswerChange,
  isFlagged,
  onToggleFlag,
}: ExamQuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 sm:p-7 space-y-6">
      {/* Question Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-[#4B5320] text-white px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide">
            Question {questionNumber}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
            {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
          </span>
        </div>

        {/* Flag for Review Toggle Button */}
        <button
          type="button"
          onClick={onToggleFlag}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
            isFlagged
              ? 'bg-purple-600 text-white border-purple-700 shadow-purple-200'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <span>{isFlagged ? '🔖 Flagged for Review' : '🏳️ Flag for Review'}</span>
        </button>
      </div>

      {/* Question Text */}
      <div className="text-gray-900 font-semibold text-base sm:text-lg leading-relaxed">
        {question.question}
      </div>

      {/* Answer Options Container */}
      <div className="pt-2">
        {question.type === 'MULTIPLE_CHOICE' && question.options && (
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = currentAnswer === option;
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D...

              return (
                <label
                  key={idx}
                  onClick={() => onAnswerChange(option)}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#4B5320] bg-[#4B5320]/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={isSelected}
                    onChange={() => onAnswerChange(option)}
                    className="sr-only"
                  />
                  <div
                    className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#4B5320] text-white border-[#4B5320]'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {optionLetter}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-800 leading-snug">
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {question.type === 'TRUE_FALSE' && (
          <div className="grid grid-cols-2 gap-4">
            {['True', 'False'].map((option) => {
              const isSelected = currentAnswer === option;
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => onAnswerChange(option)}
                  className={`py-4 px-6 rounded-xl border-2 font-bold text-sm transition-all ${
                    isSelected
                      ? 'border-[#4B5320] bg-[#4B5320] text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'ESSAY' && (
          <div>
            <textarea
              value={currentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#4B5320] focus:ring-2 focus:ring-[#4B5320]/20 outline-none text-sm transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
