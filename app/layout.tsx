import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider, AgentProvider } from "@/components/providers";
import { ErrorBoundary } from "@/components/shared";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Opportunity AI — Your Autonomous AI Career Agent for Global Opportunities",
  description:
    "An autonomous multi-agent AI platform powered by Gemma 4 that helps students, graduates, researchers, professionals, and founders discover, evaluate, and apply for life-changing opportunities worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} ${body.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <ErrorBoundary>
          <QueryProvider>
            <AgentProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                toastOptions={{
                  style: {
                    background: "#12161D",
                    color: "#F3EEE1",
                    border: "1px solid rgba(243, 238, 225, 0.1)",
                  },
                }}
              />
            </AgentProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}