import { Link } from "wouter";
import { RestaurantWithLists } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface RestaurantCardProps {
  restaurant: RestaurantWithLists;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  // Default image for restaurants without photos
  const defaultImage = "https://images.unsplash.com/photo-1502301103665-0b95cc738daf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
  
  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4 cursor-pointer">
        <div className="flex">
          <div className="flex-shrink-0 w-20 h-20 bg-neutral-200 rounded-lg overflow-hidden">
            <img 
              className="h-full w-full object-cover" 
              src={restaurant.photoUrl || defaultImage} 
              alt={restaurant.name}
            />
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">{restaurant.name}</h3>
              {restaurant.rating && (
                <div className="flex items-center">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm text-neutral-700">{restaurant.rating}</span>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-neutral-600">
              {restaurant.cuisine || "Unknown cuisine"} • {restaurant.priceLevel || "$"}
            </p>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {restaurant.lists?.slice(0, 3).map((list, index) => (
                <Badge 
                  key={`${list.listId}-${index}`} 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-neutral-100 rounded-full text-neutral-700"
                >
                  {list.listTitle}
                </Badge>
              ))}
              
              {restaurant.lists && restaurant.lists.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-neutral-100 rounded-full text-neutral-700"
                >
                  +{restaurant.lists.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
