import Link from "next/link";
import { getSession } from "@/lib/auth-helpers";
import { SignOutButton } from "./SignOutButton";

export async function Header() {
  const session = await getSession();

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand" aria-label="ホームへ">
          <span className="brand__mark">
            Ciné<em>thèque</em>
          </span>
          <span className="brand__sub">curation</span>
        </Link>

        <nav className="header-nav">
          <Link href="/admin" className="btn btn--ghost btn--sm">
            管理画面
          </Link>
          {session && (
            <>
              <span className="user-chip">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="user-chip__avatar"
                    src={session.user.image}
                    alt=""
                    width={26}
                    height={26}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="user-chip__avatar" aria-hidden />
                )}
                {session.user.name}
              </span>
              <SignOutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
