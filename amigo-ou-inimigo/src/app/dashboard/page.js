"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/events");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar eventos.");
        }

        setEvents(data.events);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <main>
      <h1>Dashboard</h1>

      <p>Login realizado com sucesso.</p>

      <section>
        <h2>Meus eventos</h2>

        {loading && <p>Carregando eventos...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p>Você ainda não criou nenhum evento.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.name}</strong>
                <span> — {event.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}