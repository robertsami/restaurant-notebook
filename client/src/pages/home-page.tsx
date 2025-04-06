import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import StatCard from "@/components/dashboard/stat-card";
import ListCard from "@/components/dashboard/list-card";
import RestaurantCard from "@/components/dashboard/restaurant-card";
import ActivityItem from "@/components/dashboard/activity-item";
import AiSuggestion from "@/components/dashboard/ai-suggestion";
import { useAuth } from "@/hooks/use-auth";
import { ListWithDetails, RestaurantWithLists, ActivityWithDetails } from "@shared/schema";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HandPlatter, ListChecks, CalendarCheck, Users, Bot } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 60000, // 1 minute
  });

  // Fetch recent lists
  const { data: lists, isLoading: listsLoading } = useQuery<ListWithDetails[]>({
    queryKey: ["/api/lists"],
    staleTime: 60000, // 1 minute
  });

  // Fetch recent restaurants
  const { data: restaurants, isLoading: restaurantsLoading } = useQuery<RestaurantWithLists[]>({
    queryKey: ["/api/restaurants"],
    staleTime: 60000, // 1 minute
  });

  // Fetch activity feed
  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityWithDetails[]>({
    queryKey: ["/api/activity"],
    staleTime: 30000, // 30 seconds
  });

  return (
    <AppLayout>
      {/* Welcome/Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="mt-2 text-neutral-600">Discover and organize your culinary adventures.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatCard 
              title="Total Lists" 
              value={stats?.totalLists || 0} 
              icon={<ListChecks />} 
              color="primary"
            />
            <StatCard 
              title="Restaurants" 
              value={stats?.totalRestaurants || 0} 
              icon={<HandPlatter />} 
              color="orange"
            />
            <StatCard 
              title="Visits" 
              value={stats?.totalVisits || 0} 
              icon={<CalendarCheck />} 
              color="yellow"
            />
            <StatCard 
              title="Collaborators" 
              value={stats?.totalCollaborators || 0} 
              icon={<Users />} 
              color="mint"
            />
          </>
        )}
      </div>

      {/* Recent Lists Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold text-neutral-900">Recent Lists</h2>
          <Link href="/lists">
            <a className="text-sm font-medium text-primary-600 hover:text-primary-700">View all lists</a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listsLoading ? (
            <>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : lists && lists.length > 0 ? (
            lists.slice(0, 3).map((list) => (
              <ListCard key={list.id} list={list} />
            ))
          ) : (
            <div className="col-span-full bg-white p-6 rounded-xl shadow-card text-center">
              <p className="text-neutral-600 mb-4">You haven't created any lists yet.</p>
              <Link href="/lists">
                <Button>Create Your First List</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Restaurants & Activity Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Restaurants */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-900">Recent Restaurants</h2>
            <Link href="/restaurants">
              <a className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</a>
            </Link>
          </div>

          <div className="space-y-4">
            {restaurantsLoading ? (
              <>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </>
            ) : restaurants && restaurants.length > 0 ? (
              restaurants.slice(0, 3).map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-card text-center">
                <p className="text-neutral-600 mb-4">No restaurants added yet.</p>
                <Link href="/restaurants">
                  <Button>Add Your First HandPlatter</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-neutral-900">Activity</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="space-y-4">
              {activitiesLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : activities && activities.length > 0 ? (
                activities.slice(0, 4).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="text-center py-4 text-neutral-500">No recent activity</p>
              )}
            </div>
            
            <Link href="/activity">
              <Button variant="outline" className="mt-4 w-full">
                View all activity
              </Button>
            </Link>
          </div>

          {/* AI Suggestions Widget */}
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-card p-4 border border-primary-100">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="ml-2 font-heading font-semibold text-neutral-900">AI Suggestions</h3>
              </div>
              <p className="text-sm text-neutral-600 mb-4">Based on your visits, you might enjoy these restaurants:</p>
              
              <div className="space-y-3">
                <AiSuggestion 
                  name="Pasta Paradise"
                  cuisine="Italian"
                  rating="4.6"
                  reason="Similar to your liked Italian restaurants"
                />
                <AiSuggestion 
                  name="Fresh Greens"
                  cuisine="Vegan"
                  rating="4.4"
                  reason="Based on your interest in healthy options"
                />
              </div>
              
              <Link href="/ai-suggestions">
                <Button variant="outline" className="mt-3 w-full">
                  Get more suggestions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
