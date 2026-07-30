import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider, QueryProvider, AgentProvider, AuthProvider } from "@/components/providers";
import { ErrorBoundary } from "@/components/shared";

export const metadata: Metadata = {
  title: "Opportunity AI — Your Autonomous Opportunity Agent for Africa",
  description:
    "An autonomous AI Career Agent powered by Gemma 4 that helps African students and professionals discover opportunities, determine eligibility, and prepare high-quality applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <AgentProvider>
                <AuthProvider>
                  {children}
                  <Toaster position="top-right" richColors />
                </AuthProvider>
              </AgentProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
