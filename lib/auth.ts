import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export async function requireAuth() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

export async function requireAdmin() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return session;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Email hoặc mật khẩu không chính xác");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Email hoặc mật khẩu không chính xác");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
    async redirect({ url, baseUrl }) {
      // Luôn chuyển hướng về trang đăng nhập sau khi đăng xuất thành công
      if (url.includes('/api/auth/signout')) {
        return `${baseUrl}/login`;
      }
      // Mặc định, chuyển hướng đến url nếu nó thuộc cùng origin
      if (url.startsWith(baseUrl)) return url;
      // Nếu không, chuyển hướng về baseUrl
      return baseUrl;
    },
  },
}; 