'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewListPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          visibility,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create list');
      }
      
      const list = await response.json();
      router.push(`/lists/${list.id}`);
    } catch (err: any) {
      console.error('Error creating list:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New List</h1>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Favorite Restaurants"
          required
        />
        
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A collection of my favorite restaurants in the city"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>
        
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visibility
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="private"
                name="visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="private" className="ml-2 block text-sm text-gray-700">
                Private (only you can see)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="friends"
                name="visibility"
                value="friends"
                checked={visibility === 'friends'}
                onChange={() => setVisibility('friends')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="friends" className="ml-2 block text-sm text-gray-700">
                Friends (only people you invite)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="public"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="public" className="ml-2 block text-sm text-gray-700">
                Public (anyone can see)
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
          >
            Create List
          </Button>
        </div>
      </form>
    </div>
  );
}