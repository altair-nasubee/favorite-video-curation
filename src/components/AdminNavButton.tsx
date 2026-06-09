"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WarnIcon } from "./icons";

/**
 * 管理画面への遷移ボタン。仕様により全ユーザーに常時表示し、
 * 管理者以外が押下した場合は警告を出して遷移しない。
 */
export function AdminNavButton({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [warn, setWarn] = useState(false);

  function handleClick() {
    if (isAdmin) {
      router.push("/admin");
      return;
    }
    setWarn(true);
    window.setTimeout(() => setWarn(false), 3200);
  }

  return (
    <>
      <button className="btn btn--ghost btn--sm" onClick={handleClick}>
        管理画面
      </button>
      {warn && (
        <div className="toast" role="alert">
          <WarnIcon />
          管理者のみアクセスできます
        </div>
      )}
    </>
  );
}
