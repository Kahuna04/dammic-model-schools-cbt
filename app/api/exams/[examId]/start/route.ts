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

    // Check if student already has a submission
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        examId_studentId: {
          examId: examId,
          studentId: session.user.id,
        },
      },
      include: {
        answers: true,
      },
    });

    if (existingSubmission) {
      // If already submitted, don't allow restart
      if (existingSubmission.status === 'SUBMITTED' || existingSubmission.status === 'GRADED') {
        return NextResponse.json(
          { error: 'Exam already submitted' },
          { status: 400 }
        );
      }
      
      // Resume existing submission
      return NextResponse.json(existingSubmission);
    }

    // Create new submission
    const submission = await prisma.submission.create({
      data: {
        examId: examId,
        studentId: session.user.id,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error starting exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
