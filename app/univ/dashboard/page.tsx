"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CompanyRegistration = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  tin: string;
  industry: string;
  reason: string;
  date: string; // MM/DD/YYYY
};

const stats = [
  { label: "New Companies", value: 21, color: "bg-green-600" },
  { label: "MOA Requests", value: 12, color: "bg-orange-500" },
  { label: "Total Companies", value: 1249, color: "bg-gray-200 text-gray-900" },
  { label: "Active MOAs", value: 1023, color: "bg-blue-700" },
];

const aurora: CompanyRegistration = {
  id: "VXZb0VYY2JqPC2ZKyEQHr",
  name: "Aurora Systems",
  contactPerson: "Isabel Reyes",
  email: "isabel.reyes@aurorasystems.ph",
  tin: "453-219-874-000",
  industry: "IT Services",
  reason:
    "We're looking to cultivate a strong local talent pipeline and offer students exposure to enterprise-scale IT systems early in their careers.",
  date: "12/02/2024",
};

// Derive activity rows (add a few dummy entries)
const activities: Array<{
  date: string;
  company: string;
  action: string;
  performedBy: string;
}> = [
  {
    date: aurora.date,
    company: aurora.name,
    action: "Company Registration Submitted",
    performedBy: aurora.contactPerson,
  },
  {
    date: "01/15/2025",
    company: "GreenFields Manufacturing",
    action: "MOA Request (Standard) Received",
    performedBy: "Carlos Mendoza",
  },
  {
    date: "01/18/2025",
    company: "GreenFields Manufacturing",
    action: "Initial Review Completed",
    performedBy: "DLSU - OJT Coordinator",
  },
  {
    date: "02/01/2025",
    company: "Northbridge Finance",
    action: "MOA Request (Negotiated) Submitted",
    performedBy: "Katrina Uy",
  },
  {
    date: "02/05/2025",
    company: "Northbridge Finance",
    action: "Legal Review Started",
    performedBy: "DLSU Legal",
  },
];

export default function UnivDashboardPage() {
  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">DLSU MOA Management Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of MOA requests, company registrations, and activity logs.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center border rounded-lg p-6 bg-white"
          >
            <div className="text-4xl font-bold text-slate-600">{stat.value}</div>
            <span
              className={`mt-2 px-3 py-1 rounded-md text-sm font-medium ${
                stat.color.includes("bg-gray")
                  ? stat.color
                  : `${stat.color} text-white`
              }`}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Activity Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-[200px]">Performed by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((row, idx) => (
                  <TableRow key={`${row.company}-${row.date}-${idx}`}>
                    <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                    <TableCell className="font-medium">{row.company}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.performedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
