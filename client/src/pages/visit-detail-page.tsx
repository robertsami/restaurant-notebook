import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Loader2, SendHorizontal, Camera, Star, CalendarDays, Tag, Users, MapPin, Store } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Note, Photo } from "@shared/schema";
import { Link } from "wouter";

interface AddNoteFormData {
  content: string;
}

interface PhotoUploadFormData {
  photo: FileList;
}

export default function VisitDetailPage() {
  const { visitId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch visit details
  const { data: visit, isLoading, isError } = useQuery({
    queryKey: [`/api/visits/${visitId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/visits/${visitId}`);
      return await response.json();
    },
  });

  // Note form
  const noteForm = useForm<AddNoteFormData>({
    defaultValues: {
      content: "",
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (data: AddNoteFormData) => {
      const response = await apiRequest("POST", `/api/visits/${visitId}/notes`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note added",
        description: "Your note has been added to the visit.",
      });
      noteForm.reset();
      queryClient.invalidateQueries({
        queryKey: [`/api/visits/${visitId}`],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate AI summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/visits/${visitId}/summarize`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Summary generated",
        description: "AI summary has been generated for this visit.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/visits/${visitId}`],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate summary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Photo form
  const photoForm = useForm<PhotoUploadFormData>();

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: PhotoUploadFormData) => {
      const formData = new FormData();
      formData.append("photo", data.photo[0]);
      
      const response = await fetch(`/api/visits/${visitId}/photos`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photo");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo uploaded",
        description: "Your photo has been added to the visit.",
      });
      photoForm.reset();
      queryClient.invalidateQueries({
        queryKey: [`/api/visits/${visitId}`],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitNote = noteForm.handleSubmit((data) => {
    addNoteMutation.mutate(data);
  });

  const onSubmitPhoto = photoForm.handleSubmit((data) => {
    uploadPhotoMutation.mutate(data);
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container py-6 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading visit details...</p>
      </div>
    );
  }

  // Handle error state
  if (isError || !visit) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-semibold">Visit not found</h2>
          <p className="text-muted-foreground mt-2">
            The visit you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/restaurants">Back to Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Sort notes by creation date (newest first)
  const sortedNotes = [...visit.notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container py-6">
      <PageHeader 
        title={`Visit to ${visit.restaurant?.name || "Restaurant"}`}
        description={visit.date ? format(new Date(visit.date), "MMMM d, yyyy") : ""}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          {/* Visit Summary */}
          {visit.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>AI-generated summary based on your notes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{visit.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  Share your thoughts and memories about this visit
                </CardDescription>
              </div>
              {sortedNotes.length > 0 && !visit.summary && (
                <Button
                  size="sm"
                  onClick={() => generateSummaryMutation.mutate()}
                  disabled={generateSummaryMutation.isPending}
                >
                  {generateSummaryMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Summary
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No notes yet. Be the first to add one!</p>
                </div>
              ) : (
                sortedNotes.map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      {note.user?.avatar && (
                        <AvatarImage src={note.user.avatar} alt={note.user.name} />
                      )}
                      <AvatarFallback>
                        {note.user?.name.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {note.user?.name || "Unknown User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-1">{note.content}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <form onSubmit={onSubmitNote} className="w-full space-y-2">
                <Textarea
                  placeholder="Write a note about this visit..."
                  {...noteForm.register("content", { required: true })}
                  disabled={addNoteMutation.isPending}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <SendHorizontal className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>

          {/* Photos section */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Share photos from your visit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visit.photos && visit.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visit.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden">
                      <img
                        src={photo.url}
                        alt={`Photo from visit to ${visit.restaurant?.name || "restaurant"}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No photos yet. Add some to remember this visit!</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <form onSubmit={onSubmitPhoto} className="w-full">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="photo"
                    className="hidden"
                    accept="image/*"
                    {...photoForm.register("photo", { required: true })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("photo")?.click()}
                    disabled={uploadPhotoMutation.isPending}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Select Photo
                  </Button>
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {photoForm.watch("photo")?.[0]?.name || "No file selected"}
                  </span>
                  <Button
                    type="submit"
                    disabled={
                      !photoForm.watch("photo")?.[0] || uploadPhotoMutation.isPending
                    }
                  >
                    {uploadPhotoMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Upload
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>

        {/* Visit details sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(visit.date), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              
              {visit.occasion && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{visit.occasion}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <Link href={`/restaurants/${visit.restaurantId}`} className="font-medium hover:underline">
                  {visit.restaurant?.name || "Restaurant"}
                </Link>
              </div>
              
              {visit.restaurant?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{visit.restaurant.address}</span>
                </div>
              )}
              
              {visit.restaurant?.rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>{visit.restaurant.rating} stars</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collaborators */}
          <Card>
            <CardHeader>
              <CardTitle>Who Was There</CardTitle>
              <CardDescription>People who joined this visit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visit.collaborators && visit.collaborators.length > 0 ? (
                  visit.collaborators.map((person) => (
                    <div key={person.userId} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {person.avatar && (
                          <AvatarImage src={person.avatar} alt={person.name} />
                        )}
                        <AvatarFallback>
                          {person.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{person.name}</span>
                      {person.userId === user?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No collaborators added</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}