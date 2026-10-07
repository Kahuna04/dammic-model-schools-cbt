import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ClassLevel, Prisma } from '@prisma/client';
import { PROMOTION_MAP } from '@/lib/promotion';

interface PromotionDecision {
  studentId: string;
  action: 'PROMOTE' | 'REPEAT';
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentIds, studentPromotions, targetClass } = body;

    // Build array of decisions
    let decisions: PromotionDecision[] = [];

    if (Array.isArray(studentPromotions) && studentPromotions.length > 0) {
      decisions = studentPromotions;
    } else if (Array.isArray(studentIds) && studentIds.length > 0) {
      decisions = studentIds.map((id: string) => ({ studentId: id, action: 'PROMOTE' }));
    } else {
      return NextResponse.json({ error: 'No student decisions provided for promotion' }, { status: 400 });
    }

    const targetStudentIds = decisions.map((d) => d.studentId);

    // Fetch students
    const students = await prisma.user.findMany({
      where: {
        id: { in: targetStudentIds },
        role: 'STUDENT',
      },
      select: {
        id: true,
        name: true,
        classLevel: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'No valid student records found' }, { status: 404 });
    }

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const updates: Prisma.PrismaPromise<any>[] = [];
    let promotedCount = 0;
    let repeatedCount = 0;

    for (const decision of decisions) {
      const student = studentMap.get(decision.studentId);
      if (!student || !student.classLevel) continue;

      if (decision.action === 'REPEAT') {
        // Student stays in current class level
        repeatedCount++;
        continue;
      }

      // Default action is PROMOTE
      const currentClass = student.classLevel;
      const nextClass = targetClass || PROMOTION_MAP[currentClass];

      if (!nextClass) continue;

      updates.push(
        prisma.user.update({
          where: { id: student.id },
          data: {
            classLevel: nextClass as ClassLevel,
          },
        })
      );
      promotedCount++;
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({
      success: true,
      promotedCount,
      repeatedCount,
      message: `Promotion completed: ${promotedCount} student(s) promoted, ${repeatedCount} student(s) repeated class.`,
    });
  } catch (error) {
    console.error('Failed to promote students:', error);
    return NextResponse.json({ error: 'Failed to process student promotion' }, { status: 500 });
  }
}
