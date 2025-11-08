import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

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

    // Fetch exam with submissions
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        submissions: {
          include: {
            student: {
              select: {
                name: true,
                studentId: true,
                classLevel: true,
                email: true,
              },
            },
          },
          where: {
            status: {
              in: ['SUBMITTED', 'GRADED'],
            },
          },
          orderBy: [
            { student: { classLevel: 'asc' } },
            { student: { name: 'asc' } },
          ],
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Prepare export data
    const exportData = exam.submissions.map(submission => ({
      'Name': submission.student.name,
      'Admission Number': submission.student.studentId || '-',
      'Class': submission.student.classLevel || '-',
      'Email': submission.student.email || '-',
      'Status': submission.status,
      'Score': submission.totalScore !== null ? submission.totalScore : 'Not Graded',
      'Total Marks': exam.totalMarks,
      'Percentage': submission.percentage !== null ? `${submission.percentage.toFixed(2)}%` : '-',
      'Passed': submission.passed !== null ? (submission.passed ? 'Yes' : 'No') : '-',
      'Submitted At': submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-',
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Add summary sheet
    const passed = exam.submissions.filter(s => s.passed === true).length;
    const failed = exam.submissions.filter(s => s.passed === false).length;
    const notGraded = exam.submissions.filter(s => s.passed === null).length;
    
    const summaryData = [
      { 'Metric': 'Exam Title', 'Value': exam.title },
      { 'Metric': 'Total Marks', 'Value': exam.totalMarks },
      { 'Metric': 'Passing Marks', 'Value': exam.passingMarks },
      { 'Metric': 'Duration (minutes)', 'Value': exam.duration },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Total Submissions', 'Value': exam.submissions.length },
      { 'Metric': 'Passed', 'Value': passed },
      { 'Metric': 'Failed', 'Value': failed },
      { 'Metric': 'Not Graded', 'Value': notGraded },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as file download
    const filename = `exam_results_${exam.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
