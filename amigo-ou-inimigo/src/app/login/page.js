"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeCallbackUrl } from "@/lib/safe-callback-url";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-2xl">
        <header className="text-center">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Amigo ou Inimigo
          </Link>

          <h1 className="mt-8 text-3xl font-bold tracking-tight">Entrar</h1>

          <p className="mt-3 text-muted">
            Acesse seus eventos e descubra seus resultados.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              disabled={loading}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              disabled={loading}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Ainda não possui uma conta?{" "}
          <Link
            href={`/register${
              callbackUrl !== "/dashboard"
                ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : ""
            }`}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
          <p className="text-muted">Carregando...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
