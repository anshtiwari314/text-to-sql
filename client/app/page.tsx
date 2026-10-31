import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import TextToSqlApp from "@/components/TextToSqlApp";
import AuthWrapper from "@/components/AuthWrapper";


export const instant = false;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  console.log('session :',session )
  if (!session) {
    return <AuthWrapper />;
  }

  return (
    <TextToSqlApp user={session.user} />
  );
}