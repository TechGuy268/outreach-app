"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Mail } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/icons";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string[];
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchTemplates = () => {
    setLoading(true);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Template deleted");
      fetchTemplates();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Reusable message templates for outreach
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              onComplete={() => {
                setShowAdd(false);
                fetchTemplates();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No templates yet. Create your first message template.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    {template.channel === "EMAIL" ? (
                      <Mail className="h-3 w-3" />
                    ) : (
                      <Linkedin className="h-3 w-3" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {template.channel.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTemplate(template.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                {template.subject && (
                  <p className="mb-2 text-sm font-medium">
                    Subject: {template.subject}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.body}
                </p>
                {template.variables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("EMAIL");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name"),
      channel,
      subject: form.get("subject") || null,
      body: form.get("body"),
    };

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Template created");
      onComplete();
    } else {
      toast.error("Failed to create template");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input id="name" name="name" required placeholder="e.g. Cold Intro Email" />
      </div>
      <div className="space-y-2">
        <Label>Channel</Label>
        <Select value={channel} onValueChange={(v) => v && setChannel(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMAIL">Email</SelectItem>
            <SelectItem value="LINKEDIN_CONNECT">LinkedIn Connect</SelectItem>
            <SelectItem value="LINKEDIN_MESSAGE">LinkedIn Message</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {channel === "EMAIL" && (
        <div className="space-y-2">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            name="subject"
            placeholder="Hi {{firstName}}, quick question"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="body">Message Body *</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={6}
          placeholder="Hi {{firstName}},&#10;&#10;I noticed {{company}} is...&#10;&#10;Available variables: {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}}, {{location}}"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Template"}
      </Button>
    </form>
  );
}
