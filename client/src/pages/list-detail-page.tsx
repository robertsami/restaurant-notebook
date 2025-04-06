import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { ListWithDetails, RestaurantWithLists } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RestaurantCard from "@/components/dashboard/restaurant-card";
import { MoreHorizontal, Share2, PlusCircle, Pencil, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import ListForm from "@/components/lists/list-form";
import RestaurantForm from "@/components/restaurants/restaurant-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ListDetailPage() {
  const { id } = useParams();
  const listId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [isEditListDialogOpen, setIsEditListDialogOpen] = useState(false);
  const [isAddRestaurantDialogOpen, setIsAddRestaurantDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [shareUsername, setShareUsername] = useState("");
  const [shareAsOwner, setShareAsOwner] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Fetch list details
  const { data: list, isLoading } = useQuery<ListWithDetails>({
    queryKey: [`/api/lists/${listId}`],
    enabled: !isNaN(listId),
  });
  
  // Fetch restaurants in this list
  const { data: listRestaurants, isLoading: isLoadingRestaurants } = useQuery<RestaurantWithLists[]>({
    queryKey: [`/api/lists/${listId}/restaurants`],
    enabled: !isNaN(listId),
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/lists/${listId}`);
    },
    onSuccess: () => {
      toast({
        title: "List deleted",
        description: "The list has been successfully deleted."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      navigate("/lists");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete list",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Share list mutation
  const shareListMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/lists/${listId}/share`, { 
        username: shareUsername,
        isOwner: shareAsOwner
      });
    },
    onSuccess: () => {
      toast({
        title: "List shared",
        description: `The list has been shared with ${shareUsername}.`
      });
      setIsShareDialogOpen(false);
      setShareUsername("");
      setShareAsOwner(false);
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to share list",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reorder restaurants mutation
  const reorderRestaurantsMutation = useMutation({
    mutationFn: async (restaurantIds: number[]) => {
      await apiRequest("PUT", `/api/lists/${listId}/restaurants/reorder`, { restaurantIds });
    },
    onSuccess: () => {
      toast({
        title: "List reordered",
        description: "The restaurant order has been updated."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}/restaurants`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reorder list",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle delete confirmation
  const handleDeleteList = () => {
    deleteListMutation.mutate();
  };

  // Handle share submit
  const handleShareList = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareUsername.trim()) {
      shareListMutation.mutate();
    }
  };
  
  // Handle drag end for reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !listRestaurants) return;
    
    // If the item was dropped in the same position, do nothing
    if (result.destination.index === result.source.index) return;
    
    // Create a new array with the updated order
    const newRestaurantOrder = Array.from(listRestaurants);
    const [removed] = newRestaurantOrder.splice(result.source.index, 1);
    newRestaurantOrder.splice(result.destination.index, 0, removed);
    
    // Extract just the restaurant IDs in the new order
    const restaurantIds = newRestaurantOrder.map(restaurant => restaurant.id);
    
    // Call the mutation with the new order
    reorderRestaurantsMutation.mutate(restaurantIds);
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => navigate("/lists")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lists
        </Button>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-10 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-6" />
          <Skeleton className="h-28 w-full mb-4" />
          <Skeleton className="h-28 w-full mb-4" />
        </>
      ) : list ? (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">{list.title}</h1>
              {list.description && <p className="mt-1 text-neutral-600">{list.description}</p>}
              
              <div className="flex items-center mt-2">
                <p className="text-sm text-neutral-500">{list.restaurantCount} restaurants</p>
                <div className="mx-2 text-neutral-300">•</div>
                
                <div className="flex -space-x-2">
                  {list.collaborators.map((collab, index) => (
                    <div 
                      key={`${collab.userId}-${index}`} 
                      className="h-7 w-7 rounded-full border-2 border-white bg-neutral-200 overflow-hidden"
                      title={collab.name}
                    >
                      {collab.avatar ? (
                        <img src={collab.avatar} alt={collab.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-medium text-neutral-600">
                          {collab.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Button 
                variant={isReordering ? "default" : "outline"} 
                onClick={() => setIsReordering(!isReordering)}
                disabled={!listRestaurants || listRestaurants.length < 2}
              >
                <GripVertical className="h-4 w-4 mr-2" />
                {isReordering ? "Done Reordering" : "Reorder List"}
              </Button>
              
              <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditListDialogOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit List
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-6">
            <Button onClick={() => setIsAddRestaurantDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </div>

          {list.restaurantCount === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-card text-center">
              <p className="text-neutral-600 mb-4">This list doesn't have any restaurants yet.</p>
              <Button onClick={() => setIsAddRestaurantDialogOpen(true)}>
                Add Your First Restaurant
              </Button>
            </div>
          ) : isLoadingRestaurants ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              {listRestaurants && listRestaurants.length > 0 ? (
                <Droppable droppableId="restaurant-list">
                  {(provided) => (
                    <div 
                      className="space-y-4"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {listRestaurants.map((restaurant, index) => (
                        <Draggable 
                          key={restaurant.id.toString()} 
                          draggableId={restaurant.id.toString()} 
                          index={index}
                          isDragDisabled={!isReordering}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`relative ${snapshot.isDragging ? 'z-10' : ''}`}
                            >
                              {isReordering && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                                >
                                  <GripVertical className="h-5 w-5 text-neutral-400" />
                                </div>
                              )}
                              <div className={isReordering ? 'pl-10' : ''}>
                                <RestaurantCard 
                                  key={restaurant.id} 
                                  restaurant={restaurant} 
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-card text-center">
                  <p className="text-neutral-600 mb-4">No restaurants found in this list.</p>
                </div>
              )}
            </DragDropContext>
          )}

          {/* Edit List Dialog */}
          <Dialog open={isEditListDialogOpen} onOpenChange={setIsEditListDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit List</DialogTitle>
                <DialogDescription>
                  Update your list details.
                </DialogDescription>
              </DialogHeader>
              <ListForm 
                listId={listId} 
                initialData={{ title: list.title, description: list.description }} 
                onSuccess={() => setIsEditListDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>

          {/* Add Restaurant Dialog */}
          <Dialog open={isAddRestaurantDialogOpen} onOpenChange={setIsAddRestaurantDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Restaurant to List</DialogTitle>
                <DialogDescription>
                  Enter details or a Google Maps link to add a restaurant to this list.
                </DialogDescription>
              </DialogHeader>
              <RestaurantForm 
                listId={listId} 
                onSuccess={() => setIsAddRestaurantDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>

          {/* Share List Dialog */}
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share List</DialogTitle>
                <DialogDescription>
                  Enter the username of the person you want to share this list with.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleShareList} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="is-owner"
                    type="checkbox"
                    className="h-4 w-4 border-neutral-300 rounded text-primary-600 focus:ring-primary-500"
                    checked={shareAsOwner}
                    onChange={(e) => setShareAsOwner(e.target.checked)}
                  />
                  <label htmlFor="is-owner" className="text-sm text-neutral-700">
                    Make this user an owner (can edit and delete the list)
                  </label>
                </div>
                
                <Button type="submit" className="w-full" disabled={shareListMutation.isPending}>
                  {shareListMutation.isPending ? "Sharing..." : "Share List"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete List Confirmation */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the list "{list.title}" and remove it for all collaborators. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteList} className="bg-red-600 hover:bg-red-700">
                  {deleteListMutation.isPending ? "Deleting..." : "Delete List"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">List not found</h2>
          <p className="text-neutral-600 mb-6">The list you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate("/lists")}>
            Go back to Lists
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
