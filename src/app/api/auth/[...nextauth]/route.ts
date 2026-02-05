// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    avatar?: string | null;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      avatar?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    avatar?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            student: true,
            teacher: true,
          },
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        // Validate password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        // Check if account is active
        if (!user.isActive) {
          throw new Error("Account is deactivated")
        }

        // Validate role if provided
        if (credentials.role && credentials.role !== user.role) {
          throw new Error(`This account is registered as ${user.role.toLowerCase()}. Please select the correct role.`)
        }

        // ✅ IMPORTANT: Return the role from database
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // This must be "TEACHER" or "STUDENT" from DB
          avatar: user.avatar,
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role // ✅ Set role in JWT
        token.avatar = user.avatar
      }
      
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role // ✅ Set role in session
        session.user.avatar = token.avatar as string | null
      }
      
      console.log("📝 Session created:", {
        userId: session.user.id,
        role: session.user.role,
        email: session.user.email
      })
      
      return session
    },
    
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { student: true, teacher: true },
        })
        
        if (existingUser && !existingUser.student && !existingUser.teacher) {
          await prisma.student.create({
            data: {
              userId: existingUser.id,
            },
          })
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: "STUDENT" },
          })
        }
      }
      
      // ✅ Always return true to allow sign in
      return true
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }