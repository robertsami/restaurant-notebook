import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { RestaurantHeader } from "@/components/restaurant-header"
import { VisitList } from "@/components/visit-list"
import { AddVisitButton } from "@/components/add-visit-button"
import { ensureAuth } from "@/lib/utils/session"

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const session = ensureAuth(await auth())

  const restaurant = await db.restaurant.findUnique({
    where: {
      id: params.id,
      lists: {
        some: {
          list: {
            owners: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    },
    include: {
      visits: {
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  })

  if (!restaurant) {
    notFound()
  }

  return (
    <div>
      <RestaurantHeader restaurant={restaurant} />

      <div className="flex justify-end mb-6">
        <AddVisitButton restaurantId={restaurant.id} userId={session.user.id} />
      </div>

      <VisitList visits={restaurant.visits} />
    </div>
  )
}
