import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertListSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Extend the list schema to add additional validation
const listFormSchema = insertListSchema.extend({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  coverImage: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

type ListFormValues = z.infer<typeof listFormSchema>;

interface ListFormProps {
  listId?: number;
  initialData?: Partial<ListFormValues>;
  onSuccess?: () => void;
}

export default function ListForm({ listId, initialData, onSuccess }: ListFormProps) {
  const { toast } = useToast();
  const isEditMode = !!listId;

  // Form definition
  const form = useForm<ListFormValues>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      coverImage: initialData?.coverImage || "",
    },
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async (data: ListFormValues) => {
      if (isEditMode) {
        const response = await apiRequest("PUT", `/api/lists/${listId}`, data);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/lists", data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "List updated" : "List created",
        description: isEditMode 
          ? "The list has been successfully updated." 
          : "The list has been successfully created.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}`] });
      }
      
      // Call success callback
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: isEditMode ? "Failed to update list" : "Failed to create list",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: ListFormValues) => {
    createListMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter list title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a description (optional)" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Briefly describe what this list is about
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/image.jpg (optional)" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Add a URL for the list cover image
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={createListMutation.isPending}
        >
          {createListMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              {isEditMode ? "Updating List..." : "Creating List..."}
            </>
          ) : (
            isEditMode ? "Update List" : "Create List"
          )}
        </Button>
      </form>
    </Form>
  );
}
