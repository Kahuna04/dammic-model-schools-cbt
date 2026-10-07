import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow ADMIN or STAFF with can_create_exam permission
    if (session.user.role === 'STAFF') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { permissions: true },
      });
      
      const permissions = user?.permissions as Record<string, any> | null;
      if (!permissions?.can_create_exam) {
        return NextResponse.json(
          { error: 'You do not have permission to view this exam' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Staff can only access their own exams
    const whereClause: Prisma.ExamWhereInput = { id: params.id };
    if (session.user.role === 'STAFF') {
      whereClause.createdById = session.user.id;
    }

    const exam = await prisma.exam.findFirst({
      where: whereClause,
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
