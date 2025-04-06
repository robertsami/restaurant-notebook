import { Link } from "wouter";
import { ListWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ListCardProps {
  list: ListWithDetails;
}

export default function ListCard({ list }: ListCardProps) {
  const formattedDate = list.updatedAt 
    ? formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true }) 
    : 'Date unknown';

  // Placeholder image for lists without cover images
  const defaultImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative">
      <Link href={`/lists/${list.id}`} className="block absolute inset-0 z-10">
        <span className="sr-only">View {list.title}</span>
      </Link>
      
      <div className="h-32 w-full bg-neutral-200 relative">
        <img 
          className="h-full w-full object-cover" 
          src={list.coverImage || defaultImage} 
          alt={list.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="font-heading font-semibold text-white text-lg">{list.title}</h3>
          <p className="text-white/80 text-sm">{list.restaurantCount} restaurants</p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center text-sm text-neutral-500 mb-3">
          <svg 
            className="mr-1.5 h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Updated {formattedDate}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {list.collaborators.slice(0, 3).map((collab, index) => (
              <Avatar key={`${collab.userId}-${index}`} className="h-7 w-7 border-2 border-white">
                <AvatarImage src={collab.avatar} alt={collab.name} />
                <AvatarFallback className="bg-neutral-300 text-xs">
                  {collab.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            
            {list.collaborators.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center text-xs font-medium text-neutral-600">
                +{list.collaborators.length - 3}
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-neutral-500 hover:text-neutral-700 p-1 relative z-20">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-30">
              <DropdownMenuItem>
                <Link href={`/lists/${list.id}`}>View List</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Edit List</DropdownMenuItem>
              <DropdownMenuItem>Share List</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
