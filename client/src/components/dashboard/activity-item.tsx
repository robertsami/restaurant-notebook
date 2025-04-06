import { formatDistanceToNow } from "date-fns";
import { ActivityWithDetails } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface ActivityItemProps {
  activity: ActivityWithDetails;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const formattedDate = activity.createdAt 
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) 
    : 'recently';

  // Get activity message based on type
  const getActivityMessage = () => {
    switch (activity.type) {
      case 'visit_added':
        return (
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">{activity.user.name}</span> added a new visit to{' '}
            <span className="font-medium text-neutral-900">
              {(activity.data as any).restaurantName || 'a restaurant'}
            </span>
          </p>
        );
        
      case 'note_added':
        return (
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">{activity.user.name}</span> added a note to{' '}
            <span className="font-medium text-neutral-900">
              {(activity.data as any).restaurantName || 'a restaurant'}
            </span>
          </p>
        );
        
      case 'list_shared':
        return (
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">{activity.user.name}</span> shared{' '}
            <span className="font-medium text-neutral-900">
              {(activity.data as any).listTitle || 'a list'}
            </span> with you
          </p>
        );
        
      case 'ai_suggestion':
        return (
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">AI</span> suggested new restaurants based on your preferences
          </p>
        );
        
      case 'ai_summary':
        return (
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">AI</span> summarized your notes for{' '}
            <span className="font-medium text-neutral-900">
              {(activity.data as any).restaurantName || 'a restaurant visit'}
            </span>
          </p>
        );
        
      default:
        return (
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">{activity.user.name}</span> performed an action
          </p>
        );
    }
  };

  return (
    <div className="flex">
      {activity.type === 'ai_suggestion' || activity.type === 'ai_summary' ? (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-600" />
        </div>
      ) : (
        <Avatar className="h-10 w-10">
          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
          <AvatarFallback className="bg-neutral-300">
            {activity.user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="ml-3">
        {getActivityMessage()}
        <p className="text-xs text-neutral-500">{formattedDate}</p>
      </div>
    </div>
  );
}
