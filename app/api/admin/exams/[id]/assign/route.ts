import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Assign exam to classes and update settings
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignedTo, status, startTime, endTime } = body;

    const updateData: any = {};

    if (assignedTo !== undefined) {
      // assignedTo should be an array of class levels like ["JSS1", "JSS2"]
      updateData.assignedTo = assignedTo;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (startTime !== undefined) {
      updateData.startTime = startTime ? new Date(startTime) : null;
    }

    if (endTime !== undefined) {
      updateData.endTime = endTime ? new Date(endTime) : null;
    }

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Exam updated successfully',
      exam,
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get exam assignment details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        status: true,
        assignedTo: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
