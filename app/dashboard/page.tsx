import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ListCard } from "@/components/list-card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { nullToUndefined } from "@/lib/utils/null-to-undefined"
import { ensureAuth } from "@/lib/utils/session"

export default async function Dashboard() {
  const session = ensureAuth(await auth())

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
            <ListCard key={list.id} list={nullToUndefined(list)} />
          ))}
        </div>
      )}
    </div>
  )
}
