"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

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

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: params.token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível redefinir sua senha.");
      }

      setSuccess("Senha redefinida com sucesso! Redirecionando...");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

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
              Segurança da conta
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Nova senha
            </h1>

            <p className="mt-3 leading-7 text-muted">
              Escolha uma nova senha para sua conta.
            </p>
          </header>

          <div className="mt-6 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm leading-6 text-muted">
              O link de recuperação é temporário e pode ser usado apenas uma
              vez.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <PasswordInput
                id="password"
                label="Nova senha"
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
              <div className="rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-friend/30 bg-friend/10 px-4 py-3 text-sm text-friend">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-5 py-3.5 font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              ← Voltar para o login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
