"use client";

import { useEffect, useState } from "react";
import { getEventStatusLabel } from "@/lib/event-status";

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
      <main>
        <p>Carregando resultado...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Resultado</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main>
        <h1>Resultado não encontrado</h1>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>{result.event.name}</h1>

        <p>
          Sorteio:{" "}
          {getEventStatusLabel("DRAWN")}
        </p>
      </header>

      <section>
        <h2>Seu resultado</h2>

        <p>Você tirou:</p>

        <strong>{result.receiver.name}</strong>

        <p>Tipo:</p>

        <strong>{result.type}</strong>
      </section>
    </main>
  );
}