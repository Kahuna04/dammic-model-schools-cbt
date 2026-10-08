import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeUser } from '@/lib/auth-guards';

export async function GET(
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

    // Staff can only access their own exams (Object ownership check)
    const whereClause: Record<string, any> = { id: params.id };
    if (sessionUser.role === 'STAFF') {
      whereClause.createdById = sessionUser.id;
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
