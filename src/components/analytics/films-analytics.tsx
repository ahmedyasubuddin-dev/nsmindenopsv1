
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase, useAuth as useFirebaseAuth } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { FilmsReport } from "@/lib/data-store";

export function FilmsAnalytics() {
  const { firestore } = useFirebase();
  const { isUserLoading } = useFirebaseAuth();

  const filmsQuery = useMemoFirebase(() => {
    if (isUserLoading) return null;
    return query(collection(firestore, 'films'))
  }, [firestore, isUserLoading]);

  const { data: filmsData, isLoading } = useCollection<FilmsReport>(filmsQuery);

  if (isLoading || isUserLoading) {
    return <p>Loading analytics...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Films Department Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Analytics for the Films department will be displayed here.</p>
        <p>Total reports: {filmsData?.length ?? 0}</p>
      </CardContent>
    </Card>
  );
}
