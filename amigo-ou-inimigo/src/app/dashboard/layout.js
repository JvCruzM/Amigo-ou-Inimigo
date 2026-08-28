"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import UnreadMessagesBadge from "@/components/UnreadMessagesBadge";

export default function DashboardLayout({ children }) {
  async function handleSignOut() {
    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight"
          >
            Amigo ou Inimigo
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/messages"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              Mensagens
              <UnreadMessagesBadge />
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}