import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { Role } from '@prisma/client';
import { StaffPermissions } from '@/types/permissions';

export interface AuthGuardOptions {
  allowedRoles?: Role[];
  requiredPermission?: keyof StaffPermissions;
}

export type AuthResult =
  | { user: { id: string; email: string; name: string; role: Role; permissions?: StaffPermissions | null }; response?: undefined }
  | { user?: undefined; response: NextResponse };

/**
 * Centralized server-side authorization guard for Next.js API Routes.
 * Enforces authentication, role-based access control, and granular staff permissions.
 */
export async function authorizeUser(
  options: AuthGuardOptions = {}
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
    };
  }

  const { role, permissions } = session.user;

  // If specific roles are required
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    if (!options.allowedRoles.includes(role)) {
      return {
        response: NextResponse.json({ error: 'Forbidden: Insufficient role privileges' }, { status: 403 }),
      };
    }
  }

  // If staff permission is required (ADMIN bypasses granular staff permission checks)
  if (options.requiredPermission && role === 'STAFF') {
    const hasPerm = permissions?.[options.requiredPermission];
    if (!hasPerm) {
      return {
        response: NextResponse.json(
          { error: `Forbidden: Missing required permission '${options.requiredPermission}'` },
          { status: 403 }
        ),
      };
    }
  }

  return { user: session.user };
}
