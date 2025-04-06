import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    
    const token = authHeader.split("Bearer ")[1];
    
    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!db) {
      return NextResponse.json({ message: "Database connection not established" }, { status: 500 });
    }
    
    // Get user from database
    const existingUsers = await db.select().from(users).where(eq(users.firebaseUid, decodedToken.uid));
    const user = existingUsers[0];
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Authentication failed" },
      { status: 401 }
    );
  }
}