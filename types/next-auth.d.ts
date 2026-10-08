import { Role } from '@prisma/client';
import { StaffPermissions } from './permissions';
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    permissions?: StaffPermissions | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    permissions?: StaffPermissions | null;
  }
}
