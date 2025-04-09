"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { searchPlaces, getPlaceDetails } from "@/lib/google-places"
import { RestaurantSearchResults } from "@/components/restaurant-search-results"

type AddRestaurantButtonProps = {
  listId: string
}

export function AddRestaurantButton({ listId }: AddRestaurantButtonProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      const results = await searchPlaces(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error(error)
      toast({
        title: "Search failed",
        description: "Failed to search for restaurants. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  async function addRestaurant(placeId: string) {
    try {
      setIsAdding(true)

      const placeDetails = await getPlaceDetails(placeId)

      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId,
          placeId,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          phone: placeDetails.formatted_phone_number,
          website: placeDetails.website,
          photos: placeDetails.photos?.map((photo: any) => photo.photo_reference) || [],
          priceLevel: placeDetails.price_level,
          rating: placeDetails.rating,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add restaurant")
      }

      toast({
        title: "Restaurant added",
        description: "The restaurant has been added to your list.",
      })

      setIsDialogOpen(false)
      setSearchQuery("")
      setSearchResults([])
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Something went wrong",
        description: "Failed to add restaurant. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Restaurant
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Restaurant</DialogTitle>
            <DialogDescription>Search for a restaurant to add to your list.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search restaurants..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>

          <RestaurantSearchResults results={searchResults} onSelect={addRestaurant} isLoading={isAdding} />
        </DialogContent>
      </Dialog>
    </>
  )
}
