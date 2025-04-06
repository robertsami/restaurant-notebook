import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import RestaurantCard from "@/components/dashboard/restaurant-card";
import { Restaurant as RestaurantType, RestaurantWithLists } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/common/search-input";
import { PlusCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import RestaurantForm from "@/components/restaurants/restaurant-form";

export default function RestaurantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddRestaurantDialogOpen, setIsAddRestaurantDialogOpen] = useState(false);

  // Fetch all restaurants
  const { data: restaurants, isLoading } = useQuery<RestaurantWithLists[]>({
    queryKey: ["/api/restaurants"],
  });

  // Filter restaurants based on search term
  const filteredRestaurants = restaurants?.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">Restaurants</h1>
          <p className="mt-1 text-neutral-600">Manage all your saved restaurants</p>
        </div>

        <Dialog open={isAddRestaurantDialogOpen} onOpenChange={setIsAddRestaurantDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Restaurant</DialogTitle>
              <DialogDescription>
                Enter details or a Google Maps link to add a restaurant to your collection.
              </DialogDescription>
            </DialogHeader>
            <RestaurantForm onSuccess={() => setIsAddRestaurantDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <SearchInput 
          placeholder="Search restaurants by name, cuisine, or location" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : filteredRestaurants && filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))
        ) : filteredRestaurants && filteredRestaurants.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-card text-center">
            <p className="text-neutral-600 mb-4">
              {searchTerm ? "No restaurants match your search" : "You haven't added any restaurants yet"}
            </p>
            <Button onClick={() => setIsAddRestaurantDialogOpen(true)}>
              Add Your First Restaurant
            </Button>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
