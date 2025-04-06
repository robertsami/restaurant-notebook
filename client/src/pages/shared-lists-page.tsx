import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import ListCard from "@/components/dashboard/list-card";
import { ListWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/common/search-input";
import { Users } from "lucide-react";

export default function SharedListsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch shared lists
  const { data: lists, isLoading } = useQuery<ListWithDetails[]>({
    queryKey: ["/api/lists/shared"],
  });

  // Filter lists based on search term
  const filteredLists = lists?.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">Shared with me</h1>
        <p className="mt-1 text-neutral-600">Lists that others have shared with you</p>
      </div>

      <div className="mb-6">
        <SearchInput 
          placeholder="Search shared lists" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filteredLists && filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No shared lists found</h3>
          <p className="text-neutral-600">
            {searchTerm 
              ? "No shared lists match your search criteria." 
              : "No one has shared any lists with you yet. When someone shares a list with you, it will appear here."}
          </p>
        </div>
      )}
    </AppLayout>
  );
}
