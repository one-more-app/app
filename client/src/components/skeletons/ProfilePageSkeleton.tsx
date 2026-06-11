import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <Card className="py-3">
        <CardContent className="pt-0">
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-32" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[4.5rem] rounded-lg" />
            <Skeleton className="h-[4.5rem] rounded-lg" />
            <Skeleton className="h-[4.5rem] rounded-lg" />
            <Skeleton className="h-[4.5rem] rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
