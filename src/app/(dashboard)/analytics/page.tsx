"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  overview: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    totalBounced: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  };
  daily: { date: string; sent: number; opened: number; replied: number }[];
  byCampaign: {
    name: string;
    sent: number;
    opened: number;
    replied: number;
    openRate: number;
    replyRate: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const overview = data?.overview || {
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalBounced: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    bounceRate: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your outreach performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.openRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.totalOpened} opened
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.replyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.totalReplied} replied
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.bounceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.totalBounced} bounced
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Activity</TabsTrigger>
          <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <Card>
            <CardContent className="pt-6">
              {(data?.daily?.length || 0) === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No activity data yet. Start sending outreach to see stats.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Replied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.daily?.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.sent}</TableCell>
                        <TableCell>{row.opened}</TableCell>
                        <TableCell>{row.replied}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campaigns">
          <Card>
            <CardContent className="pt-6">
              {(data?.byCampaign?.length || 0) === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No campaign data yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Replied</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Reply Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.byCampaign?.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell>{row.sent}</TableCell>
                        <TableCell>{row.opened}</TableCell>
                        <TableCell>{row.replied}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {row.openRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {row.replyRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
