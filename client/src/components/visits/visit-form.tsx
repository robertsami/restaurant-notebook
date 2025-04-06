import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertVisitSchema, insertNoteSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Image, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

// Extend the visit schema
const visitFormSchema = z.object({
  date: z.date(),
  occasion: z.string().optional(),
  notes: z.string().min(1, "Please add some notes about your visit"),
  photoFile: z.instanceof(File).optional(),
  collaboratorIds: z.array(z.number()).optional(),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

interface VisitFormProps {
  restaurantId: number;
  onSuccess?: () => void;
}

interface Friend {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  status: string; 
}

export default function VisitForm({ restaurantId, onSuccess }: VisitFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Fetch friends
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/friends');
      return await response.json();
    }
  });

  // Form definition
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      date: new Date(),
      occasion: '',
      notes: "",
      collaboratorIds: [],
    },
  });
  
  // Watch collaboratorIds from the form state to use in our UI
  const collaboratorIds = form.watch('collaboratorIds') || [];

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected file
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      
      // Update form value
      form.setValue("photoFile", file);
    }
  };

  // Create visit mutation
  const createVisitMutation = useMutation({
    mutationFn: async (data: VisitFormValues) => {
      // First, create the visit
      const visitResponse = await apiRequest("POST", `/api/restaurants/${restaurantId}/visits`, {
        date: data.date.toISOString(), // Convert the Date object to ISO string format
        occasion: data.occasion,
        collaboratorIds: data.collaboratorIds || [],
      });
      const visit = await visitResponse.json();
      
      // Add the note to the visit
      const noteResponse = await apiRequest("POST", `/api/visits/${visit.id}/notes`, {
        content: data.notes,
      });
      
      // Upload photo if selected
      if (data.photoFile) {
        const formData = new FormData();
        formData.append("photo", data.photoFile);
        
        await fetch(`/api/visits/${visit.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }
      
      return visit;
    },
    onSuccess: () => {
      toast({
        title: "Visit logged",
        description: "Your visit has been successfully recorded.",
      });
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}`] });
      
      // Call success callback
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to log visit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: VisitFormValues) => {
    createVisitMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Visit Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When did you visit this restaurant?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="occasion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occasion</FormLabel>
              <FormControl>
                <Input
                  placeholder="Birthday dinner, Date night, Business lunch, etc."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                What was the occasion for this visit? (Optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="collaboratorIds"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-neutral-500" />
                Who was with you?
              </FormLabel>
              <div className="space-y-2">
                {isLoadingFriends ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="animate-spin h-5 w-5 text-neutral-400" />
                  </div>
                ) : friends.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {friends.filter(friend => friend.status === "accepted").map((friend) => {
                      const isSelected = collaboratorIds.includes(friend.id);
                      return (
                        <div 
                          key={friend.id}
                          className={cn(
                            "flex items-center gap-2 rounded-md border p-2 cursor-pointer",
                            isSelected ? "bg-primary-50 border-primary-200" : "hover:bg-neutral-50"
                          )}
                          onClick={() => {
                            // Create a new array by directly modifying the form value
                            if (isSelected) {
                              // Remove from selection
                              const newSelection = collaboratorIds.filter(id => id !== friend.id);
                              form.setValue('collaboratorIds', newSelection, { shouldDirty: true });
                            } else {
                              // Add to selection
                              const newSelection = [...collaboratorIds, friend.id];
                              form.setValue('collaboratorIds', newSelection, { shouldDirty: true });
                            }
                          }}
                        >
                          <div className="flex-shrink-0">
                            <Checkbox checked={isSelected} />
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={friend.avatar} />
                              <AvatarFallback className="text-xs">
                                {friend.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{friend.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 border rounded-md bg-neutral-50">
                    <p className="text-sm text-neutral-500">No friends found</p>
                    <p className="text-xs text-neutral-400">Add friends to include them in your visits</p>
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write about your experience, dishes you tried, what you liked or didn't like..." 
                  className="resize-none min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Share your thoughts about this restaurant visit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photoFile"
          render={() => (
            <FormItem>
              <FormLabel>Photos</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg p-6 cursor-pointer hover:bg-neutral-50">
                  <input
                    type="file"
                    accept="image/*"
                    id="photo-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {previewUrl ? (
                    <div className="space-y-2 w-full">
                      <div className="relative h-48 w-full rounded-md overflow-hidden">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          form.setValue("photoFile", undefined);
                        }}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="photo-upload" className="flex flex-col items-center space-y-2 cursor-pointer">
                      <div className="rounded-full bg-primary-50 p-3">
                        <Image className="h-6 w-6 text-primary-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-900">
                          Click to upload a photo
                        </p>
                        <p className="text-xs text-neutral-500">
                          JPG, PNG or GIF up to 5MB
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={createVisitMutation.isPending}
        >
          {createVisitMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Visit...
            </>
          ) : (
            "Log This Visit"
          )}
        </Button>
      </form>
    </Form>
  );
}
