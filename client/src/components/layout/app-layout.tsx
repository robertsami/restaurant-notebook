import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 lg:border-0">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center lg:hidden">
              <button 
                className="text-neutral-500 hover:text-neutral-700"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-3 lg:hidden">
                <h1 className="font-heading font-bold text-lg">Restaurant Notebook</h1>
              </div>
            </div>
            
            <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end">
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <Input 
                  type="text" 
                  className="pl-10 pr-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 placeholder-neutral-400" 
                  placeholder="Search restaurants or lists..." 
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="ml-2 text-neutral-500 hover:text-neutral-700">
                <Plus className="h-5 w-5" />
              </Button>
              <div className="ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-neutral-300">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden">
            <MobileNav onClose={() => setShowMobileMenu(false)} />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile navigation - only visible on small screens */}
        <MobileNav />
      </div>
    </div>
  );
}
