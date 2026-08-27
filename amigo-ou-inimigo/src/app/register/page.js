"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeCallbackUrl } from "@/lib/safe-callback-url";
import PasswordInput from "@/components/PasswordInput";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/login",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Digite seu nome.");
      return;
    }

    if (!email.trim()) {
      setError("Digite seu e-mail.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta.");
      }

      setSuccess("Conta criada com sucesso! Redirecionando...");

      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 800);
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setError(error.message);
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

          <h1 className="mt-8 text-3xl font-bold tracking-tight">
            Criar sua conta
          </h1>

          <p className="mt-3 text-muted">
            Crie sua conta para organizar ou participar de eventos.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Nome
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              disabled={loading}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
              required
            />
          </div>

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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
              required
            />
          </div>

          <div>
            <PasswordInput
              id="password"
              label="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          <div>
            <PasswordInput
              id="confirm-password"
              label="Confirmar senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl border border-friend/30 bg-friend/10 px-4 py-3 text-sm text-friend">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Já possui uma conta?{" "}
          <Link
            href={`/login${
              callbackUrl !== "/login"
                ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : ""
            }`}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
          <p className="text-muted">Carregando...</p>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
