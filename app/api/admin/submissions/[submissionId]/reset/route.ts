import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        exam: true,
        student: {
          select: {
            name: true,
            studentId: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Delete the submission (cascade will delete all answers)
    await prisma.submission.delete({
      where: { id: params.submissionId },
    });

    return NextResponse.json({
      message: `Successfully reset exam submission for ${submission.student.name}`,
      student: {
        name: submission.student.name,
        studentId: submission.student.studentId,
      },
      exam: {
        id: submission.exam.id,
        title: submission.exam.title,
      },
    });
  } catch (error) {
    console.error('Error resetting submission:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

