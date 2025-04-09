import { auth } from "@/lib/auth"
import { ensureAuthApi } from "@/lib/utils/session"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = ensureAuthApi(await auth())

    const { searchParams } = new URL(req.url)
    const ids = searchParams.get("ids")

    if (!ids) {
      return NextResponse.json([])
    }

    const userIds = ids.split(",")

    const users = await db.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[USERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
