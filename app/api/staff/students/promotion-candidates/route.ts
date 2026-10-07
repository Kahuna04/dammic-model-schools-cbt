import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClassLevel } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classLevel = searchParams.get('class') as ClassLevel | null;

    if (!classLevel) {
      return NextResponse.json({ error: 'Class level parameter is required' }, { status: 400 });
    }

    // Fetch students in specified class level along with their submission scores
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        classLevel: classLevel,
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        classLevel: true,
        submissions: {
          where: {
            status: { in: ['SUBMITTED', 'GRADED'] },
          },
          select: {
            percentage: true,
            passed: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format response with computed stats
    const formattedStudents = students.map((student) => {
      const validSubmissions = student.submissions.filter((s) => s.percentage !== null);
      const totalExams = validSubmissions.length;
      const passedCount = validSubmissions.filter((s) => s.passed === true).length;
      const totalScoreSum = validSubmissions.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      const avgPercentage = totalExams > 0 ? Math.round(totalScoreSum / totalExams) : null;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        classLevel: student.classLevel,
        stats: {
          totalExams,
          passedCount,
          avgPercentage,
          isRecommended: avgPercentage === null || avgPercentage >= 40, // Recommended for promotion if avg >= 40 or no exams yet
        },
      };
    });

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching promotion candidates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
