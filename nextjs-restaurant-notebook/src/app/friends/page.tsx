import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function FriendsPage() {
  const user = await requireUser();

  return (
    <AppLayout>
      <PageHeader 
        title="Friends" 
        description="Manage your friends and connections"
        actions={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        }
      />
      
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Friend Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>No friends yet</CardTitle>
                <CardDescription>
                  Add friends to share restaurant lists
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-neutral-500">
                  You haven't added any friends yet. Click the button above to add your first friend.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="requests">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>No friend requests</CardTitle>
                <CardDescription>
                  You don't have any pending friend requests
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-neutral-500">
                  When someone sends you a friend request, it will appear here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}