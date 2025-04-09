import Image from "next/image"
import { MapPin, Globe, Phone } from "lucide-react"

type RestaurantHeaderProps = {
  restaurant: {
    id: string
    name: string
    address: string
    phone?: string | null
    website?: string | null
    photos: string[]
    priceLevel?: number | null
    rating?: number | null
  }
}

export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  return (
    <div className="mb-8">
      <div className="relative h-64 w-full overflow-hidden rounded-lg mb-6">
        <Image
          src={restaurant.photos[0] || "/placeholder.svg?height=300&width=800"}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
      </div>

      <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>

      <div className="flex flex-col gap-2 text-muted-foreground mb-4">
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4" />
          <span>{restaurant.address}</span>
        </div>

        {restaurant.phone && (
          <div className="flex items-center">
            <Phone className="mr-2 h-4 w-4" />
            <span>{restaurant.phone}</span>
          </div>
        )}

        {restaurant.website && (
          <div className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {restaurant.website}
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {restaurant.rating && (
          <div className="flex items-center bg-muted px-3 py-1 rounded-full">
            <span className="font-medium">{restaurant.rating}</span>
            <span className="ml-1 text-yellow-500">★</span>
          </div>
        )}

        {restaurant.priceLevel && (
          <div className="bg-muted px-3 py-1 rounded-full">{"$".repeat(restaurant.priceLevel)}</div>
        )}
      </div>
    </div>
  )
}
