import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { 
  User as FirebaseUser,
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

type AuthContextType = {
  user: SelectUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const {
    data: user,
    error,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    enabled: !!firebaseUser, // Only run this query if we have a Firebase user
  });
  
  // This mutation handles sending the Firebase token to our backend
  const authWithGoogleMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const res = await apiRequest("POST", "/api/auth/google", { idToken });
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Authenticated successfully",
        description: `Welcome, ${userData.name}!`,
      });
      
      // We don't need this redirection here since we're already redirecting in the loginWithGoogle function
      // But adding as a backup in case the component using this mutation directly
      if (window.location.pathname === '/auth') {
        window.location.href = '/';
      }
    },
    onError: (error: Error) => {
      console.error("Error authenticating with server:", error);
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in, get the ID token
        const idToken = await user.getIdToken();
        // Set the token in sessionStorage for API requests
        sessionStorage.setItem('firebaseIdToken', idToken);
        // Refetch the user from our API
        refetchUser();
        
        // If on the auth page, redirect to home
        if (window.location.pathname === '/auth') {
          window.location.href = '/';
        }
      } else {
        // User is signed out
        sessionStorage.removeItem('firebaseIdToken');
        queryClient.setQueryData(["/api/user"], null);
      }
      setInitializing(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [refetchUser]);

  const loginWithGoogle = async () => {
    try {
      // 1. Sign in with Firebase using a new Google provider
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 2. Get the ID token
      const idToken = await result.user.getIdToken();
      
      // 3. Send token to our backend to create or get the user
      await authWithGoogleMutation.mutateAsync(idToken);

      toast({
        title: "Logged in successfully",
        description: "Welcome to Restaurant Notebook!",
      });
      
      // 4. Redirect to home page (we'll use window.location since we're outside of React Router context)
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const isLoading = initializing || isUserLoading;
  
  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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
