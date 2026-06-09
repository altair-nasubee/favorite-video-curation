"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { GoogleIcon } from "./icons";

export function LoginButton() {
  const [pending, setPending] = useState(false);

  async function handleLogin() {
    setPending(true);
    await signIn.social({ provider: "google", callbackURL: "/" });
  }

  return (
    <button
      className="btn btn--gold btn--block"
      onClick={handleLogin}
      disabled={pending}
    >
      <GoogleIcon />
      {pending ? "リダイレクト中…" : "Google でログイン"}
    </button>
  );
}
