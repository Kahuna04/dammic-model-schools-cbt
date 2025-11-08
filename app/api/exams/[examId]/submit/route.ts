import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examId } = await params;
    const body = await request.json();
    const { submissionId, answers } = body;

    // Verify submission belongs to user
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!submission || submission.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    if (submission.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Submission already finalized' },
        { status: 400 }
      );
    }

    // Save answers and calculate score
    let totalScore = 0;

    for (const [questionId, answer] of Object.entries(answers) as [string, string][]) {
      const question = submission.exam.questions.find((q) => q.id === questionId);
      if (!question) continue;

      let isCorrect: boolean | null = null;
      let marks: number | null = null;

      // Auto-grade multiple choice and true/false questions
      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        isCorrect = answer === question.correctAnswer;
        marks = isCorrect ? question.marks : 0;
        totalScore += marks;
      }
      // Essay questions need manual grading
      else if (question.type === 'ESSAY') {
        isCorrect = null;
        marks = null;
      }

      // Upsert answer
      await prisma.answer.upsert({
        where: {
          submissionId_questionId: {
            submissionId: submissionId,
            questionId: questionId,
          },
        },
        update: {
          answer,
          isCorrect,
          marks,
        },
        create: {
          submissionId,
          questionId,
          answer,
          isCorrect,
          marks,
        },
      });
    }

    // Calculate percentage and pass/fail
    const percentage = (totalScore / submission.exam.totalMarks) * 100;
    const passed = totalScore >= submission.exam.passingMarks;

    // Check if there are essay questions that need grading
    const hasEssayQuestions = submission.exam.questions.some(
      (q) => q.type === 'ESSAY'
    );

    // Update submission
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: hasEssayQuestions ? 'SUBMITTED' : 'GRADED',
        submittedAt: new Date(),
        totalScore: hasEssayQuestions ? null : totalScore,
        percentage: hasEssayQuestions ? null : percentage,
        passed: hasEssayQuestions ? null : passed,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
