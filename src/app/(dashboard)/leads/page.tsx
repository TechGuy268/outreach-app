"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Plus, Search, Upload, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  source: string;
  status: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showScrape, setShowScrape] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    fetch(`/api/leads?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .catch(() => toast.error("Failed to load leads"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [search]);

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Lead deleted");
      fetchLeads();
    } else {
      toast.error("Failed to delete lead");
    }
  };

  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    CONTACTED: "bg-yellow-100 text-yellow-800",
    REPLIED: "bg-green-100 text-green-800",
    INTERESTED: "bg-emerald-100 text-emerald-800",
    NOT_INTERESTED: "bg-gray-100 text-gray-800",
    CONVERTED: "bg-purple-100 text-purple-800",
    BOUNCED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Manage your outreach contacts
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showScrape} onOpenChange={setShowScrape}>
            <Button variant="outline" onClick={() => setShowScrape(true)}>
              <Globe className="mr-2 h-4 w-4" />
              Scrape
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Scrape Google Business</DialogTitle>
              </DialogHeader>
              <ScrapeForm
                onComplete={() => {
                  setShowScrape(false);
                  fetchLeads();
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <AddLeadForm
                onComplete={() => {
                  setShowAdd(false);
                  fetchLeads();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">{leads.length} leads</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : leads.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No leads found. Add leads manually or scrape from Google Business.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>{lead.email || "—"}</TableCell>
                    <TableCell>{lead.company || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[lead.status] || ""}`}
                      >
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLead(lead.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

function AddLeadForm({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Lead added");
      onComplete();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to add lead");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input id="jobTitle" name="jobTitle" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
        <Input id="linkedinUrl" name="linkedinUrl" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add Lead"}
      </Button>
    </form>
  );
}

function ScrapeForm({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/scrape/google-business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      const result = await res.json();
      toast.success(`Found ${result.count} businesses`);
      onComplete();
    } else {
      const err = await res.json();
      toast.error(err.error || "Scraping failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="query">Business Type / Keywords *</Label>
        <Input
          id="query"
          name="query"
          placeholder="e.g. plumbers, restaurants, dentists"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          name="location"
          placeholder="e.g. New York, NY"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxResults">Max Results</Label>
        <Input
          id="maxResults"
          name="maxResults"
          type="number"
          defaultValue={20}
          min={1}
          max={60}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Scraping..." : "Start Scraping"}
      </Button>
    </form>
  );
}
