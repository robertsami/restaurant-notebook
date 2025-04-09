import { auth } from "@/lib/auth"
import { CreateListForm } from "@/components/create-list-form"
import { ensureAuth } from "@/lib/utils/session"

export default async function NewList() {
  const session = ensureAuth(await auth())

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New List</h1>
      <CreateListForm userId={session.user.id} />
    </div>
  )
}
