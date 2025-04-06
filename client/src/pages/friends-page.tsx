import { PageHeader } from "@/components/page-header";
import { FriendsSection } from "@/components/friends/friends-section";

export default function FriendsPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Friends"
        description="Find and connect with other users"
      />
      <FriendsSection />
    </div>
  );
}