"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Trash, Users } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type ListHeaderProps = {
  list: {
    id: string
    name: string
    description: string
    coverImage?: string | null
    owners: {
      user: {
        id: string
        name: string | null
        image: string | null
      }
    }[]
  }
}

export function ListHeader({ list }: ListHeaderProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function deleteList() {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/lists/${list.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete list")
      }

      toast({
        title: "List deleted",
        description: "Your restaurant list has been deleted successfully.",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Something went wrong",
        description: "Failed to delete your list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        {list.coverImage && (
          <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
            <Image src={list.coverImage || "/placeholder.svg"} alt={list.name} fill className="object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{list.name}</h1>
            {list.description && <p className="mt-2 text-muted-foreground">{list.description}</p>}

            <div className="mt-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {list.owners.map((owner) => (
                  <Avatar key={owner.user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={owner.user.image || undefined} alt={owner.user.name || ""} />
                    <AvatarFallback>{owner.user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {list.owners.length} {list.owners.length === 1 ? "owner" : "owners"}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteList} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
