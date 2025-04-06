import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginWithGoogle, isLoading } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero section */}
      <div className="md:w-1/2 bg-primary-50 p-8 flex flex-col justify-center items-center">
        <div className="max-w-md text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-6">
            <div className="text-3xl text-primary-500 mr-2">
              <span role="img" aria-label="restaurant">🍽️</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-heading">Restaurant Notebook</h1>
          </div>
          
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-800 mb-4">
            Track, Share, and Discover Culinary Experiences
          </h2>
          
          <p className="text-neutral-600 mb-6">
            Create lists of restaurants you want to visit, log your experiences, share notes with friends,
            and get AI-powered suggestions for your next food adventure.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xl text-primary-500 mb-2">
                <span role="img" aria-label="list">📋</span>
              </div>
              <h3 className="font-medium text-neutral-800 mb-1">Organize Lists</h3>
              <p className="text-sm text-neutral-600">Create and organize your restaurant wish lists</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xl text-orange-500 mb-2">
                <span role="img" aria-label="calendar">📅</span>
              </div>
              <h3 className="font-medium text-neutral-800 mb-1">Log Visits</h3>
              <p className="text-sm text-neutral-600">Keep track of your dining experiences</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xl text-yellow-500 mb-2">
                <span role="img" aria-label="people">👥</span>
              </div>
              <h3 className="font-medium text-neutral-800 mb-1">Collaborate</h3>
              <p className="text-sm text-neutral-600">Share lists and notes with friends</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xl text-emerald-500 mb-2">
                <span role="img" aria-label="robot">🤖</span>
              </div>
              <h3 className="font-medium text-neutral-800 mb-1">AI Powered</h3>
              <p className="text-sm text-neutral-600">Get restaurant suggestions based on your taste</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth form */}
      <div className="md:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Restaurant Notebook</CardTitle>
            <CardDescription>
              Sign in with your Google account to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center">
            <Button 
              onClick={loginWithGoogle} 
              disabled={isLoading} 
              className="w-full mb-6 bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Signing in...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
            
            <p className="text-sm text-slate-500 text-center mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
