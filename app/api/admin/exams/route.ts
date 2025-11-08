import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        createdById: session.user.id,
        questions: {
          create: questions.map((q: any) => ({
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
