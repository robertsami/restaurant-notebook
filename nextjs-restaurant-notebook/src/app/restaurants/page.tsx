import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function RestaurantsPage() {
  const user = await requireUser();

  return (
    <AppLayout>
      <PageHeader 
        title="Restaurants" 
        description="Manage your restaurant collection"
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Restaurant
          </Button>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>No restaurants yet</CardTitle>
            <CardDescription>
              Add your first restaurant to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-neutral-500">
              You haven't added any restaurants yet. Click the button below to add your first restaurant.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}