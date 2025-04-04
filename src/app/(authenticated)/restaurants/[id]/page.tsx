'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Restaurant, Note, RestaurantList } from '@prisma/client';
import AddNoteForm from '@/components/restaurants/add-note-form';
import NoteCard from '@/components/restaurants/note-card';
import AISuggestions from '@/components/restaurants/ai-suggestions';

type RestaurantWithDetails = Restaurant & {
  notes: (Note & {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  })[];
  lists: (RestaurantList & {
    _count: {
      restaurants: number;
    };
  })[];
};

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<RestaurantWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const restaurantId = params.id as string;

  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Restaurant not found');
          }
          throw new Error('Failed to fetch restaurant');
        }
        
        const data = await response.json();
        setRestaurant(data);
      } catch (err: any) {
        console.error('Error fetching restaurant:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (restaurantId) {
      fetchRestaurant();
    }
  }, [restaurantId]);

  const handleNoteAdded = (newNote: Note) => {
    if (restaurant) {
      // Add the new note to the restaurant
      setRestaurant({
        ...restaurant,
        notes: [
          ...restaurant.notes,
          {
            ...newNote,
            user: {
              id: newNote.userId,
              name: 'You',
              email: '',
              image: null,
            },
          },
        ],
      });
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-md text-red-700">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => router.push('/restaurants')}
        >
          Back to Restaurants
        </Button>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          {restaurant.location && (
            <p className="text-gray-600 mt-1">{restaurant.location}</p>
          )}
          {restaurant.tags && restaurant.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {restaurant.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {restaurant.averageRating && (
            <div className="flex items-center mt-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(restaurant.averageRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-gray-700">
                  {restaurant.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-600">
                {restaurant.notes.length} {restaurant.notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
          >
            {showAISuggestions ? 'Hide AI Suggestions' : 'Get AI Suggestions'}
          </Button>
          <Button
            onClick={() => setIsAddingNote(true)}
          >
            Add Note
          </Button>
        </div>
      </div>

      {showAISuggestions && (
        <AISuggestions restaurant={restaurant} />
      )}

      {restaurant.lists && restaurant.lists.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">In Your Lists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurant.lists.map((list) => (
              <Link key={list.id} href={`/lists/${list.id}`}>
                <div className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium">{list.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {list._count.restaurants} restaurants
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isAddingNote ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add Note</h2>
            <button
              onClick={() => setIsAddingNote(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <AddNoteForm
            restaurantId={restaurantId}
            onNoteAdded={handleNoteAdded}
            onCancel={() => setIsAddingNote(false)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notes & Reviews</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
            >
              Add Note
            </Button>
          </div>

          {restaurant.notes.length > 0 ? (
            <div className="space-y-4">
              {restaurant.notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No notes yet</h3>
              <p className="text-gray-500 mb-6">
                Be the first to add a note about this restaurant.
              </p>
              <Button onClick={() => setIsAddingNote(true)}>
                Add Your First Note
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}