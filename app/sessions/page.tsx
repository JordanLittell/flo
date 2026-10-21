import SessionsScreen from "@/components/SessionsScreen/SessionsScreen";
import { requireUser } from "@/lib/auth/access";

export default async function SessionsPage() {
  const user = await requireUser();
  const entries = await user.sessions();
  return (
    <SessionsScreen
      entries={entries.map(({ session, progress }) => ({ session: session.toJSON(), progress: progress.toJSON() }))}
    />
  );
}
