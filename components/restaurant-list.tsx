"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, MapPin } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { EmptyState } from "@/components/empty-state"

type RestaurantListProps = {
  listId: string
  restaurants: {
    id: string
    order: number
    restaurant: {
      id: string
      name: string
      address: string
      photos: string[]
      rating?: number
      priceLevel?: number
    }
  }[]
}

export function RestaurantList({ listId, restaurants: initialRestaurants }: RestaurantListProps) {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState(initialRestaurants)

  async function handleDragEnd(result: any) {
    if (!result.destination) return

    const items = Array.from(restaurants)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    setRestaurants(updatedItems)

    try {
      const response = await fetch(`/api/lists/${listId}/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: updatedItems.map((item) => ({
            id: item.id,
            order: item.order,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reorder restaurants")
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Something went wrong",
        description: "Failed to reorder restaurants. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (restaurants.length === 0) {
    return <EmptyState title="No restaurants yet" description="Add your first restaurant to this list" />
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="restaurants">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {restaurants.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} className="relative">
                    <Card>
                      <CardContent className="p-0">
                        <div className="flex items-center">
                          <div
                            {...provided.dragHandleProps}
                            className="flex h-full items-center justify-center px-2 text-muted-foreground"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <Link href={`/restaurants/${item.restaurant.id}`} className="flex flex-1 items-center p-4">
                            <div className="relative h-16 w-16 overflow-hidden rounded-md mr-4">
                              <Image
                                src={item.restaurant.photos[0] || "/placeholder.svg?height=64&width=64"}
                                alt={item.restaurant.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1">
                              <h3 className="font-medium">{item.restaurant.name}</h3>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="mr-1 h-3 w-3" />
                                <span className="truncate">{item.restaurant.address}</span>
                              </div>

                              <div className="mt-1 flex items-center">
                                {item.restaurant.rating && (
                                  <div className="flex items-center mr-3">
                                    <span className="text-sm font-medium">{item.restaurant.rating}</span>
                                    <span className="ml-1 text-yellow-500">★</span>
                                  </div>
                                )}

                                {item.restaurant.priceLevel && (
                                  <div className="text-sm text-muted-foreground">
                                    {"$".repeat(item.restaurant.priceLevel)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
