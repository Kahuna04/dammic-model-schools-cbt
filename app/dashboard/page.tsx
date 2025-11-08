import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case 'ADMIN':
      redirect('/dashboard/admin');
    case 'STAFF':
      redirect('/dashboard/staff');
    case 'STUDENT':
      redirect('/dashboard/student');
    default:
      redirect('/login');
  }
}
