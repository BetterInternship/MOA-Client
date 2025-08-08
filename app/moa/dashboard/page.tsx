export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">
          Manage your Memorandum of Agreement (MOA) requests, track their statuses,
          and stay informed about the next steps.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Total Requests */}
        <div className="rounded-lg border p-6 shadow-sm bg-white">
          <h2 className="text-lg font-medium text-foreground">Total MOA Requests</h2>
          <p className="text-3xl font-bold text-primary mt-2">3</p>
          <p className="text-sm text-muted-foreground mt-1">Includes both Standard and Negotiated MOAs</p>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border p-6 shadow-sm bg-white">
          <h2 className="text-lg font-medium text-foreground">Quick Actions</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li><a href="/dashboard/request" className="text-primary hover:underline">Submit a new MOA request</a></li>
            <li><a href="/dashboard/status" className="text-primary hover:underline">Check request status</a></li>
            <li><a href="/support" className="text-primary hover:underline">Contact legal support</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
    