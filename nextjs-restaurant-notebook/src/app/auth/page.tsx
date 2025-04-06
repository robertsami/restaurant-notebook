"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

export default function AuthPage() {
  const { loginWithGoogle, isLoading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Restaurant Notebook Logo" 
              width={80} 
              height={80}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Restaurant Notebook</CardTitle>
          <CardDescription>
            Sign in to track your restaurant visits and share recommendations with friends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={loginWithGoogle}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-neutral-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
}