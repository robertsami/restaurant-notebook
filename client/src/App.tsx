import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import RestaurantsPage from "@/pages/restaurants-page";
import ListsPage from "@/pages/lists-page";
import ListDetailPage from "@/pages/list-detail-page";
import RestaurantDetailPage from "@/pages/restaurant-detail-page";
import VisitDetailPage from "@/pages/visit-detail-page";
import SharedListsPage from "@/pages/shared-lists-page";
import AiSuggestionsPage from "@/pages/ai-suggestions-page";
import FriendsPage from "@/pages/friends-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/restaurants" component={RestaurantsPage} />
      <ProtectedRoute path="/lists" component={ListsPage} />
      <ProtectedRoute path="/lists/:id" component={ListDetailPage} />
      <ProtectedRoute path="/restaurants/:id" component={RestaurantDetailPage} />
      <ProtectedRoute path="/visits/:visitId" component={VisitDetailPage} />
      <ProtectedRoute path="/shared" component={SharedListsPage} />
      <ProtectedRoute path="/friends" component={FriendsPage} />
      <ProtectedRoute path="/ai-suggestions" component={AiSuggestionsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
