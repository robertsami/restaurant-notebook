'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Restaurant } from '@prisma/client';

interface AISuggestionsProps {
  restaurant: Restaurant;
}

interface Suggestion {
  name: string;
  reason: string;
}

export default function AISuggestions({ restaurant }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/suggest-restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantName: restaurant.name,
          location: restaurant.location,
          tags: restaurant.tags,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get restaurant suggestions');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err: any) {
      console.error('Error getting restaurant suggestions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!restaurant.id) return;
    
    setIsLoadingTags(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ai/auto-tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to auto-tag restaurant');
      }
      
      const data = await response.json();
      setTags(data.tags);
    } catch (err: any) {
      console.error('Error auto-tagging restaurant:', err);
      setError(err.message);
    } finally {
      setIsLoadingTags(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">AI Features</h2>
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md text-red-700 mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Similar Restaurant Suggestions</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetSuggestions}
              isLoading={isLoading}
            >
              Get Suggestions
            </Button>
          </div>
          
          {suggestions.length > 0 ? (
            <ul className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="border border-gray-200 rounded-md p-3">
                  <h4 className="font-medium">{suggestion.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">
              Click the button to get AI-powered restaurant suggestions similar to this one.
            </p>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Auto-Tag Restaurant</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoTag}
              isLoading={isLoadingTags}
            >
              Generate Tags
            </Button>
          </div>
          
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Click the button to automatically generate tags for this restaurant based on its notes and details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}