import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { FriendWithDetails } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FriendItem } from "./friend-item";
import { FriendRequestItem } from "./friend-request-item";
import { UserSearch } from "./user-search";
import { Loader2 } from "lucide-react";

export function FriendsSection() {
  const [activeTab, setActiveTab] = useState("friends");

  const {
    data: friends = [],
    isLoading: isFriendsLoading,
    isError: isFriendsError,
  } = useQuery<FriendWithDetails[]>({
    queryKey: ["/api/friends"],
    queryFn: getQueryFn<FriendWithDetails[]>({ on401: "throw" }),
  });

  const {
    data: friendRequests = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
  } = useQuery<FriendWithDetails[]>({
    queryKey: ["/api/friends/requests"],
    queryFn: getQueryFn<FriendWithDetails[]>({ on401: "throw" }),
  });

  const hasRequests = friendRequests.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
          <CardDescription>
            Manage your friends and friend requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="friends">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="relative">
                Requests
                {hasRequests && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {friendRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="add">Add New</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {isFriendsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : isFriendsError ? (
                <p className="text-center text-destructive py-4">
                  Error loading friends
                </p>
              ) : friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  You don't have any friends yet. Add some!
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <FriendItem key={friend.id} friend={friend} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {isRequestsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : isRequestsError ? (
                <p className="text-center text-destructive py-4">
                  Error loading friend requests
                </p>
              ) : friendRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  You don't have any friend requests
                </p>
              ) : (
                <div className="space-y-2">
                  {friendRequests.map((request) => (
                    <FriendRequestItem key={request.id} friend={request} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <UserSearch />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}