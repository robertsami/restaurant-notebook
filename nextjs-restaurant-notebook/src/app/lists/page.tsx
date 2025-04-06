import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function ListsPage() {
  const user = await requireUser();

  return (
    <AppLayout>
      <PageHeader 
        title="Lists" 
        description="Organize your restaurants into lists"
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create List
          </Button>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>My Restaurants</CardTitle>
            <CardDescription>
              Your default restaurant list
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-neutral-500">
              0 restaurants
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/lists/1">
                View List
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}