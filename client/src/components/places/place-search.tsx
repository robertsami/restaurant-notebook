import { useState, useCallback, useRef, useEffect } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  name: string;
  placeId: string;
  address: string;
  rating?: string;
  priceLevel?: string;
  photoUrl?: string;
  cuisine?: string;
  mapUrl?: string;
}

interface PlaceSearchProps {
  onSelectPlace: (place: PlaceDetails) => void;
  placeholder?: string;
  initialQuery?: string;
}

export default function PlaceSearch({ onSelectPlace, placeholder = "Search for restaurants...", initialQuery = "" }: PlaceSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update debounced query value after delay
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, 300),
    []
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSetQuery(value);
    setSelectedPlaceId(null);
  };

  // Query for search results
  const { data: searchResults = [], isLoading: isSearching } = useQuery<PlaceAutocompleteResult[]>({
    queryKey: ["/api/places/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      try {
        // Use apiRequest to ensure the auth token is sent with the request
        const response = await apiRequest("GET", `/api/places/search?query=${encodeURIComponent(debouncedQuery)}`);
        return await response.json();
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search failed",
          description: "Could not retrieve restaurant suggestions. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: debouncedQuery.length > 1,
  });

  // Handle place selection
  const handleSelectPlace = async (placeId: string) => {
    setIsLoading(true);
    setSelectedPlaceId(placeId);
    
    try {
      const response = await apiRequest("GET", `/api/places/${placeId}`);
      const placeDetails: PlaceDetails = await response.json();
      onSelectPlace(placeDetails);
      
      // Clear the search after selection
      setQuery("");
      setDebouncedQuery("");
    } catch (error) {
      toast({
        title: "Error fetching place details",
        description: "Failed to load restaurant details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-9"
          disabled={isLoading}
        />
        {(isLoading || isSearching) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Show dropdown when we have results or are searching */}
      {(searchResults.length > 0 || (isSearching && debouncedQuery.length > 1)) && query && !selectedPlaceId && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-neutral-200 max-h-96 overflow-y-auto">
          {isSearching && debouncedQuery.length > 1 ? (
            <div className="py-3 px-4 text-sm text-neutral-500 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
              Searching for "{debouncedQuery}"...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-3 px-4 text-sm text-neutral-500">
              No restaurants found for "{debouncedQuery}"
            </div>
          ) : (
            <ul className="py-1">
              {searchResults.map((result) => (
                <li key={result.placeId}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 text-left"
                    onClick={() => handleSelectPlace(result.placeId)}
                  >
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-neutral-400" />
                      <div className="text-sm">
                        <div className="font-medium">{result.mainText}</div>
                        <div className="text-neutral-500 text-xs">{result.secondaryText}</div>
                      </div>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}