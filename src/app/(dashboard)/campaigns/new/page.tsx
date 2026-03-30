"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Step {
  channel: string;
  delayDays: number;
  subject: string;
  body: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EMAIL");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [steps, setSteps] = useState<Step[]>([
    { channel: "EMAIL", delayDays: 0, subject: "", body: "" },
  ]);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        channel: type === "LINKEDIN" ? "LINKEDIN_MESSAGE" : "EMAIL",
        delayDays: 3,
        subject: "",
        body: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const updated = [...steps];
    (updated[index] as unknown as Record<string, string | number>)[field] = value;
    setSteps(updated);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, type, dailyLimit, steps }),
    });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      toast.success("Campaign created");
      router.push(`/campaigns/${data.campaign.id}`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create campaign");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Campaign</h1>
          <p className="text-muted-foreground">
            Set up a new outreach sequence
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 SaaS Outreach"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this campaign"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email Only</SelectItem>
                    <SelectItem value="LINKEDIN">LinkedIn Only</SelectItem>
                    <SelectItem value="MULTI_CHANNEL">Multi-Channel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Send Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  min={1}
                  max={200}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sequence Steps</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="mr-1 h-3 w-3" /> Add Step
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="space-y-4 rounded-lg border p-4 relative"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Step {index + 1}</h4>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                      value={step.channel}
                      onValueChange={(v) => v && updateStep(index, "channel", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(type === "EMAIL" || type === "MULTI_CHANNEL") && (
                          <SelectItem value="EMAIL">Email</SelectItem>
                        )}
                        {(type === "LINKEDIN" || type === "MULTI_CHANNEL") && (
                          <>
                            <SelectItem value="LINKEDIN_CONNECT">
                              LinkedIn Connect
                            </SelectItem>
                            <SelectItem value="LINKEDIN_MESSAGE">
                              LinkedIn Message
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delay (days after previous)</Label>
                    <Input
                      type="number"
                      value={step.delayDays}
                      onChange={(e) =>
                        updateStep(index, "delayDays", Number(e.target.value))
                      }
                      min={0}
                    />
                  </div>
                </div>
                {step.channel === "EMAIL" && (
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={step.subject}
                      onChange={(e) =>
                        updateStep(index, "subject", e.target.value)
                      }
                      placeholder="Hi {{firstName}}, quick question about {{company}}"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea
                    value={step.body}
                    onChange={(e) => updateStep(index, "body", e.target.value)}
                    placeholder="Use {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}} as variables"
                    rows={4}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/campaigns">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
}
