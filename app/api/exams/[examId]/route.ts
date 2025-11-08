import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            marks: true,
            order: true,
            // Don't include correctAnswer for students
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check if exam is available
    if (exam.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Exam not available' }, { status: 403 });
    }

    // Check time restrictions
    if (exam.startTime && new Date() < exam.startTime) {
      return NextResponse.json({ error: 'Exam not started yet' }, { status: 403 });
    }

    if (exam.endTime && new Date() > exam.endTime) {
      return NextResponse.json({ error: 'Exam has ended' }, { status: 403 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
