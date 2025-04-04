'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantList, ListCollaborator } from '@prisma/client';

interface ShareListModalProps {
  list: RestaurantList & {
    collaborators: (ListCollaborator & {
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    })[];
  };
  onClose: () => void;
  onUpdateSuccess: (list: RestaurantList) => void;
}

export default function ShareListModal({ list, onClose, onUpdateSuccess }: ShareListModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [visibility, setVisibility] = useState(list.visibility);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    setIsInviting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/lists/${list.id}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to invite collaborator');
      }
      
      const updatedList = await response.json();
      onUpdateSuccess(updatedList);
      setEmail('');
    } catch (err: any) {
      console.error('Error inviting collaborator:', err);
      setError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(`/api/lists/${list.id}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove collaborator');
      }
      
      const updatedList = await response.json();
      onUpdateSuccess(updatedList);
    } catch (err: any) {
      console.error('Error removing collaborator:', err);
      setError(err.message);
    }
  };

  const handleUpdateVisibility = async () => {
    setIsSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visibility,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update visibility');
      }
      
      const updatedList = await response.json();
      onUpdateSuccess(updatedList);
    } catch (err: any) {
      console.error('Error updating visibility:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Share List</h2>
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

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              List Visibility
            </h3>
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
                  Private (only you and collaborators)
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
            {visibility !== list.visibility && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={handleUpdateVisibility}
                  isLoading={isSaving}
                >
                  Save Visibility
                </Button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Invite Collaborators
            </h3>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <Button
              onClick={handleInvite}
              isLoading={isInviting}
              disabled={!email.trim()}
              size="sm"
              className="w-full"
            >
              Invite
            </Button>
          </div>

          {list.collaborators.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Current Collaborators
              </h3>
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {list.collaborators.map((collaborator) => (
                  <li
                    key={collaborator.id}
                    className="flex justify-between items-center p-3"
                  >
                    <div>
                      <div className="font-medium">
                        {collaborator.user.name || collaborator.user.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <span className="capitalize">{collaborator.role}</span>
                        <span className="mx-1">•</span>
                        <span>{collaborator.user.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}