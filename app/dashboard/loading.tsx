export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground font-semibold">Loading dashboard...</p>
      </div>
    </div>
  );
}
