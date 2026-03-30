"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, Mail } from "lucide-react";
import { LinkedinIcon as Linkedin } from "@/components/icons";

interface DashboardStats {
  totalLeads: number;
  activeCampaigns: number;
  emailsSent: number;
  linkedinSent: number;
  openRate: number;
  replyRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    linkedinSent: 0,
    openRate: 0,
    replyRate: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns,
      icon: Megaphone,
      color: "text-green-500",
    },
    {
      title: "Emails Sent",
      value: stats.emailsSent,
      icon: Mail,
      color: "text-orange-500",
    },
    {
      title: "LinkedIn Actions",
      value: stats.linkedinSent,
      icon: Linkedin,
      color: "text-sky-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your outreach performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.openRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              of emails were opened
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reply Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.replyRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              of contacts replied
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
