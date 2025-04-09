import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ListCard } from "@/components/list-card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  const lists = await db.list.findMany({
    where: {
      owners: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      _count: {
        select: { restaurants: true },
      },
      owners: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Restaurant Lists</h1>
        <Button asChild>
          <Link href="/lists/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New List
          </Link>
        </Button>
      </div>

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create your first restaurant list to get started"
          action={
            <Button asChild>
              <Link href="/lists/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create List
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  )
}
