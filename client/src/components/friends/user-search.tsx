import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type User = {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
};

export function UserSearch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { data: searchResults = [], isLoading: isSearching } = useQuery<User[]>({
    queryKey: ["/api/users/search", query],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
    enabled: query.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", "/api/friends/request", { userId });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: selectedUser ? `Request sent to ${selectedUser.name}` : "Request sent",
      });
      setSelectedUser(null);
      setQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length < 2) {
      setSelectedUser(null);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setQuery("");
  };

  const handleSendRequest = () => {
    if (selectedUser) {
      sendRequestMutation.mutate(selectedUser.id);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Input
          placeholder="Search for users to add as friends..."
          value={query}
          onChange={handleSearchChange}
          className="w-full"
        />
        {query.length >= 2 && searchResults.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-64 overflow-auto">
            <CardContent className="p-1">
              {isSearching ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ul>
                  {searchResults.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-2 hover:bg-muted rounded-md cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedUser && (
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name} />
              <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{selectedUser.name}</div>
              <div className="text-xs text-muted-foreground">@{selectedUser.username}</div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSendRequest}
            disabled={sendRequestMutation.isPending}
            className={cn(
              "text-primary-foreground",
              sendRequestMutation.isPending && "opacity-70"
            )}
          >
            {sendRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Send Friend Request
          </Button>
        </div>
      )}
    </div>
  );
}