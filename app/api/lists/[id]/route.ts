import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    // Delete the list
    await db.list.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LIST_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = updateListSchema.parse(json)

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

    // Update the list
    const updatedList = await db.list.update({
      where: {
        id: params.id,
      },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
      },
    })

    return NextResponse.json(updatedList)
  } catch (error) {
    console.error("[LIST_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
