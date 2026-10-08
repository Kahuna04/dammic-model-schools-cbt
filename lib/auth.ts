import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { Role } from '@prisma/client';
import { StaffPermissions } from '@/types/permissions';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Try to find user by email first, then by studentId (admission number)
        let user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        // If not found by email, try studentId
        if (!user) {
          user = await prisma.user.findUnique({
            where: {
              studentId: credentials.email, // Using 'email' field as username/admission number
            },
          });
        }

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email || '',
          name: user.name,
          role: user.role,
          permissions: (user.permissions as StaffPermissions) || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          permissions: user.permissions || null,
        };
      }
      // Support session update trigger
      if (trigger === 'update' && session?.permissions) {
        token.permissions = session.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
          permissions: (token.permissions as StaffPermissions) || null,
        },
      };
    },
  },
};
