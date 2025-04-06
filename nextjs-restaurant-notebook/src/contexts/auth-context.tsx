"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { User } from "@/lib/db/schema";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user data from our API
  const fetchUser = async (idToken: string) => {
    try {
      const response = await axios.get("/api/user", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      setUser(response.data);
    } catch (err) {
      console.error("Error fetching user:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in, get the ID token
        const idToken = await user.getIdToken();
        // Set the token in sessionStorage for API requests
        sessionStorage.setItem("firebaseIdToken", idToken);
        // Fetch the user from our API
        await fetchUser(idToken);
      } else {
        // User is signed out
        sessionStorage.removeItem("firebaseIdToken");
        setUser(null);
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      // 1. Sign in with Firebase using a new Google provider
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 2. Get the ID token
      const idToken = await result.user.getIdToken();
      
      // 3. Send token to our backend to create or get the user
      const response = await axios.post("/api/auth/google", { idToken });
      setUser(response.data);

      toast.success("Logged in successfully", {
        description: "Welcome to Restaurant Notebook!",
      });
      
      // 4. Redirect to home page
      router.push("/");
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setError(err instanceof Error ? err : new Error("Failed to login"));
      toast.error("Login failed", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      toast.success("Logged out successfully", {
        description: "You have been logged out of your account.",
      });
      router.push("/auth");
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err instanceof Error ? err : new Error("Failed to logout"));
      toast.error("Logout failed", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}