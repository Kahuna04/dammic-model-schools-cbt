import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeUser } from '@/lib/auth-guards';

// DELETE all questions from an exam
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

    // Find the exam
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        totalMarks: true,
        passingMarks: true,
        status: true,
        _count: {
          select: { questions: true, submissions: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Staff can only delete questions from exams they created (Object ownership check)
    if (sessionUser.role === 'STAFF' && exam.createdById !== sessionUser.id) {
      return NextResponse.json(
        { error: 'You can only delete questions from exams you created' },
        { status: 403 }
      );
    }

    // Delete all questions (cascade will delete all answers)
    const deleteResult = await prisma.question.deleteMany({
      where: { examId: params.id },
    });

    // Update exam with zero marks
    await prisma.exam.update({
      where: { id: params.id },
      data: {
        totalMarks: 0,
        passingMarks: 0,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.count} question(s) from exam`,
      deletedCount: deleteResult.count,
      exam: {
        id: exam.id,
        newTotalMarks: 0,
        newPassingMarks: 0,
      },
    });
  } catch (error) {
    console.error('Error deleting all questions:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
