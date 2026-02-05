import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

// Auth helper functions
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth(allowedRoles?: string[]) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized")
  }
  
  return session.user
}


