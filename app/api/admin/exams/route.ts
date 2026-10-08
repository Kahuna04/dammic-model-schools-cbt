import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeUser } from '@/lib/auth-guards';

interface QuestionInput {
  type: string;
  question: string;
  options: any;
  correctAnswer: string;
  marks: number;
  order: number;
}

export async function GET() {
  try {
    const auth = await authorizeUser({ allowedRoles: ['ADMIN', 'STAFF'] });
    if (auth.response) return auth.response;

    const exams = await prisma.exam.findMany({
      include: {
        createdBy: {
          select: { name: true },
        },
        _count: {
          select: { questions: true, submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeUser({
      allowedRoles: ['ADMIN', 'STAFF'],
      requiredPermission: 'can_create_exam',
    });
    if (auth.response) return auth.response;
    const sessionUser = auth.user;

    const body = await request.json();
    const {
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      status,
      startTime,
      endTime,
      questions,
    } = body;

    // Create exam with questions
    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        duration,
        totalMarks,
        passingMarks,
        status,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        createdById: sessionUser.id,
        questions: {
          create: (questions || []).map((q: QuestionInput) => ({
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            order: q.order,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
