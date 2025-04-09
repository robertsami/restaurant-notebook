"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Plus } from "lucide-react"
import { getPlacePhoto } from "@/lib/google-places"

type RestaurantSearchResultsProps = {
  results: any[]
  onSelect: (placeId: string) => void
  isLoading: boolean
}

export function RestaurantSearchResults({ results, onSelect, isLoading }: RestaurantSearchResultsProps) {
  if (results.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">Search for restaurants to add to your list</div>
  }

  return (
    <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
      {results.map((result) => (
        <div key={result.place_id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted">
          <div className="relative h-16 w-16 overflow-hidden rounded-md">
            <Image
              src={
                result.photos?.[0]?.photo_reference
                  ? getPlacePhoto(result.photos[0].photo_reference)
                  : "/placeholder.svg?height=64&width=64"
              }
              alt={result.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <h3 className="font-medium">{result.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="truncate">{result.formatted_address}</span>
            </div>

            <div className="mt-1 flex items-center">
              {result.rating && (
                <div className="flex items-center mr-3">
                  <span className="text-sm font-medium">{result.rating}</span>
                  <span className="ml-1 text-yellow-500">★</span>
                </div>
              )}

              {result.price_level && (
                <div className="text-sm text-muted-foreground">{"$".repeat(result.price_level)}</div>
              )}
            </div>
          </div>

          <Button size="sm" onClick={() => onSelect(result.place_id)} disabled={isLoading}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
