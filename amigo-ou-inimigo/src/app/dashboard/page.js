"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEventStatusLabel } from "@/lib/event-status";

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar eventos.");
        }

        if (!cancelled) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);

        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadEvents() {
    try {
      setError("");

      const response = await fetch("/api/events");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar eventos.");
      }

      setEvents(data.events);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setError(error.message);
    }
  }

  async function handleCreateEvent(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Digite um nome para o evento.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar evento.");
      }

      setName("");
      setShowForm(false);

      await loadEvents();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      setError(error.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main>
      <h1>Dashboard</h1>

      <p>Login realizado com sucesso.</p>

      <section>
        <div>
          <h2>Meus eventos</h2>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
          >
            {showForm ? "Cancelar" : "+ Criar evento"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateEvent}>
            <div>
              <label htmlFor="event-name">Nome do evento</label>

              <input
                id="event-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Amigo ou Inimigo 2026"
                disabled={creating}
              />
            </div>

            <button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar evento"}
            </button>
          </form>
        )}

        {error && <p>{error}</p>}

        {loading && <p>Carregando eventos...</p>}

        {!loading && !error && events.length === 0 && (
          <p>Você ainda não criou nenhum evento.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/dashboard/events/${event.id}`}>
                  <strong>{event.name}</strong>
                  <span> — {getEventStatusLabel(event.status)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
