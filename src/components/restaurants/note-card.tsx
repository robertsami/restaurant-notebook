'use client';

import { useState } from 'react';
import { Note } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface NoteCardProps {
  note: Note & {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

export default function NoteCard({ note }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!note.content) return;
    
    setIsLoadingSummary(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: note.content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to summarize note');
      }
      
      const data = await response.json();
      setSummary(data.summary);
      setShowSummary(true);
    } catch (err: any) {
      console.error('Error summarizing note:', err);
      setError(err.message);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const renderContent = () => {
    if (!note.content) return null;
    
    if (showSummary && summary) {
      return (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">AI Summary:</h4>
          <div className="text-gray-600 bg-blue-50 p-3 rounded-md">
            {summary}
          </div>
          <button
            onClick={() => setShowSummary(false)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-2"
          >
            Show original note
          </button>
        </div>
      );
    }
    
    const shouldTruncate = note.content.length > 200 && !isExpanded;
    const displayContent = shouldTruncate
      ? `${note.content.substring(0, 200)}...`
      : note.content;
    
    return (
      <div className="mt-2">
        <p className="text-gray-600 whitespace-pre-line">{displayContent}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-1"
          >
            Read more
          </button>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-1 ml-2"
          >
            Show less
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {note.user.image ? (
            <img
              className="h-10 w-10 rounded-full"
              src={note.user.image}
              alt={note.user.name || 'User'}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {note.user.name?.charAt(0) || note.user.email?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
        <div className="ml-4 flex-1">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {note.user.name || note.user.email}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDate(note.createdAt)}
                {note.visitDate && (
                  <span className="ml-2">
                    • Visited: {new Date(note.visitDate).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            {note.rating && (
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < note.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}
          </div>

          {renderContent()}

          {note.photos && note.photos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {note.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-md"
                />
              ))}
            </div>
          )}

          {note.content && !showSummary && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSummarize}
                isLoading={isLoadingSummary}
              >
                AI Summarize
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}