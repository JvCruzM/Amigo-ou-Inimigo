"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível processar a solicitação.",
        );
      }

      setMessage(data.message);
      setEmail("");
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      {" "}
      <div className="w-full max-w-md">
        {" "}
        <div className="mb-8 text-center">
          {" "}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight transition-colors hover:text-primary"
          >
            Amigo ou Inimigo{" "}
          </Link>{" "}
        </div>
        <section className="rounded-[2rem] border border-border bg-surface p-8 shadow-2xl sm:p-10">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Acesso à conta
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Recuperar senha
            </h1>

            <p className="mt-3 leading-7 text-muted">
              Informe seu e-mail e enviaremos as instruções para criar uma nova
              senha.
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
                className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-friend/30 bg-friend/10 px-4 py-3 text-sm text-friend">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary px-5 py-3.5 font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar instruções"}
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
