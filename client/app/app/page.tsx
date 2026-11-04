import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import TextToSqlApp from "@/components/TextToSqlApp";

export default async function AppPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  return <TextToSqlApp user={session.user} />;
}
