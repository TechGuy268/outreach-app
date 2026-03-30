"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Users, Mail } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/icons";
import { toast } from "sonner";

interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  dailyLimit: number;
  steps: {
    id: string;
    order: number;
    channel: string;
    delayDays: number;
    subject: string | null;
    body: string;
  }[];
  campaignLeads: {
    id: string;
    status: string;
    currentStep: number;
    lead: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      company: string | null;
    };
  }[];
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLeads, setShowAddLeads] = useState(false);

  const fetchCampaign = () => {
    setLoading(true);
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((data) => setCampaign(data.campaign))
      .catch(() => toast.error("Failed to load campaign"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="py-8 text-center">Campaign not found</div>;
  }

  const channelIcons: Record<string, React.ReactNode> = {
    EMAIL: <Mail className="h-4 w-4" />,
    LINKEDIN_CONNECT: <Linkedin className="h-4 w-4" />,
    LINKEDIN_MESSAGE: <Linkedin className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge>{campaign.status}</Badge>
          </div>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.type.replace("_", " ")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.steps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaign.campaignLeads.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sequence Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaign.steps
              .sort((a, b) => a.order - b.order)
              .map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {channelIcons[step.channel]}
                      <span className="font-medium">
                        {step.channel.replace("_", " ")}
                      </span>
                      {step.delayDays > 0 && (
                        <Badge variant="outline">
                          +{step.delayDays} day{step.delayDays > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    {step.subject && (
                      <p className="mt-1 text-sm font-medium">
                        Subject: {step.subject}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campaign Leads</CardTitle>
          <Dialog open={showAddLeads} onOpenChange={setShowAddLeads}>
            <Button size="sm" onClick={() => setShowAddLeads(true)}>
              <Plus className="mr-1 h-3 w-3" /> Add Leads
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Leads to Campaign</DialogTitle>
              </DialogHeader>
              <AddLeadsToCampaign
                campaignId={campaign.id}
                onComplete={() => {
                  setShowAddLeads(false);
                  fetchCampaign();
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campaign.campaignLeads.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No leads assigned. Add leads to start the campaign.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.campaignLeads.map((cl) => (
                  <TableRow key={cl.id}>
                    <TableCell className="font-medium">
                      {cl.lead.firstName} {cl.lead.lastName}
                    </TableCell>
                    <TableCell>{cl.lead.email || "—"}</TableCell>
                    <TableCell>{cl.lead.company || "—"}</TableCell>
                    <TableCell>
                      {cl.currentStep + 1} / {campaign.steps.length}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cl.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddLeadsToCampaign({
  campaignId,
  onComplete,
}: {
  campaignId: string;
  onComplete: () => void;
}) {
  const [leads, setLeads] = useState<
    { id: string; firstName: string; lastName: string; email: string | null }[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/leads?search=${encodeURIComponent(search)}&limit=50`)
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []));
  }, [search]);

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: selected }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      toast.success(`Added ${data.count} leads`);
      onComplete();
    } else {
      toast.error("Failed to add leads");
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search leads..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-60 space-y-2 overflow-y-auto">
        {leads.map((lead) => (
          <label
            key={lead.id}
            className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={selected.includes(lead.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelected([...selected, lead.id]);
                } else {
                  setSelected(selected.filter((id) => id !== lead.id));
                }
              }}
            />
            <span className="font-medium">
              {lead.firstName} {lead.lastName}
            </span>
            <span className="text-sm text-muted-foreground">
              {lead.email || "No email"}
            </span>
          </label>
        ))}
      </div>
      <Button
        onClick={handleAdd}
        disabled={loading || selected.length === 0}
        className="w-full"
      >
        {loading ? "Adding..." : `Add ${selected.length} Lead(s)`}
      </Button>
    </div>
  );
}
