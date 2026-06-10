import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "@/lib/auth";

/** 現在のセッションを取得（未ログインなら null）。 */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** ログイン必須。未ログインなら /login へリダイレクト。
 * 管理者の区別は廃止し、ログインユーザーは全員が管理画面を利用できる。 */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
