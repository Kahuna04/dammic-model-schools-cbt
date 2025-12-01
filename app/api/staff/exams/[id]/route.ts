import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get exam with questions, but only if created by this staff member
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        createdById: session.user.id, // Only allow access to own exams
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { name: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
  }
}

