import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeUser } from '@/lib/auth-guards';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const auth = await authorizeUser({
      allowedRoles: ['ADMIN', 'STAFF'],
      requiredPermission: 'can_create_exam',
    });
    if (auth.response) return auth.response;
    const sessionUser = auth.user;

    // Find the question with its exam to get the marks
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        exam: {
          select: {
            id: true,
            createdById: true,
            totalMarks: true,
            passingMarks: true,
            status: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Staff can only delete questions from exams they created (Object ownership check)
    if (sessionUser.role === 'STAFF' && question.exam.createdById !== sessionUser.id) {
      return NextResponse.json(
        { error: 'You can only delete questions from exams you created' },
        { status: 403 }
      );
    }

    // Check if exam has submissions
    const submissionCount = await prisma.submission.count({
      where: { examId: question.examId },
    });

    if (submissionCount > 0) {
      // Still allow deletion but warn that it may affect existing submissions
    }

    // Delete the question (cascade will delete all answers for this question)
    await prisma.question.delete({
      where: { id: params.id },
    });

    // Recalculate total marks for the exam
    const remainingQuestions = await prisma.question.findMany({
      where: { examId: question.examId },
      select: { marks: true },
    });

    const newTotalMarks = remainingQuestions.reduce((sum: number, q: (typeof remainingQuestions)[number]) => sum + q.marks, 0);
    
    const oldTotalMarks = question.exam.totalMarks;
    const newPassingMarks = oldTotalMarks > 0 
      ? Math.ceil((question.exam.passingMarks / oldTotalMarks) * newTotalMarks)
      : question.exam.passingMarks;

    // Update exam with new total marks and passing marks
    await prisma.exam.update({
      where: { id: question.examId },
      data: {
        totalMarks: newTotalMarks,
        passingMarks: newPassingMarks > newTotalMarks ? newTotalMarks : newPassingMarks,
      },
    });

    // Reorder remaining questions to ensure sequential order
    const questionsToReorder = await prisma.question.findMany({
      where: { examId: question.examId },
      orderBy: { order: 'asc' },
    });

    // Update order for remaining questions
    await Promise.all(
      questionsToReorder.map((q: (typeof questionsToReorder)[number], index: number) =>
        prisma.question.update({
          where: { id: q.id },
          data: { order: index + 1 },
        })
      )
    );

    return NextResponse.json({
      message: 'Question deleted successfully',
      exam: {
        id: question.examId,
        newTotalMarks,
        newPassingMarks: newPassingMarks > newTotalMarks ? newTotalMarks : newPassingMarks,
      },
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
