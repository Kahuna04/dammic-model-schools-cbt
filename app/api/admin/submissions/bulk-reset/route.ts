import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionIds } = body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Submission IDs array is required' },
        { status: 400 }
      );
    }

    // Verify all submissions exist and get their details
    const submissions = await prisma.submission.findMany({
      where: {
        id: { in: submissionIds },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
        student: {
          select: {
            name: true,
            studentId: true,
          },
        },
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: 'No valid submissions found' },
        { status: 404 }
      );
    }

    if (submissions.length !== submissionIds.length) {
      return NextResponse.json(
        { error: 'Some submission IDs were not found' },
        { status: 400 }
      );
    }

    // Delete all submissions (cascade will delete all answers)
    await prisma.submission.deleteMany({
      where: {
        id: { in: submissionIds },
      },
    });

    return NextResponse.json({
      message: `Successfully reset ${submissions.length} exam submission(s)`,
      count: submissions.length,
      submissions: submissions.map((s) => ({
        id: s.id,
        student: {
          name: s.student.name,
          studentId: s.student.studentId,
        },
        exam: {
          id: s.exam.id,
          title: s.exam.title,
        },
      })),
    });
  } catch (error) {
    console.error('Error bulk resetting submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

