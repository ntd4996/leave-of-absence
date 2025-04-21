import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const nextAuthOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.password) {
          return null;
        }

        console.log("🚀 ~ authorize ~ credentials:", credentials);
        console.log("🚀 ~ authorize ~ user:", user);

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
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
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
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

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
