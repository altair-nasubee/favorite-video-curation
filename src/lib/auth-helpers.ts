import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "@/lib/auth";

/** 現在のセッションを取得（未ログインなら null）。 */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** セッションが管理者（ADMIN_EMAIL 一致）かどうか。 */
export function isAdmin(session: Session | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return (
    !!session?.user?.email &&
    !!adminEmail &&
    session.user.email.toLowerCase() === adminEmail.toLowerCase()
  );
}

/** ログイン必須。未ログインなら /login へリダイレクト。 */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** 管理者必須。未ログインは /login、非管理者は / へリダイレクト。 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (!isAdmin(session)) redirect("/");
  return session;
}
