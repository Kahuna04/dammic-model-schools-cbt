import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const alumni = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        classLevel: 'GRADUATED',
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        classLevel: true,
        updatedAt: true, // Date when student moved to GRADUATED
        createdAt: true,
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
      orderBy: { updatedAt: 'desc' },
    });

    const formattedAlumni = alumni.map((student: (typeof alumni)[number]) => {
      const validSubmissions = student.submissions.filter((s: (typeof student.submissions)[number]) => s.percentage !== null);
      const totalExams = validSubmissions.length;
      const passedCount = validSubmissions.filter((s: (typeof student.submissions)[number]) => s.passed === true).length;
      const totalScoreSum = validSubmissions.reduce((acc: number, curr: (typeof student.submissions)[number]) => acc + (curr.percentage || 0), 0);
      const avgPercentage = totalExams > 0 ? Math.round(totalScoreSum / totalExams) : null;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        graduationDate: student.updatedAt,
        stats: {
          totalExams,
          passedCount,
          avgPercentage,
        },
      };
    });

    return NextResponse.json(formattedAlumni);
  } catch (error) {
    console.error('Error fetching graduated alumni:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
