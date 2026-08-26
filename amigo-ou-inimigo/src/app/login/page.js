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

  const registerHref =
    callbackUrl !== "/dashboard"
      ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight transition-colors hover:text-primary"
          >
            Amigo ou Inimigo
          </Link>
        </div>

        <section className="rounded-[2rem] border border-border bg-surface p-8 shadow-2xl sm:p-10">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Bem-vindo de volta
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Entrar
            </h1>

            <p className="mt-3 leading-7 text-muted">
              Acesse sua conta para continuar.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="voce@exemplo.com"
                autoComplete="email"
                disabled={loading}
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
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
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Sua senha"
                autoComplete="current-password"
                disabled={loading}
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
              />

              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-muted transition-colors hover:text-primary"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-5 py-3.5 font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />

            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              ou
            </span>

            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 text-center">
            <p className="text-sm text-muted">
              Ainda não possui uma conta?
            </p>

            <Link
              href={registerHref}
              className="mt-2 inline-flex items-center font-semibold text-foreground transition-colors hover:text-primary"
            >
              Criar conta
              <span className="ml-1 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
          <p className="text-muted">Carregando...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}