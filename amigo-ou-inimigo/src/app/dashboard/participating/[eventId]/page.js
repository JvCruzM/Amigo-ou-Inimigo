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
      <main>
        <p>Carregando evento...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Erro</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!participation) {
    return (
      <main>
        <h1>Participação não encontrada</h1>
      </main>
    );
  }

  const { event } = participation;
  const isDrawn = event.status === "DRAWN";

  return (
    <main>
      <header>
        <h1>{event.name}</h1>

        <p>
          Status: {getEventStatusLabel(event.status)}
        </p>
      </header>

      <section>
        <h2>Você está participando</h2>

        <p>
          Organizado por{" "}
          <strong>{event.organizer.name}</strong>.
        </p>
      </section>

      {isDrawn ? (
        <section>
          <h2>Seu resultado está disponível</h2>

          <Link
            href={`/dashboard/events/${event.id}/result`}
          >
            Ver meu resultado
          </Link>
        </section>
      ) : (
        <section>
          <h2>O sorteio ainda não foi realizado</h2>

          <p>
            O organizador ainda está preparando o evento.
          </p>

          <p>
            Seu resultado aparecerá aqui depois que o
            sorteio for realizado.
          </p>
        </section>
      )}
    </main>
  );
}