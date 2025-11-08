import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        classLevel: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new user (student or staff)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, surname, email, admissionNumber, role, classLevel, permissions } = body;

    // Validate required fields
    if (!firstName || !surname || !role) {
      return NextResponse.json(
        { error: 'First name, surname, and role are required' },
        { status: 400 }
      );
    }

    // For students, require admission number and class
    if (role === 'STUDENT' && (!admissionNumber || !classLevel)) {
      return NextResponse.json(
        { error: 'Admission number and class are required for students' },
        { status: 400 }
      );
    }

    // For staff, require email
    if (role === 'STAFF' && !email) {
      return NextResponse.json(
        { error: 'Email is required for staff' },
        { status: 400 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Check if admission number already exists (for students)
    if (admissionNumber) {
      const existingAdmission = await prisma.user.findUnique({
        where: { studentId: admissionNumber },
      });

      if (existingAdmission) {
        return NextResponse.json(
          { error: 'Admission number already exists' },
          { status: 400 }
        );
      }
    }

    // Generate password: surname + first letter of firstname (lowercase)
    const password = `${surname}${firstName.charAt(0)}`.toLowerCase();
    const hashedPassword = await hash(password, 10);

    // Create full name
    const fullName = `${firstName} ${surname}`;

    // Prepare user data
    const userData: any = {
      name: fullName,
      password: hashedPassword,
      role,
    };

    if (email) userData.email = email;
    if (admissionNumber) userData.studentId = admissionNumber;
    if (classLevel) userData.classLevel = classLevel;
    if (permissions && role === 'STAFF') userData.permissions = permissions;

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        classLevel: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: `${role === 'STUDENT' ? 'Student' : 'Staff'} created successfully`,
      user,
      credentials: {
        username: role === 'STUDENT' ? admissionNumber : email,
        password: password,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
