import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import ListCard from "@/components/dashboard/list-card";
import { ListWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/common/search-input";
import { PlusCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import ListForm from "@/components/lists/list-form";

export default function ListsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);

  // Fetch all lists
  const { data: lists, isLoading } = useQuery<ListWithDetails[]>({
    queryKey: ["/api/lists"],
  });

  // Filter lists based on search term
  const filteredLists = lists?.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-900">My Lists</h1>
          <p className="mt-1 text-neutral-600">Organize restaurants into custom lists</p>
        </div>

        <Dialog open={isAddListDialogOpen} onOpenChange={setIsAddListDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New List</DialogTitle>
              <DialogDescription>
                Create a new list to organize your restaurants.
              </DialogDescription>
            </DialogHeader>
            <ListForm onSuccess={() => setIsAddListDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <SearchInput 
          placeholder="Search lists by name or description" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </>
        ) : filteredLists && filteredLists.length > 0 ? (
          filteredLists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))
        ) : filteredLists && filteredLists.length === 0 ? (
          <div className="col-span-full bg-white p-6 rounded-xl shadow-card text-center">
            <p className="text-neutral-600 mb-4">
              {searchTerm ? "No lists match your search" : "You haven't created any lists yet"}
            </p>
            <Button onClick={() => setIsAddListDialogOpen(true)}>
              Create Your First List
            </Button>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
