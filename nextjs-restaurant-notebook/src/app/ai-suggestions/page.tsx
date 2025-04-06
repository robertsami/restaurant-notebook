import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export default async function AiSuggestionsPage() {
  const user = await requireUser();

  return (
    <AppLayout>
      <PageHeader 
        title="AI Suggestions" 
        description="Get personalized restaurant recommendations"
        actions={
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Get Suggestions
          </Button>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>No suggestions yet</CardTitle>
            <CardDescription>
              Get AI-powered restaurant recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-neutral-500">
              Add some restaurants to your collection, then click the button above to get personalized recommendations.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Get Suggestions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}