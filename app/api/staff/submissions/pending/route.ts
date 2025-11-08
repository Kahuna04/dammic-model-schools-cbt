import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get submissions for exams created by this staff member that need grading
    const submissions = await prisma.submission.findMany({
      where: {
        exam: {
          createdById: session.user.id,
        },
        status: 'SUBMITTED', // Only get submitted but not graded submissions
      },
      include: {
        student: {
          select: {
            name: true,
            studentId: true,
            classLevel: true,
          },
        },
        exam: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
