import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

/**
 * Helper function to ensure a session exists and has a user
 * For use in server components
 */
export function ensureAuth(session: Session | null): Session {
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }
  return session;
}

/**
 * Helper function to ensure a session exists and has a user
 * For use in API routes
 */
export function ensureAuthApi(session: Session | null): Session {
  if (!session || !session.user) {
    throw new NextResponse("Unauthorized", { status: 401 });
  }
  return session;
}