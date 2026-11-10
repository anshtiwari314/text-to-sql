import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import TextToSqlApp from "@/components/TextToSqlApp";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SITE_NAME,
  robots: { index: false, follow: false },
};

export default async function AppPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  return <TextToSqlApp user={session.user} />;
}
