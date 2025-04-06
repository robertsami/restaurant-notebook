import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FriendWithDetails } from "@shared/schema";

interface FriendItemProps {
  friend: FriendWithDetails;
}

export function FriendItem({ friend }: FriendItemProps) {
  return (
    <Card className="mb-2">
      <CardContent className="flex items-center p-4">
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={friend.avatar} alt={friend.name} />
          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{friend.name}</div>
          <div className="text-sm text-muted-foreground">@{friend.username}</div>
        </div>
      </CardContent>
    </Card>
  );
}