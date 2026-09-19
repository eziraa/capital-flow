"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Stage } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAGE_LABELS } from "@/components/ui/status-badges";

export function StageBarChart({ data }: { data: Record<Stage, number> }) {
  const chartData = Object.values(Stage).map((stage) => ({
    name: STAGE_LABELS[stage],
    count: data[stage],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Pipeline stages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--popover)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
