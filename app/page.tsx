import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Track Your Restaurant Experiences</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Create lists, log visits, and share memorable dining experiences with friends. Restaurant Notebook helps you
          remember the places that matter.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/api/auth/signin">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Restaurant Lists</h3>
          <p className="text-muted-foreground">
            Create and organize lists of restaurants you want to try or have visited. Collaborate with friends on shared
            lists.
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Visit Logging</h3>
          <p className="text-muted-foreground">
            Record your experiences with notes, photos, and ratings. Keep track of who you dined with and when.
          </p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Collaboration</h3>
          <p className="text-muted-foreground">
            Share lists with friends and get real-time updates when changes are made. Plan your next dining adventure
            together.
          </p>
        </div>
      </div>
    </div>
  )
}
