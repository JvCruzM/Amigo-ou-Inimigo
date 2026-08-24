"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEventStatusLabel } from "@/lib/event-status";

export default function ParticipatingEventPage({ params }) {
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadParticipation() {
      try {
        const { eventId } = await params;

        const response = await fetch(
          `/api/events/${eventId}/participation`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erro ao carregar participação."
          );
        }

        if (!cancelled) {
          setParticipation(data.participation);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar participação:",
          error
        );

        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadParticipation();

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <p className="text-muted">
            Carregando evento...
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
            <h1 className="text-2xl font-bold">
              Não foi possível carregar o evento
            </h1>

            <p className="mt-4 text-enemy">
              {error}
            </p>

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

  if (!participation) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
          <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
            <h1 className="text-2xl font-bold">
              Participação não encontrada
            </h1>

            <p className="mt-4 text-muted">
              Você não possui uma participação válida neste
              evento.
            </p>

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

  const { event } = participation;
  const isDrawn = event.status === "DRAWN";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          ← Voltar para o Dashboard
        </Link>

        <header className="mt-8 rounded-3xl border border-border bg-surface p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Sua participação
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                {event.name}
              </h1>

              <p className="mt-3 text-muted">
                Organizado por{" "}
                <strong className="text-foreground">
                  {event.organizer.name}
                </strong>
                .
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                isDrawn
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted"
              }`}
            >
              {getEventStatusLabel(event.status)}
            </span>
          </div>
        </header>

        {!isDrawn ? (
          <section className="mt-8 rounded-3xl border border-border bg-surface p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl">
              ?
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-primary">
              Tudo pronto?
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              O sorteio ainda não aconteceu.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-muted">
              Você já está participando deste evento. O
              organizador ainda está preparando os
              participantes e poderá realizar o sorteio
              quando tudo estiver pronto.
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-background p-5">
              <p className="text-sm font-semibold">
                Seu resultado ficará disponível aqui.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                Quando o sorteio acontecer, você poderá
                descobrir quem tirou e se o destino escolheu
                AMIGO ou INIMIGO.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              O sorteio aconteceu
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Seu resultado está disponível.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-muted">
              O sorteio foi realizado. Agora é hora de
              descobrir quem ficou com você e qual foi o seu
              lado da brincadeira.
            </p>

            <Link
              href={`/dashboard/events/${event.id}/result`}
              className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Ver meu resultado
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}