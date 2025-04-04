'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/button';
import { RestaurantList, Restaurant, ListCollaborator } from '@prisma/client';
import AddRestaurantModal from '@/components/lists/add-restaurant-modal';
import ShareListModal from '@/components/lists/share-list-modal';

type RestaurantWithDetails = Restaurant & {
  _count?: {
    notes: number;
  };
};

type ListWithDetails = RestaurantList & {
  restaurants: RestaurantWithDetails[];
  collaborators: (ListCollaborator & {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  })[];
  _count: {
    restaurants: number;
    collaborators: number;
  };
};

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentList, isLoading, setIsLoading, error, setError } = useRestaurantStore();
  const [list, setList] = useState<ListWithDetails | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const listId = params.id as string;

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/lists/${listId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('List not found');
          }
          throw new Error('Failed to fetch list');
        }
        
        const data = await response.json();
        setList(data);
        setCurrentList(data);
      } catch (err: any) {
        console.error('Error fetching list:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (listId) {
      fetchList();
    }
  }, [listId, setCurrentList, setIsLoading, setError]);

  const handleDeleteList = async () => {
    if (!window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete list');
      }
      
      router.push('/lists');
    } catch (err: any) {
      console.error('Error deleting list:', err);
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const handleRemoveRestaurant = async (restaurantId: string) => {
    if (!window.confirm('Are you sure you want to remove this restaurant from the list?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/lists/${listId}/restaurants/${restaurantId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove restaurant');
      }
      
      // Update the list in state
      if (list) {
        setList({
          ...list,
          restaurants: list.restaurants.filter(r => r.id !== restaurantId),
          _count: {
            ...list._count,
            restaurants: list._count.restaurants - 1,
          },
        });
      }
    } catch (err: any) {
      console.error('Error removing restaurant:', err);
      setError(err.message);
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
          onClick={() => router.push('/lists')}
        >
          Back to Lists
        </Button>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{list.title}</h1>
          {list.description && (
            <p className="text-gray-600 mt-1">{list.description}</p>
          )}
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="capitalize">{list.visibility}</span>
            <span className="mx-2">•</span>
            <span>{list._count.restaurants} restaurants</span>
            {list._count.collaborators > 0 && (
              <>
                <span className="mx-2">•</span>
                <span>{list._count.collaborators} collaborators</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsShareModalOpen(true)}
          >
            Share
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Restaurant
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteList}
            isLoading={isDeleting}
          >
            Delete List
          </Button>
        </div>
      </div>

      {list.restaurants.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {list.restaurants.map((restaurant) => (
              <li key={restaurant.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <Link 
                      href={`/restaurants/${restaurant.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {restaurant.name}
                    </Link>
                    {restaurant.location && (
                      <p className="text-gray-600">{restaurant.location}</p>
                    )}
                    <div className="flex items-center mt-1">
                      {restaurant.averageRating && (
                        <div className="flex items-center mr-3">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
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
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        {restaurant._count?.notes || 0} notes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/lists/${listId}/restaurants/${restaurant.id}`}>
                      <Button variant="outline" size="sm">
                        Add Note
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRestaurant(restaurant.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No restaurants in this list yet</h3>
          <p className="text-gray-500 mb-6">
            Start adding restaurants to your list.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Your First Restaurant
          </Button>
        </div>
      )}

      {isAddModalOpen && (
        <AddRestaurantModal
          listId={listId}
          onClose={() => setIsAddModalOpen(false)}
          onAddSuccess={(newRestaurant) => {
            if (list) {
              setList({
                ...list,
                restaurants: [...list.restaurants, newRestaurant],
                _count: {
                  ...list._count,
                  restaurants: list._count.restaurants + 1,
                },
              });
            }
            setIsAddModalOpen(false);
          }}
        />
      )}

      {isShareModalOpen && (
        <ShareListModal
          list={list}
          onClose={() => setIsShareModalOpen(false)}
          onUpdateSuccess={(updatedList) => {
            setList(updatedList as ListWithDetails);
            setIsShareModalOpen(false);
          }}
        />
      )}
    </div>
  );
}