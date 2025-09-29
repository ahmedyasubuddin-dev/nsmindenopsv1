
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { FilmsReport } from "@/lib/data-store";

export function FilmsAnalytics() {
  const { firestore } = useFirebase();
  const filmsQuery = useMemoFirebase(() => query(collection(firestore, 'films')), [firestore]);
  const { data: filmsData, isLoading } = useCollection<FilmsReport>(filmsQuery);

  if (isLoading) {
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
