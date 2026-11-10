import AppGate from "@/components/AppGate";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SITE_NAME,
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <AppGate />;
}
