import { Link, useLocation } from "wouter";
import { Home, ListChecks, MapPin, Users, User, Plus } from "lucide-react";

interface MobileNavProps {
  onClose?: () => void;
}

export default function MobileNav({ onClose }: MobileNavProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Full-screen sidebar for small screens - shown when menu button is clicked */}
      {onClose && (
        <div className="fixed inset-0 z-20 bg-white p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="text-2xl text-primary-500 mr-2">
                <i className="ri-restaurant-fill"></i>
              </div>
              <h1 className="text-xl font-bold font-heading">Restaurant Notebook</h1>
            </div>
            <button 
              className="text-neutral-500 hover:text-neutral-700"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="space-y-2">
            <Link href="/">
              <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
                <Home className={`mr-3 h-5 w-5 ${isActive("/") ? "text-primary-500" : "text-neutral-500"}`} />
                <span>Dashboard</span>
              </a>
            </Link>
            
            <Link href="/lists">
              <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/lists") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
                <ListChecks className={`mr-3 h-5 w-5 ${isActive("/lists") ? "text-primary-500" : "text-neutral-500"}`} />
                <span>My Lists</span>
              </a>
            </Link>
            
            <Link href="/restaurants">
              <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/restaurants") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
                <MapPin className={`mr-3 h-5 w-5 ${isActive("/restaurants") ? "text-primary-500" : "text-neutral-500"}`} />
                <span>Restaurants</span>
              </a>
            </Link>
            
            <Link href="/shared">
              <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/shared") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
                <Users className={`mr-3 h-5 w-5 ${isActive("/shared") ? "text-primary-500" : "text-neutral-500"}`} />
                <span>Shared with me</span>
              </a>
            </Link>
            
            <Link href="/friends">
              <a className={`flex items-center px-3 py-2 text-sm rounded-lg font-medium ${isActive("/friends") ? "text-neutral-900 bg-primary-50" : "text-neutral-600 hover:bg-neutral-100"}`}>
                <User className={`mr-3 h-5 w-5 ${isActive("/friends") ? "text-primary-500" : "text-neutral-500"}`} />
                <span>Friends</span>
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
          </nav>
        </div>
      )}

      {/* Fixed bottom navigation */}
      {!onClose && (
        <nav className="lg:hidden bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-around">
            <Link href="/">
              <a className={`flex flex-col items-center py-2 px-3 ${isActive("/") ? "text-primary-600" : "text-neutral-500"}`}>
                <Home className="h-5 w-5" />
                <span className="text-xs mt-1">Home</span>
              </a>
            </Link>
            
            <Link href="/lists">
              <a className={`flex flex-col items-center py-2 px-3 ${isActive("/lists") ? "text-primary-600" : "text-neutral-500"}`}>
                <ListChecks className="h-5 w-5" />
                <span className="text-xs mt-1">Lists</span>
              </a>
            </Link>
            
            <Link href="/restaurants/add">
              <a className="flex flex-col items-center py-2 px-3 text-neutral-500">
                <div className="bg-primary-100 rounded-full p-1">
                  <Plus className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-xs mt-1">Add</span>
              </a>
            </Link>
            
            <Link href="/restaurants">
              <a className={`flex flex-col items-center py-2 px-3 ${isActive("/restaurants") ? "text-primary-600" : "text-neutral-500"}`}>
                <MapPin className="h-5 w-5" />
                <span className="text-xs mt-1">Places</span>
              </a>
            </Link>
            
            <Link href="/friends">
              <a className={`flex flex-col items-center py-2 px-3 ${isActive("/friends") ? "text-primary-600" : "text-neutral-500"}`}>
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Friends</span>
              </a>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
