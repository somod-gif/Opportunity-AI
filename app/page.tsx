import type { Metadata } from "next";
import { LandingClient } from "./landing-client";

export const metadata: Metadata = {
  title: "Opportunity AI — Autonomous AI Career Agent for Africa",
  description:
    "An autonomous AI Career Agent powered by Google Gemma 4 that helps African students and professionals discover opportunities, evaluate eligibility, generate applications, and achieve their career goals.",
};

export default function Home() {
  return <LandingClient />;
}
