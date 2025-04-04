'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/button';
import { RestaurantList } from '@prisma/client';

export default function ListsPage() {
  const { lists, setLists, isLoading, setIsLoading, error, setError } = useRestaurantStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/lists');
        if (!response.ok) throw new Error('Failed to fetch lists');
        const data = await response.json();
        setLists(data);
      } catch (err: any) {
        console.error('Error fetching lists:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLists();
  }, [setLists, setIsLoading, setError]);

  const filteredLists = lists.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Lists</h1>
        <Link href="/lists/new">
          <Button>Create New List</Button>
        </Link>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search lists..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <svg
          className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          Error: {error}
        </div>
      ) : filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list: RestaurantList) => (
            <Link key={list.id} href={`/lists/${list.id}`}>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-full flex flex-col">
                <h2 className="text-xl font-semibold mb-2">{list.title}</h2>
                {list.description && (
                  <p className="text-gray-600 mb-4 flex-grow">{list.description}</p>
                )}
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {list.visibility === 'private' ? 'Private' : 
                     list.visibility === 'friends' ? 'Friends' : 'Public'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(list.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No lists found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No lists match your search criteria.' : 'You haven\'t created any lists yet.'}
          </p>
          <Link href="/lists/new">
            <Button>Create Your First List</Button>
          </Link>
        </div>
      )}
    </div>
  );
}