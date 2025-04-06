import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ message: "No ID token provided" }, { status: 400 });
    }
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    
    if (!db) {
      return NextResponse.json({ message: "Database connection not established" }, { status: 500 });
    }
    
    // Check if user exists
    const existingUsers = await db.select().from(users).where(eq(users.firebaseUid, uid));
    let user = existingUsers[0];
    
    if (!user) {
      // Create new user
      const newUsers = await db.insert(users).values({
        firebaseUid: uid,
        email: email || `${uid}@example.com`,
        name: name || "Restaurant Enthusiast",
        username: email?.split('@')[0] || uid,
        avatar: picture,
        password: null, // Empty password since we're using Firebase auth
      }).returning();
      
      user = newUsers[0];
    }
    
    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Set the session cookie
    cookies().set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: expiresIn,
      path: "/",
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in Google auth:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Authentication failed" },
      { status: 500 }
    );
  }
}