import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

/**
 * Helper function to ensure a session exists and has a user
 * For use in server components
 */
export function ensureAuth(session: Session | null): Session & { user: { id: string } } {
  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }
  return session as Session & { user: { id: string } };
}

/**
 * Helper function to ensure a session exists and has a user
 * For use in API routes
 */
export function ensureAuthApi(session: Session | null): Session & { user: { id: string } } {
  if (!session || !session.user || !session.user.id) {
    throw new NextResponse("Unauthorized", { status: 401 });
  }
  return session as Session & { user: { id: string } };
}