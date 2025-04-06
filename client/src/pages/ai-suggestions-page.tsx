import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { RestaurantWithLists } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RestaurantCard from "@/components/dashboard/restaurant-card";
import { Sparkles, Star, ExternalLink } from "lucide-react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AiSuggestionsPage() {
  const { toast } = useToast();
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Fetch user's restaurants
  const { data: restaurants, isLoading } = useQuery<RestaurantWithLists[]>({
    queryKey: ["/api/restaurants"],
  });

  // Generate suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (restaurantIds: number[]) => {
      const response = await apiRequest("POST", "/api/ai/suggest-restaurants", {
        restaurantIds
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Suggestions generated",
        description: "New restaurant suggestions based on your preferences",
      });
      setSuggestions(data);
    },
    onError: (error) => {
      toast({
        title: "Failed to generate suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle restaurant selection change
  const handleRestaurantSelect = (id: string) => {
    setSelectedRestaurantIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle generate suggestions
  const handleGenerateSuggestions = () => {
    if (selectedRestaurantIds.length === 0) {
      toast({
        title: "No restaurants selected",
        description: "Please select at least one restaurant to generate suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    const ids = selectedRestaurantIds.map(id => parseInt(id));
    generateSuggestionsMutation.mutate(ids);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">AI Restaurant Suggestions</h1>
        <p className="mt-1 text-neutral-600">Get personalized restaurant recommendations based on your preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Your Favorite Restaurants</CardTitle>
              <CardDescription>
                Choose restaurants you like to get similar recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-28 w-full mb-4" />
                  <Skeleton className="h-28 w-full mb-4" />
                  <Skeleton className="h-28 w-full" />
                </>
              ) : restaurants && restaurants.length > 0 ? (
                <div className="space-y-2">
                  {restaurants.map((restaurant) => (
                    <div 
                      key={restaurant.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:bg-neutral-50 transition-colors ${
                        selectedRestaurantIds.includes(restaurant.id.toString()) 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-neutral-200'
                      }`}
                      onClick={() => handleRestaurantSelect(restaurant.id.toString())}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12 bg-neutral-200 rounded-md overflow-hidden mr-3">
                          {restaurant.photoUrl && (
                            <img 
                              src={restaurant.photoUrl} 
                              alt={restaurant.name} 
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-900">{restaurant.name}</h3>
                          <p className="text-sm text-neutral-600">
                            {restaurant.cuisine || "Unknown cuisine"} • {restaurant.priceLevel || "$"}
                            {restaurant.rating && (
                              <span className="ml-2 flex items-center inline-flex">
                                <Star className="h-3 w-3 text-amber-400 fill-current mr-0.5" />
                                {restaurant.rating}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-neutral-600 mb-2">You haven't added any restaurants yet.</p>
                  <p className="text-sm text-neutral-500">Add restaurants to get AI suggestions.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateSuggestions} 
                disabled={selectedRestaurantIds.length === 0 || generateSuggestionsMutation.isPending}
                className="w-full"
              >
                {generateSuggestionsMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                    Generating suggestions...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Restaurant Suggestions
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                </div>
                <CardTitle>AI Suggestions</CardTitle>
              </div>
              <CardDescription>
                Restaurants you might enjoy based on your preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generateSuggestionsMutation.isPending ? (
                <>
                  <Skeleton className="h-20 w-full mb-3" />
                  <Skeleton className="h-20 w-full mb-3" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-neutral-900">{suggestion.name}</h3>
                        <div className="flex items-center text-amber-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm text-neutral-700">{suggestion.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{suggestion.cuisine} • {suggestion.priceLevel}</p>
                      <div className="mt-2 bg-white p-2 rounded border border-neutral-200">
                        <p className="text-xs text-neutral-700">{suggestion.reason}</p>
                      </div>
                      <div className="mt-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-0 h-auto"
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.name + ' restaurant')}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span className="text-xs">Find on Google</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Sparkles className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                  <p className="text-neutral-600">Select restaurants and generate suggestions to see recommendations here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
