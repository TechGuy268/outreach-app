"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Key } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/icons";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your outreach integrations
        </p>
      </div>

      <OutlookSettings />
      <Separator />
      <LinkedInSettings />
      <Separator />
      <GoogleApiSettings />
    </div>
  );
}

function OutlookSettings() {
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const res = await fetch("/api/settings/outlook/test");
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      toast.success("Outlook connection verified!");
    } else {
      toast.error(data.error || "Connection failed. Check your OUTLOOK_EMAIL and OUTLOOK_PASSWORD env vars.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-blue-500" />
          <CardTitle>Outlook / Hotmail Email</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Email sending uses SMTP with your Outlook/Hotmail credentials.
          Set <code>OUTLOOK_EMAIL</code> and <code>OUTLOOK_PASSWORD</code> in
          your Vercel environment variables.
        </p>
        <Button onClick={testConnection} disabled={loading}>
          {loading ? "Testing..." : "Test Connection"}
        </Button>
      </CardContent>
    </Card>
  );
}

function LinkedInSettings() {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);

  const saveCookie = async () => {
    setLoading(true);
    const res = await fetch("/api/settings/linkedin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookie }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("LinkedIn cookie saved");
      setCookie("");
    } else {
      toast.error("Failed to save cookie");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Linkedin className="h-5 w-5 text-sky-500" />
          <CardTitle>LinkedIn</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Paste your LinkedIn session cookie (li_at) to enable LinkedIn
          automation. Open DevTools on LinkedIn, go to Application &gt; Cookies,
          and copy the full Cookie header.
        </p>
        <div className="space-y-2">
          <Label htmlFor="cookie">Session Cookie</Label>
          <Input
            id="cookie"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="Paste your LinkedIn cookie string here"
            type="password"
          />
        </div>
        <Button onClick={saveCookie} disabled={loading || !cookie}>
          {loading ? "Saving..." : "Save Cookie"}
        </Button>
      </CardContent>
    </Card>
  );
}

function GoogleApiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const saveKey = async () => {
    setLoading(true);
    const res = await fetch("/api/settings/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("API key saved");
      setApiKey("");
    } else {
      toast.error("Failed to save API key");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-green-500" />
          <CardTitle>Google Places API</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add your Google Places API key to enable business scraping. Get one
          from the Google Cloud Console.
        </p>
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            type="password"
          />
        </div>
        <Button onClick={saveKey} disabled={loading || !apiKey}>
          {loading ? "Saving..." : "Save API Key"}
        </Button>
      </CardContent>
    </Card>
  );
}
