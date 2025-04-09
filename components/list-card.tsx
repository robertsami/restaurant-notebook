import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

type ListCardProps = {
  list: {
    id: string
    name: string
    description: string
    coverImage?: string
    updatedAt: Date
    _count: {
      restaurants: number
    }
    owners: {
      user: {
        id: string
        name: string
        image: string
      }
    }[]
  }
}

export function ListCard({ list }: ListCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/lists/${list.id}`}>
        <div className="aspect-video relative">
          <Image
            src={list.coverImage || "/placeholder.svg?height=200&width=400"}
            alt={list.name}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <h3 className="text-lg font-semibold">{list.name}</h3>
          {list.description && <p className="text-sm text-muted-foreground line-clamp-2">{list.description}</p>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {list._count.restaurants} {list._count.restaurants === 1 ? "restaurant" : "restaurants"}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between">
        <div className="flex -space-x-2">
          {list.owners.slice(0, 3).map((owner) => (
            <Avatar key={owner.user.id} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={owner.user.image} alt={owner.user.name || ""} />
              <AvatarFallback>{owner.user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          ))}
          {list.owners.length > 3 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
              +{list.owners.length - 3}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(list.updatedAt), { addSuffix: true })}
        </p>
      </CardFooter>
    </Card>
  )
}
