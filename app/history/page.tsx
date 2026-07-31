import type { Metadata } from "next";
import { HistoryClient } from "./client";

export const metadata: Metadata = {
  title: "Mission History — Opportunity AI",
  description: "View all your past autonomous agent missions",
};

export default function HistoryPage() {
  return <HistoryClient />;
}
