import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { LoginButton } from "@/components/LoginButton";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="login-screen">
      <div className="login-card reveal">
        <div className="login-card__mark">
          Ciné<em>thèque</em>
        </div>
        <div className="login-card__sub">private screening room</div>
        <p className="login-card__lead">
          とっておきの YouTube 動画を集めた、
          <br />
          特別な試写室へようこそ。
        </p>
        <LoginButton />
      </div>
    </main>
  );
}
