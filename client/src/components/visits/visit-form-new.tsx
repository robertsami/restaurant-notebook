import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Extend the visit schema
const visitFormSchema = z.object({
  date: z.date(),
  occasion: z.string().optional(),
  collaboratorIds: z.array(z.number()).default([]),
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

  // Form setup
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      date: new Date(),
      occasion: '',
      collaboratorIds: [],
    },
  });

  // Get friends query
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/friends');
      return await response.json();
    }
  });

  // Toggle friend selection
  const toggleFriendSelection = (friendId: number) => {
    // Use form.getValues() to get current value without triggering re-renders
    const currentValues = form.getValues().collaboratorIds || [];
    const isSelected = currentValues.includes(friendId);
    
    // Update form value based on selection state
    if (isSelected) {
      // Remove friend
      const newValue = currentValues.filter(id => id !== friendId);
      form.setValue('collaboratorIds', newValue);
    } else {
      // Add friend
      form.setValue('collaboratorIds', [...currentValues, friendId]);
    }
  };

  // Create visit mutation
  const createVisitMutation = useMutation({
    mutationFn: async (data: VisitFormValues) => {
      // Create the visit
      const visitResponse = await apiRequest("POST", `/api/restaurants/${restaurantId}/visits`, {
        date: data.date.toISOString(),
        occasion: data.occasion,
        collaboratorIds: data.collaboratorIds || [],
      });
      return await visitResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Visit logged",
        description: "Your visit has been successfully recorded.",
      });
      
      // Reset form
      form.reset();
      
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
          render={({ field }) => (
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
                      // Get selection status from field.value (reactive) instead of getValues (non-reactive)
                      // This ensures the UI updates properly when selections change
                      const isSelected = field.value?.includes(friend.id) || false;
                      
                      return (
                        <div 
                          key={friend.id}
                          className={cn(
                            "flex items-center gap-2 rounded-md border p-2 cursor-pointer",
                            isSelected ? "bg-primary-50 border-primary-200" : "hover:bg-neutral-50"
                          )}
                          onClick={() => toggleFriendSelection(friend.id)}
                        >
                          <div className="flex-shrink-0">
                            {/* Use a custom checkbox that doesn't trigger re-renders */}
                            <div className={cn(
                              "h-4 w-4 rounded-sm border flex items-center justify-center",
                              isSelected ? "bg-primary border-primary" : "border-neutral-300"
                            )}>
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                  className="h-3 w-3 text-white">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
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