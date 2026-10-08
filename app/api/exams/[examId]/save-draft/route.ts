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

    if (!submissionId || !answers) {
      return NextResponse.json({ error: 'Missing submissionId or answers' }, { status: 400 });
    }

    // Verify submission belongs to user and is IN_PROGRESS
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        exam: {
          select: { duration: true },
        },
      },
    });

    if (!submission || submission.studentId !== session.user.id || submission.examId !== examId) {
      return NextResponse.json({ error: 'Invalid submission session' }, { status: 400 });
    }

    if (submission.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Submission is no longer active' }, { status: 400 });
    }

    // Save draft answers in a transaction
    const updatePromises = Object.entries(answers as Record<string, string>).map(([questionId, answer]) => {
      if (!answer) return null;
      return prisma.answer.upsert({
        where: {
          submissionId_questionId: {
            submissionId,
            questionId,
          },
        },
        update: { answer },
        create: {
          submissionId,
          questionId,
          answer,
        },
      });
    }).filter(Boolean);

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error saving exam draft:', error);
    return NextResponse.json({ error: 'Failed to save progress draft' }, { status: 500 });
  }
}
