"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Play, Pause, Archive } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  dailyLimit: number;
  _count: { campaignLeads: number; steps: number };
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = () => {
    setLoading(true);
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns || []))
      .catch(() => toast.error("Failed to load campaigns"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Campaign ${status.toLowerCase()}`);
      fetchCampaigns();
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    ARCHIVED: "bg-gray-100 text-gray-500",
  };

  const typeLabels: Record<string, string> = {
    EMAIL: "Email",
    LINKEDIN: "LinkedIn",
    MULTI_CHANNEL: "Multi-Channel",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage outreach sequences
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No campaigns yet. Create your first outreach campaign.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                        {campaign.name}
                      </CardTitle>
                    </Link>
                    {campaign.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[campaign.status]}`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{typeLabels[campaign.type]}</Badge>
                  <span>{campaign._count?.steps || 0} steps</span>
                  <span>{campaign._count?.campaignLeads || 0} leads</span>
                </div>
                <div className="mt-4 flex gap-2">
                  {campaign.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(campaign.id, "ACTIVE")}
                    >
                      <Play className="mr-1 h-3 w-3" /> Start
                    </Button>
                  )}
                  {campaign.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(campaign.id, "PAUSED")}
                    >
                      <Pause className="mr-1 h-3 w-3" /> Pause
                    </Button>
                  )}
                  {campaign.status === "PAUSED" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(campaign.id, "ACTIVE")}
                    >
                      <Play className="mr-1 h-3 w-3" /> Resume
                    </Button>
                  )}
                  {(campaign.status === "COMPLETED" ||
                    campaign.status === "PAUSED") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(campaign.id, "ARCHIVED")}
                    >
                      <Archive className="mr-1 h-3 w-3" /> Archive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
