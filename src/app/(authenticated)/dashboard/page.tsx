'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/button';
import { RestaurantList, Note } from '@prisma/client';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { lists, setLists, notes, setNotes, isLoading, setIsLoading, error, setError } = useRestaurantStore();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch user's lists
        const listsResponse = await fetch('/api/lists');
        if (!listsResponse.ok) throw new Error('Failed to fetch lists');
        const listsData = await listsResponse.json();
        setLists(listsData);
        
        // Fetch user's recent notes
        const notesResponse = await fetch('/api/notes/recent');
        if (!notesResponse.ok) throw new Error('Failed to fetch notes');
        const notesData = await notesResponse.json();
        setNotes(notesData);
        
        // Fetch recent activity
        const activityResponse = await fetch('/api/activity');
        if (!activityResponse.ok) throw new Error('Failed to fetch activity');
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      } catch (err: any) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session) {
      fetchDashboardData();
    }
  }, [session, setLists, setNotes, setIsLoading, setError]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/lists/new">
          <Button>Create New List</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Lists</h2>
          {lists.length > 0 ? (
            <div className="space-y-4">
              {lists.slice(0, 5).map((list: RestaurantList) => (
                <Link 
                  key={list.id} 
                  href={`/lists/${list.id}`}
                  className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <h3 className="font-medium">{list.title}</h3>
                  {list.description && (
                    <p className="text-gray-600 text-sm mt-1">{list.description}</p>
                  )}
                </Link>
              ))}
              {lists.length > 5 && (
                <Link href="/lists" className="text-blue-600 hover:underline text-sm">
                  View all lists ({lists.length})
                </Link>
              )}
            </div>
          ) : (
            <p className="text-gray-500">You haven't created any lists yet.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Notes</h2>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.slice(0, 3).map((note: Note & { restaurant: { name: string } }) => (
                <div key={note.id} className="p-4 border border-gray-200 rounded-md">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{note.restaurant?.name || 'Unknown Restaurant'}</h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < (note.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {note.content && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{note.content}</p>
                  )}
                  {note.visitDate && (
                    <p className="text-gray-500 text-xs mt-2">
                      Visited: {new Date(note.visitDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              <Link href="/notes" className="text-blue-600 hover:underline text-sm">
                View all notes
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">You haven't written any notes yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border-b border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-lg">
                    {activity.type === 'add_restaurant' ? '🍽️' : 
                     activity.type === 'write_note' ? '📝' : 
                     activity.type === 'create_list' ? '📋' : '🔔'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-800">{activity.content}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity.</p>
        )}
      </div>
    </div>
  );
}