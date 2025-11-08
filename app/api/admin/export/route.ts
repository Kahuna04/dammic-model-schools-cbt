import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classLevel = searchParams.get('class');

    // Fetch students
    const where: any = { role: 'STUDENT' };
    if (classLevel && classLevel !== 'ALL') {
      where.classLevel = classLevel;
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        name: true,
        email: true,
        studentId: true,
        classLevel: true,
        createdAt: true,
      },
      orderBy: [
        { classLevel: 'asc' },
        { name: 'asc' }
      ],
    });

    // Since we can't retrieve plain passwords from hashed ones,
    // we'll note in the export that passwords follow the pattern: surname + first initial
    const exportData = students.map(student => {
      const nameParts = student.name.split(' ');
      const surname = nameParts[nameParts.length - 1];
      const firstName = nameParts[0];
      const generatedPassword = `${surname}${firstName.charAt(0)}`.toLowerCase();

      return {
        'Name': student.name,
        'Admission Number': student.studentId || '',
        'Class': student.classLevel || '',
        'Email': student.email || '',
        'Username': student.studentId || '',
        'Password': generatedPassword,
        'Joined': new Date(student.createdAt).toLocaleDateString(),
      };
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as file download
    const filename = classLevel && classLevel !== 'ALL' 
      ? `students_${classLevel}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `students_all_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
