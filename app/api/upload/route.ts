import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File too large (max 5MB)", { status: 400 })
    }

    const fileName = `${session.user.id}/${uuidv4()}-${file.name}`

    const blob = await put(fileName, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[UPLOAD_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
