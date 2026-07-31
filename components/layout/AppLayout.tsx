import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0B0E13] text-[#F3EEE1] antialiased" style={{ fontFamily: "var(--font-body)" }}>
      <AppSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
