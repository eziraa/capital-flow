"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SubmissionTrendChart({ data }: { data: { month: string; count: number }[] }) {
  // Format YYYY-MM to short month name (e.g. Jan, Feb)
  const chartData = data.map((d) => ({
    name: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Submissions over time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--popover)" }}
                itemStyle={{ color: "var(--popover-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--primary)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
