import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@dammicschools.com';
  const password = 'admin123';
  const name = 'Admin User';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Admin user already exists.');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the admin user
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created successfully:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
