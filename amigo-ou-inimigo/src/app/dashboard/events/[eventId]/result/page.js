"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResultPage({ params }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadResult() {
      try {
        const { eventId } = await params;

        const response = await fetch(
          `/api/events/${eventId}/result`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erro ao carregar resultado."
          );
        }

        if (!cancelled) {
          setResult(data.result);
        }
      } catch (error) {
        console.error("Erro ao carregar resultado:", error);

        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadResult();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <p className="text-muted">
            Carregando seu resultado...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Resultado
            </p>

            <h1 className="mt-3 text-2xl font-bold">
              Não foi possível carregar seu resultado
            </h1>

            <p className="mt-4 text-enemy">{error}</p>

            <Link
              href="/dashboard"
              className="mt-6 inline-block font-semibold underline underline-offset-4"
            >
              Voltar para o Dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
            <h1 className="text-2xl font-bold">
              Resultado não encontrado
            </h1>

            <Link
              href="/dashboard"
              className="mt-6 inline-block font-semibold underline underline-offset-4"
            >
              Voltar para o Dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const isFriend = result.type === "AMIGO";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          ← Voltar para o Dashboard
        </Link>

        <header className="mt-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Seu resultado
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {result.event.name}
          </h1>

          <p className="mt-3 text-muted">
            O sorteio foi realizado. Agora você pode descobrir
            seu resultado.
          </p>
        </header>

        <section className="mt-10 rounded-[2rem] border border-border bg-surface p-8 text-center shadow-2xl sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            Você tirou
          </p>

          <h2 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
            {result.receiver.name}
          </h2>

          <div className="mx-auto mt-10 max-w-sm border-t border-border pt-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              Seu lado
            </p>

            <div
              className={`mx-auto mt-4 inline-flex rounded-2xl border px-6 py-3 text-lg font-bold tracking-wide ${
                isFriend
                  ? "border-friend/30 bg-friend/10 text-friend"
                  : "border-enemy/30 bg-enemy/10 text-enemy"
              }`}
            >
              {result.type}
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-background p-5">
            <p className="text-sm leading-6 text-muted">
              Este é o seu resultado secreto. Não compartilhe
              esta informação com os outros participantes.
            </p>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href={`/dashboard/participating/${result.event.id}`}
            className="text-sm font-semibold text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Voltar para o evento
          </Link>
        </div>
      </div>
    </main>
  );
}