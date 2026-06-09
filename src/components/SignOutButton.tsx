"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      className="btn btn--ghost btn--sm"
      onClick={handleSignOut}
      disabled={pending}
    >
      Sign out
    </button>
  );
}
