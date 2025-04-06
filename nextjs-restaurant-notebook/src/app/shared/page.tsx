import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SharedListsPage() {
  const user = await requireUser();

  return (
    <AppLayout>
      <PageHeader 
        title="Shared Lists" 
        description="Lists shared with you by friends"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>No shared lists</CardTitle>
            <CardDescription>
              You don't have any lists shared with you yet
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-neutral-500">
              When friends share their lists with you, they will appear here.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/friends">
                Go to Friends
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}