'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './button';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Restaurant Notebook
            </Link>
          </div>
          
          <div className="hidden md:flex md:space-x-8">
            <Link
              href="/dashboard"
              className={`px-3 py-2 text-sm font-medium ${
                pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/lists"
              className={`px-3 py-2 text-sm font-medium ${
                pathname === '/lists' || pathname.startsWith('/lists/') 
                  ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              My Lists
            </Link>
            <Link
              href="/restaurants"
              className={`px-3 py-2 text-sm font-medium ${
                pathname === '/restaurants' || pathname.startsWith('/restaurants/') 
                  ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Restaurants
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-700 hidden md:inline">
                  {session.user.name || session.user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}