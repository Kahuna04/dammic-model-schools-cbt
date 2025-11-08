import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import mammoth from 'mammoth';

/**
 * Expected Word document format:
 * 
 * 1. [Question text]
 * A. [Option A]
 * B. [Option B]
 * C. [Option C]*
 * D. [Option D]
 * 
 * 2. [Question text]
 * A. [Option A]*
 * B. [Option B]
 * C. [Option C]
 * D. [Option D]
 * 
 * Note: The correct answer is marked with an asterisk (*)
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const examTitle = formData.get('examTitle') as string;
    const examDescription = formData.get('examDescription') as string;
    const totalQuestions = parseInt(formData.get('totalQuestions') as string);
    const marksPerQuestion = parseInt(formData.get('marksPerQuestion') as string);
    const duration = parseInt(formData.get('duration') as string); // in minutes
    const passingPercentage = parseInt(formData.get('passingPercentage') as string) || 50;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!examTitle || !totalQuestions || !marksPerQuestion || !duration) {
      return NextResponse.json(
        { error: 'Exam title, total questions, marks per question, and duration are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from Word document
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    // Parse questions
    const questions = parseQuestions(text, marksPerQuestion);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found in document' },
        { status: 400 }
      );
    }

    if (questions.length > totalQuestions) {
      return NextResponse.json(
        { error: `Document contains ${questions.length} questions but you specified ${totalQuestions}` },
        { status: 400 }
      );
    }

    // Calculate total marks and passing marks
    const totalMarks = totalQuestions * marksPerQuestion;
    const passingMarks = Math.ceil((totalMarks * passingPercentage) / 100);

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title: examTitle,
        description: examDescription || '',
        duration,
        totalMarks,
        passingMarks,
        status: 'DRAFT',
        createdById: session.user.id,
      },
    });

    // Create questions in database
    const createdQuestions = await Promise.all(
      questions.map((q, index) =>
        prisma.question.create({
          data: {
            examId: exam.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            order: index + 1,
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully created exam with ${createdQuestions.length} questions`,
      exam: {
        id: exam.id,
        title: exam.title,
        totalQuestions: createdQuestions.length,
        totalMarks,
        passingMarks,
        duration,
      },
    });
  } catch (error) {
    console.error('Error uploading questions:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function parseQuestions(text: string, marksPerQuestion: number): any[] {
  const questions: any[] = [];
  
  // Split by question numbers (1., 2., 3., etc.)
  const lines = text.split('\n').map(line => line.trim());
  
  let currentQuestion: any = null;
  let currentOptions: string[] = [];
  let correctAnswerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line) continue;

    // Check if line starts with a number (new question)
    const questionMatch = line.match(/^(\d+)[\.\)]\s+(.+)/);
    
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length > 0) {
        currentQuestion.options = currentOptions;
        if (correctAnswerIndex >= 0 && correctAnswerIndex < currentOptions.length) {
          currentQuestion.correctAnswer = currentOptions[correctAnswerIndex];
        }
        questions.push(currentQuestion);
      }

      // Start new question
      const questionText = questionMatch[2].replace(/\*$/, '').trim();
      currentQuestion = {
        type: 'MULTIPLE_CHOICE',
        question: questionText,
        marks: marksPerQuestion,
      };
      currentOptions = [];
      correctAnswerIndex = -1;
    }
    // Check for options (A., B., C., D. or A), B), C), D))
    else if (/^[A-D][\.\)]\s+/i.test(line)) {
      const hasAsterisk = line.includes('*');
      const optionText = line.replace(/^[A-D][\.\)]\s+/i, '').replace(/\*+/g, '').trim();
      
      if (hasAsterisk) {
        correctAnswerIndex = currentOptions.length;
      }
      
      currentOptions.push(optionText);
    }
  }

  // Don't forget the last question
  if (currentQuestion && currentOptions.length > 0) {
    currentQuestion.options = currentOptions;
    if (correctAnswerIndex >= 0 && correctAnswerIndex < currentOptions.length) {
      currentQuestion.correctAnswer = currentOptions[correctAnswerIndex];
    }
    questions.push(currentQuestion);
  }

  return questions;
}
