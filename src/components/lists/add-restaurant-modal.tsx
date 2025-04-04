'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Restaurant } from '@prisma/client';

interface AddRestaurantModalProps {
  listId: string;
  onClose: () => void;
  onAddSuccess: (restaurant: Restaurant) => void;
}

export default function AddRestaurantModal({ listId, onClose, onAddSuccess }: AddRestaurantModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newRestaurantLocation, setNewRestaurantLocation] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const response = await fetch(`/api/restaurants/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Failed to search restaurants');
      
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        setIsCreatingNew(true);
        setNewRestaurantName(searchTerm);
      }
    } catch (err: any) {
      console.error('Error searching restaurants:', err);
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToList = async () => {
    setIsAdding(true);
    setError('');
    
    try {
      let restaurantToAdd = selectedRestaurant;
      
      // If creating a new restaurant
      if (isCreatingNew) {
        if (!newRestaurantName.trim()) {
          setError('Restaurant name is required');
          setIsAdding(false);
          return;
        }
        
        const createResponse = await fetch('/api/restaurants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newRestaurantName,
            location: newRestaurantLocation,
          }),
        });
        
        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.message || 'Failed to create restaurant');
        }
        
        restaurantToAdd = await createResponse.json();
      }
      
      if (!restaurantToAdd) {
        setError('No restaurant selected');
        setIsAdding(false);
        return;
      }
      
      // Add restaurant to list
      const addResponse = await fetch(`/api/lists/${listId}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurantToAdd.id,
        }),
      });
      
      if (!addResponse.ok) {
        const data = await addResponse.json();
        throw new Error(data.message || 'Failed to add restaurant to list');
      }
      
      onAddSuccess(restaurantToAdd);
    } catch (err: any) {
      console.error('Error adding restaurant to list:', err);
      setError(err.message);
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add Restaurant to List</h2>
            <button
              onClick={onClose}
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

          {error && (
            <div className="bg-red-50 p-3 rounded-md text-red-700 mb-4">
              {error}
            </div>
          )}

          {!isCreatingNew ? (
            <>
              <div className="mb-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search for a restaurant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                  />
                  <Button
                    onClick={handleSearch}
                    isLoading={isSearching}
                    disabled={!searchTerm.trim()}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {searchResults.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Select a restaurant:
                  </h3>
                  <ul className="max-h-60 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                    {searchResults.map((restaurant) => (
                      <li
                        key={restaurant.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedRestaurant?.id === restaurant.id
                            ? 'bg-blue-50'
                            : ''
                        }`}
                        onClick={() => setSelectedRestaurant(restaurant)}
                      >
                        <div className="font-medium">{restaurant.name}</div>
                        {restaurant.location && (
                          <div className="text-sm text-gray-500">
                            {restaurant.location}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : searchTerm && !isSearching && (
                <div className="mb-4 text-center">
                  <p className="text-gray-600 mb-3">
                    No restaurants found with that name.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingNew(true);
                      setNewRestaurantName(searchTerm);
                    }}
                  >
                    Create "{searchTerm}"
                  </Button>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToList}
                  disabled={!selectedRestaurant}
                  isLoading={isAdding}
                >
                  Add to List
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <Input
                  label="Restaurant Name"
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  required
                />
                <Input
                  label="Location (optional)"
                  value={newRestaurantLocation}
                  onChange={(e) => setNewRestaurantLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setSearchResults([]);
                  }}
                >
                  Back to Search
                </Button>
                <Button
                  onClick={handleAddToList}
                  disabled={!newRestaurantName.trim()}
                  isLoading={isAdding}
                >
                  Create & Add
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}