import Image from "next/image"
import { formatDistanceToNow, format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"

type VisitListProps = {
  visits: {
    id: string
    date: Date
    notes: string
    rating?: number
    photos: string[]
    participants: {
      user: {
        id: string
        name: string
        image: string
      }
    }[]
  }[]
}

export function VisitList({ visits }: VisitListProps) {
  if (visits.length === 0) {
    return <EmptyState title="No visits yet" description="Record your first visit to this restaurant" />
  }

  return (
    <div className="space-y-6">
      {visits.map((visit) => (
        <Card key={visit.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(visit.date), "MMMM d, yyyy")} ·{" "}
                  {formatDistanceToNow(new Date(visit.date), { addSuffix: true })}
                </div>
                {visit.rating && (
                  <div className="flex items-center mt-1">
                    <span className="font-medium">{visit.rating}</span>
                    <span className="ml-1 text-yellow-500">★</span>
                  </div>
                )}
              </div>

              <div className="flex -space-x-2">
                {visit.participants.map((participant) => (
                  <Avatar key={participant.user.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={participant.user.image} alt={participant.user.name || ""} />
                    <AvatarFallback>{participant.user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {visit.notes && <p className="mb-4">{visit.notes}</p>}

            {visit.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {visit.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`Visit photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
