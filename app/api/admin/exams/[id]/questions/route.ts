import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE all questions from an exam
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN or STAFF with exam creation permission
    if (session.user.role === 'STAFF') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { permissions: true },
      });
      
      const permissions = user?.permissions as any;
      if (!permissions?.can_create_exam) {
        return NextResponse.json(
          { error: 'You do not have permission to delete questions' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Staff can only delete questions from exams they created
    if (session.user.role === 'STAFF' && exam.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete questions from exams you created' },
        { status: 403 }
      );
    }

    // Check if exam has submissions - warn that this will affect them
    if (exam._count.submissions > 0) {
      // Still allow deletion but note that it will affect existing submissions
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

