import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  ListChecks, 
  MapPin, 
  Users, 
  LogOut,
  FileText
} from "lucide-react";
import { ListWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Fetch user lists for recent lists section
  const { data: lists } = useQuery<ListWithDetails[]>({
    queryKey: ["/api/lists"],
    staleTime: 60000, // 1 minute
  });

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-neutral-200">
      <div className="flex items-center h-16 px-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="text-2xl text-primary-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.58008 3C8.58008 3 10.5801 6.5 10.5801 9C10.5801 11.5 9.08008 13.5 6.58008 13.5C4.08008 13.5 2.58008 11.5 2.58008 9C2.58008 6.5 4.58008 3 4.58008 3M15.5801 3C15.5801 3 17.5801 6.5 17.5801 9C17.5801 11.5 16.0801 13.5 13.5801 13.5C11.0801 13.5 9.58008 11.5 9.58008 9C9.58008 6.5 11.5801 3 11.5801 3M3.58008 15C3.58008 15 3.58008 21 6.58008 21C9.58008 21 12.5801 21 15.5801 21C18.5801 21 18.5801 15 18.5801 15" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-heading font-bold text-lg">Restaurant Notebook</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/">
          <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
            <Home className={`mr-3 h-5 w-5 ${isActive("/") ? "text-primary-500" : "text-neutral-500"}`} />
            <span>Dashboard</span>
          </a>
        </Link>
        
        <Link href="/lists">
          <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/lists") || location.startsWith("/lists/") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
            <ListChecks className={`mr-3 h-5 w-5 ${isActive("/lists") || location.startsWith("/lists/") ? "text-primary-500" : "text-neutral-500"}`} />
            <span>My Lists</span>
          </a>
        </Link>
        
        <Link href="/restaurants">
          <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/restaurants") || location.startsWith("/restaurants/") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
            <MapPin className={`mr-3 h-5 w-5 ${isActive("/restaurants") || location.startsWith("/restaurants/") ? "text-primary-500" : "text-neutral-500"}`} />
            <span>Restaurants</span>
          </a>
        </Link>
        
        <Link href="/shared">
          <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/shared") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
            <Users className={`mr-3 h-5 w-5 ${isActive("/shared") ? "text-primary-500" : "text-neutral-500"}`} />
            <span>Shared with me</span>
          </a>
        </Link>
        
        <Link href="/ai-suggestions">
          <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/ai-suggestions") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
            <svg 
              className={`mr-3 h-5 w-5 ${isActive("/ai-suggestions") ? "text-primary-500" : "text-neutral-500"}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M18.36 5.64 16.95 7.05" />
              <path d="m5.64 18.36 1.41-1.41" />
              <path d="m5.64 5.64 1.41 1.41" />
              <path d="m18.36 18.36-1.41-1.41" />
              <circle cx="12" cy="12" r="5" />
            </svg>
            <span>AI Suggestions</span>
          </a>
        </Link>
        
        <div className="pt-4 mt-4 border-t border-neutral-200">
          <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Recent Lists
          </h3>
          <div className="mt-2 space-y-1">
            {lists?.slice(0, 3).map(list => (
              <Link key={list.id} href={`/lists/${list.id}`}>
                <a className="flex items-center px-3 py-2 text-sm rounded-lg font-medium text-neutral-600 hover:bg-neutral-100">
                  <FileText className="mr-3 h-4 w-4 text-neutral-500" />
                  <span className="truncate">{list.title}</span>
                </a>
              </Link>
            ))}
            
            {!lists || lists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-neutral-500">No lists created yet</p>
            ) : null}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-neutral-300">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-800">{user?.name}</p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
