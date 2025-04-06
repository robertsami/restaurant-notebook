import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { User } from "@/lib/db/schema";
import { redirect } from "next/navigation";

export async function getServerUser(): Promise<User | null> {
  try {
    const sessionCookie = cookies().get("session")?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    if (!db) {
      console.error("Database connection not established");
      return null;
    }
    
    // Get user from database
    const existingUsers = await db.select().from(users).where(eq(users.firebaseUid, decodedClaims.uid));
    const user = existingUsers[0];
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Error getting server user:", error);
    return null;
  }
}

export async function requireUser() {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/auth");
  }
  
  return user;
}