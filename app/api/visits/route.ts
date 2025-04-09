import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createVisitSchema = z.object({
  restaurantId: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  photos: z.array(z.string().url()).optional(),
  participants: z.array(z.string()),
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = createVisitSchema.parse(json)

    // Check if user has access to the restaurant through a list
    const restaurant = await db.restaurant.findFirst({
      where: {
        id: body.restaurantId,
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
    })

    if (!restaurant) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Create the visit
    const visit = await db.visit.create({
      data: {
        restaurantId: body.restaurantId,
        date: new Date(body.date),
        notes: body.notes || "",
        rating: body.rating,
        photos: body.photos || [],
        participants: {
          create: body.participants.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(visit)
  } catch (error) {
    console.error("[VISITS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
