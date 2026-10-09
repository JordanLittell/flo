import HomeScreen from "@/components/HomeScreen/HomeScreen";
import { requireUser } from "@/lib/auth/access";
import { Session } from "@/lib/data";

export default async function Home() {
  await requireUser();
  const sessions = await Session.listAll();
  return <HomeScreen sessions={sessions.map((session) => session.toJSON())} />;
}
