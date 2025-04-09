import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { RestaurantList } from "@/components/restaurant-list"
import { ListHeader } from "@/components/list-header"
import { AddRestaurantButton } from "@/components/add-restaurant-button"
import { ensureAuth } from "@/lib/utils/session"

export default async function ListPage({ params }: { params: { id: string } }) {
  const session = ensureAuth(await auth())

  const list = await db.list.findUnique({
    where: {
      id: params.id,
      owners: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      owners: {
        include: {
          user: true,
        },
      },
      restaurants: {
        include: {
          restaurant: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!list) {
    notFound()
  }

  return (
    <div>
      <ListHeader list={list} />

      <div className="flex justify-end mb-6">
        <AddRestaurantButton listId={list.id} />
      </div>

      <RestaurantList listId={list.id} restaurants={list.restaurants} />
    </div>
  )
}
