import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grades } = await request.json();

    // Get submission with all answers
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update essay question marks
    for (const [answerId, marks] of Object.entries(grades)) {
      await prisma.answer.update({
        where: { id: answerId },
        data: { marks: marks as number },
      });
    }

    // Calculate total score
    let totalScore = 0;
    for (const answer of submission.answers) {
      if (answer.question.type === 'ESSAY') {
        totalScore += (grades[answer.id] as number) || 0;
      } else {
        totalScore += answer.marks || 0;
      }
    }

    // Calculate percentage
    const percentage = (totalScore / submission.exam.totalMarks) * 100;
    const passed = totalScore >= submission.exam.passingMarks;

    // Update submission with final scores
    await prisma.submission.update({
      where: { id: params.submissionId },
      data: {
        totalScore,
        percentage,
        passed,
        status: 'GRADED',
      },
    });

    return NextResponse.json({
      success: true,
      totalScore,
      percentage,
      passed,
    });
  } catch (error) {
    console.error('Error saving grades:', error);
    return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
  }
}
