import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Link } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { RestaurantWithLists, VisitWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  PlusCircle, 
  Calendar, 
  Sparkles,
  ExternalLink
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import VisitForm from "@/components/visits/visit-form-new";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const restaurantId = parseInt(id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("details");
  const [isAddVisitDialogOpen, setIsAddVisitDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<number | null>(null);

  // Fetch restaurant details
  const { data: restaurant, isLoading } = useQuery<RestaurantWithLists>({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !isNaN(restaurantId),
  });

  // Fetch visits
  const { data: visits, isLoading: visitsLoading } = useQuery<VisitWithDetails[]>({
    queryKey: [`/api/restaurants/${restaurantId}/visits`],
    enabled: !isNaN(restaurantId),
  });

  // AI summary mutation
  const summaryMutation = useMutation({
    mutationFn: async (visitId: number) => {
      setSelectedVisit(visitId);
      const response = await apiRequest("POST", `/api/visits/${visitId}/summarize`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notes summarized",
        description: "AI has summarized your notes for this visit.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/visits`] });
      setSelectedVisit(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to summarize notes",
        description: error.message,
        variant: "destructive",
      });
      setSelectedVisit(null);
    },
  });

  // Generate AI summary for a visit
  const handleGenerateSummary = (visitId: number) => {
    summaryMutation.mutate(visitId);
  };

  // Placeholder image for restaurants without photos
  const defaultImage = "https://images.unsplash.com/photo-1502301103665-0b95cc738daf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&h=400&q=80";

  return (
    <AppLayout>
      {/* Main content with bottom padding to ensure everything is visible when scrolling */}
      <div className="pb-28">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/restaurants")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Restaurants
          </Button>
        </div>
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-6" />
          <Skeleton className="h-60 w-full mb-6 rounded-xl" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
        </>
      ) : restaurant ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center text-neutral-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{restaurant.address || "Address not available"}</span>
              </div>
              
              {restaurant.cuisine && (
                <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
                  {restaurant.cuisine}
                </Badge>
              )}
              
              {restaurant.priceLevel && (
                <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
                  {restaurant.priceLevel}
                </Badge>
              )}
              
              {restaurant.rating && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-amber-400 fill-current mr-1" />
                  <span className="text-sm font-medium">{restaurant.rating}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-200 h-60 md:h-72 w-full rounded-xl overflow-hidden mb-6">
            <img 
              src={restaurant.photoUrl || defaultImage} 
              alt={restaurant.name} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">In Lists</h2>
            <div className="flex flex-wrap gap-2">
              {restaurant.lists?.map((list, index) => (
                <Badge 
                  key={`${list.listId}-${index}`} 
                  variant="outline"
                  className="px-3 py-1 bg-white"
                >
                  <Link href={`/lists/${list.listId}`} className="hover:underline">
                    {list.listTitle}
                  </Link>
                </Badge>
              ))}
              
              {(!restaurant.lists || restaurant.lists.length === 0) && (
                <p className="text-neutral-500 text-sm">Not added to any lists yet</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex-grow mr-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="visits">
                    Visits ({visits?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button onClick={() => setIsAddVisitDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Log Visit
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Information</CardTitle>
                  <CardDescription>Details about {restaurant.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700">Address</h3>
                    <p className="text-neutral-600">{restaurant.address || "No address available"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700">Cuisine</h3>
                    <p className="text-neutral-600">{restaurant.cuisine || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700">Price Level</h3>
                    <p className="text-neutral-600">{restaurant.priceLevel || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-700">Rating</h3>
                    <div className="flex items-center">
                      {restaurant.rating ? (
                        <>
                          <Star className="h-4 w-4 text-amber-400 fill-current mr-1" />
                          <span>{restaurant.rating}</span>
                        </>
                      ) : (
                        <span className="text-neutral-600">Not rated</span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name || '')}&query_place_id=${restaurant.placeId}`, 
                      '_blank'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="visits">
              {visitsLoading ? (
                <>
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-40 w-full" />
                </>
              ) : visits && visits.length > 0 ? (
                <div className="space-y-6">
                  {visits.map((visit) => (
                    <Card 
                      key={visit.id} 
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/visits/${visit.id}`)}
                    >
                      <CardHeader className="bg-neutral-50 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              Visit on {format(new Date(visit.date), "MMMM d, yyyy")}
                              {visit.occasion && <span className="ml-2 text-sm font-normal text-neutral-500">• {visit.occasion}</span>}
                            </CardTitle>
                            <CardDescription>
                              {visit.collaborators.length > 0 ? (
                                <div className="flex items-center mt-1">
                                  <span className="text-xs mr-2">With:</span>
                                  <div className="flex -space-x-2">
                                    {visit.collaborators.map((collab, index) => (
                                      <Avatar key={`${collab.userId}-${index}`} className="h-6 w-6 border-2 border-white">
                                        <AvatarImage src={collab.avatar} alt={collab.name} />
                                        <AvatarFallback className="bg-neutral-300 text-xs">
                                          {collab.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </CardDescription>
                          </div>
                          
                          {!visit.summary && visit.notes.length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent navigation to visit details
                                handleGenerateSummary(visit.id);
                              }}
                              disabled={summaryMutation.isPending && selectedVisit === visit.id}
                            >
                              {summaryMutation.isPending && selectedVisit === visit.id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin mr-1">
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
                                  Generating...
                                </div>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  Summarize Notes
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        {visit.summary && (
                          <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
                            <div className="flex items-center mb-2">
                              <Sparkles className="h-4 w-4 text-primary-500 mr-1" />
                              <h4 className="text-sm font-medium text-primary-700">AI Summary</h4>
                            </div>
                            <p className="text-sm text-neutral-700">{visit.summary}</p>
                          </div>
                        )}
                        
                        {visit.notes.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-neutral-700">Notes</h4>
                            {visit.notes.map((note) => (
                              <div key={note.id} className="flex">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarImage src={note.user.avatar} alt={note.user.name} />
                                  <AvatarFallback className="bg-neutral-300 text-xs">
                                    {note.user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-1">
                                    <h5 className="text-sm font-medium">{note.user.name}</h5>
                                    <span className="text-xs text-neutral-500">
                                      {format(new Date(note.createdAt), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-neutral-700">{note.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">No notes added for this visit.</p>
                        )}

                        {visit.photos && visit.photos.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-neutral-700 mb-2">Photos</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {visit.photos.map((photo) => (
                                <div key={photo.id} className="h-24 bg-neutral-100 rounded-md overflow-hidden">
                                  <img 
                                    src={photo.url} 
                                    alt="Visit" 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">No Visits Yet</h3>
                  <p className="text-neutral-600 mb-4">You haven't logged any visits to this restaurant.</p>
                  <Button onClick={() => setIsAddVisitDialogOpen(true)}>
                    Log Your First Visit
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Add Visit Dialog */}
          <Dialog open={isAddVisitDialogOpen} onOpenChange={setIsAddVisitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a Visit to {restaurant.name}</DialogTitle>
                <DialogDescription>
                  Record details about your visit to this restaurant.
                </DialogDescription>
              </DialogHeader>
              <VisitForm 
                restaurantId={restaurantId} 
                onSuccess={() => setIsAddVisitDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Restaurant not found</h2>
          <p className="text-neutral-600 mb-6">The restaurant you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate("/restaurants")}>
            Go back to Restaurants
          </Button>
        </div>
      )}
      </div>
    </AppLayout>
  );
}