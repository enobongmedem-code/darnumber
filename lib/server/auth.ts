import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}
