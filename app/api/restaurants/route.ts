import { auth } from "@/lib/auth"
import { ensureAuthApi } from "@/lib/utils/session"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const addRestaurantSchema = z.object({
  listId: z.string(),
  placeId: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  photos: z.array(z.string().url()).optional(),
  priceLevel: z.number().min(1).max(4).optional(),
  rating: z.number().min(0).max(5).optional(),
})

export async function POST(req: Request) {
  try {
    const session = ensureAuthApi(await auth())

    const json = await req.json()
    const body = addRestaurantSchema.parse(json)

    // Check if user has access to the list
    const list = await db.list.findFirst({
      where: {
        id: body.listId,
        owners: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!list) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if restaurant already exists
    let restaurant = await db.restaurant.findUnique({
      where: {
        placeId: body.placeId,
      },
    })

    // Create restaurant if it doesn't exist
    if (!restaurant) {
      restaurant = await db.restaurant.create({
        data: {
          placeId: body.placeId,
          name: body.name,
          address: body.address,
          phone: body.phone,
          website: body.website,
          photos: body.photos || [],
          priceLevel: body.priceLevel,
          rating: body.rating,
        },
      })
    }

    // Get the highest order in the list
    const highestOrder = await db.listRestaurant.findFirst({
      where: {
        listId: body.listId,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    })

    const nextOrder = highestOrder ? highestOrder.order + 1 : 0

    // Add restaurant to list
    const listRestaurant = await db.listRestaurant.create({
      data: {
        listId: body.listId,
        restaurantId: restaurant.id,
        order: nextOrder,
      },
      include: {
        restaurant: true,
      },
    })

    return NextResponse.json(listRestaurant)
  } catch (error) {
    console.error("[RESTAURANTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
