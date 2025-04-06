import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRestaurantSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Map, Edit3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PlaceSearch, { PlaceDetails } from "@/components/places/place-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend the restaurant schema to include validation and form-specific fields
const restaurantFormSchema = insertRestaurantSchema.extend({
  mapUrl: z.string().optional(),
  listId: z.string().optional(),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

interface RestaurantFormProps {
  listId?: number;
  initialData?: Partial<RestaurantFormValues>;
  onSuccess?: () => void;
}

export default function RestaurantForm({ listId, initialData, onSuccess }: RestaurantFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("search");
  const [placeDetailsLoading, setPlaceDetailsLoading] = useState(false);

  // Fetch user's lists for the dropdown if adding to a list
  const { data: lists } = useQuery({
    queryKey: ["/api/lists"],
    enabled: !listId, // Only fetch if listId is not provided
  });

  // Form definition
  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      placeId: initialData?.placeId || "",
      address: initialData?.address || "",
      cuisine: initialData?.cuisine || "",
      priceLevel: initialData?.priceLevel || "",
      rating: initialData?.rating || "",
      photoUrl: initialData?.photoUrl || "",
      mapUrl: "",
      listId: initialData?.listId || (listId ? listId.toString() : undefined),
    },
  });

  // Handle place selection from Google Places search
  const handlePlaceSelect = (placeDetails: PlaceDetails) => {
    // Create a restaurant object with the selected place details
    const restaurantData: RestaurantFormValues = {
      name: placeDetails.name,
      placeId: placeDetails.placeId,
      address: placeDetails.address,
      cuisine: placeDetails.cuisine || "",
      priceLevel: placeDetails.priceLevel || "",
      rating: placeDetails.rating || "",
      photoUrl: placeDetails.photoUrl || "",
      mapUrl: placeDetails.mapUrl || "",
      // Include the listId if necessary
      listId: form.getValues().listId,
    };
    
    // Directly submit the restaurant to be added
    createRestaurantMutation.mutate(restaurantData);
  };
  
  // Process Google Maps URL
  const processMapUrl = async () => {
    const mapUrl = form.getValues("mapUrl");
    if (!mapUrl) {
      toast({
        title: "URL required",
        description: "Please enter a Google Maps URL",
        variant: "destructive",
      });
      return;
    }
    
    setPlaceDetailsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/places/url", { url: mapUrl });
      const placeDetails = await response.json();
      
      form.reset({
        ...form.getValues(),
        name: placeDetails.name,
        placeId: placeDetails.placeId,
        address: placeDetails.address,
        cuisine: placeDetails.cuisine || "",
        priceLevel: placeDetails.priceLevel || "",
        rating: placeDetails.rating || "",
        photoUrl: placeDetails.photoUrl || "",
      });
      
      toast({
        title: "Restaurant found",
        description: `Details for "${placeDetails.name}" have been loaded.`,
      });
      
      // Switch to manual tab to show the loaded details
      setActiveTab("manual");
    } catch (error) {
      toast({
        title: "Failed to process URL",
        description: "Could not extract restaurant details from the provided URL. Try another URL or manual entry.",
        variant: "destructive",
      });
    } finally {
      setPlaceDetailsLoading(false);
    }
  };

  // Create restaurant mutation
  const createRestaurantMutation = useMutation({
    mutationFn: async (data: RestaurantFormValues) => {
      // Remove mapUrl and listId as they're not part of the actual restaurant schema
      const { mapUrl, listId: formListId, ...restaurantData } = data;
      
      // Create or get the restaurant
      const response = await apiRequest("POST", "/api/restaurants", restaurantData);
      const restaurant = await response.json();
      
      // If listId is provided, add restaurant to the list
      if (listId) {
        await apiRequest("POST", `/api/lists/${listId}/restaurants`, {
          restaurantId: restaurant.id
        });
      } else if (formListId) {
        // If user selected a list from dropdown
        await apiRequest("POST", `/api/lists/${formListId}/restaurants`, {
          restaurantId: restaurant.id
        });
      }
      
      return restaurant;
    },
    onSuccess: (restaurant, variables) => {
      toast({
        title: "Restaurant added",
        description: "The restaurant has been successfully added.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      
      // If listId was provided as prop, invalidate those queries
      if (listId) {
        queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}/restaurants`] });
      }
      
      // If a listId was provided in the form data, invalidate those queries too
      const formListId = variables.listId;
      if (formListId && formListId !== listId?.toString()) {
        queryClient.invalidateQueries({ queryKey: [`/api/lists/${formListId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/lists/${formListId}/restaurants`] });
      }
      
      // Always invalidate the lists query
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      
      // Call success callback
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to add restaurant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: RestaurantFormValues) => {
    createRestaurantMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              <span>Search</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center">
              <Map className="h-4 w-4 mr-2" />
              <span>URL</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center">
              <Edit3 className="h-4 w-4 mr-2" />
              <span>Manual</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-0">
            <div className="space-y-4">
              <PlaceSearch 
                onSelectPlace={handlePlaceSelect} 
                placeholder="Search for a restaurant..."
              />
              
              <FormDescription className="text-center">
                Search for a restaurant by name, location, or other keywords.
                Results will automatically fill in all details.
              </FormDescription>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-0">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="mapUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps URL</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="https://maps.google.com/..." 
                          className="flex-1"
                          disabled={placeDetailsLoading}
                          {...field} 
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        onClick={processMapUrl}
                        disabled={placeDetailsLoading}
                      >
                        {placeDetailsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Lookup"
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Paste a Google Maps URL to automatically extract restaurant details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="mt-0">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter restaurant name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Google Maps Place ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier from Google Maps
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cuisine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuisine</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Italian, Thai, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select price level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="$">$ (Inexpensive)</SelectItem>
                          <SelectItem value="$$">$$ (Moderate)</SelectItem>
                          <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
                          <SelectItem value="$$$$">$$$$ (Very Expensive)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Restaurant address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="e.g. 4.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview image if available */}
        {form.watch("photoUrl") && (
          <div className="mt-2 flex justify-center">
            <div className="relative w-full max-w-xs h-32 overflow-hidden rounded-md">
              <img
                src={form.watch("photoUrl")}
                alt={form.watch("name") || "Restaurant"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* List selection (only if listId is not provided) */}
        {!listId && (
          <FormField
            control={form.control}
            name="listId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add to list</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lists?.map(list => (
                      <SelectItem key={list.id} value={list.id.toString()}>
                        {list.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose a list to add this restaurant to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={createRestaurantMutation.isPending || !form.watch("name")}
        >
          {createRestaurantMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Restaurant...
            </>
          ) : (
            "Add Restaurant"
          )}
        </Button>
      </form>
    </Form>
  );
}
