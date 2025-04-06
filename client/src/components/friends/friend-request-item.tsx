import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FriendWithDetails } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FriendRequestItemProps {
  friend: FriendWithDetails;
}

export function FriendRequestItem({ friend }: FriendRequestItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      return await apiRequest("POST", "/api/friends/accept", { userId: friend.id });
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: `You are now friends with ${friend.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error accepting friend request",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      return await apiRequest("POST", "/api/friends/reject", { userId: friend.id });
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting friend request",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  return (
    <Card className="mb-2">
      <CardContent className="flex items-center p-4">
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={friend.avatar} alt={friend.name} />
          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium">{friend.name}</div>
          <div className="text-sm text-muted-foreground">@{friend.username}</div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-500 border-green-500 hover:bg-green-500/10"
            onClick={() => acceptMutation.mutate()}
            disabled={isLoading}
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 border-red-500 hover:bg-red-500/10"
            onClick={() => rejectMutation.mutate()}
            disabled={isLoading}
          >
            <XIcon className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}