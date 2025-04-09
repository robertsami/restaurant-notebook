import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  collaborators: z.array(z.string().email()).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = createListSchema.parse(json)

    const list = await db.list.create({
      data: {
        name: body.name,
        description: body.description || "",
        coverImage: body.coverImage,
        owners: {
          create: {
            userId: session.user.id,
          },
        },
      },
    })

    // Add collaborators if provided
    if (body.collaborators && body.collaborators.length > 0) {
      const collaborators = await db.user.findMany({
        where: {
          email: {
            in: body.collaborators,
          },
        },
      })

      for (const collaborator of collaborators) {
        await db.listOwner.create({
          data: {
            listId: list.id,
            userId: collaborator.id,
          },
        })
      }
    }

    return NextResponse.json(list)
  } catch (error) {
    console.error("[LISTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
