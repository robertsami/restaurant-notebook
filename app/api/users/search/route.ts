import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json([])
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[USERS_SEARCH_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
