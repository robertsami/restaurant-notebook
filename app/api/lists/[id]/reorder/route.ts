import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    }),
  ),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is an owner of the list
    const list = await db.list.findFirst({
      where: {
        id: params.id,
        owners: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!list) {
      return new NextResponse("Unauthorized or list not found", { status: 404 })
    }

    const json = await req.json()
    const body = reorderSchema.parse(json)

    // Update the order of each item
    for (const item of body.items) {
      await db.listRestaurant.update({
        where: {
          id: item.id,
        },
        data: {
          order: item.order,
        },
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LIST_REORDER_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
