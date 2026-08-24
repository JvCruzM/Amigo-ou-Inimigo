"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEventStatusLabel } from "@/lib/event-status";

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [participatingEvents, setParticipatingEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setError("");

      const [organizedResponse, participatingResponse] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/events/participating"),
      ]);

      const organizedData = await organizedResponse.json();
      const participatingData = await participatingResponse.json();

      if (!organizedResponse.ok) {
        throw new Error(
          organizedData.error || "Erro ao carregar seus eventos.",
        );
      }

      if (!participatingResponse.ok) {
        throw new Error(
          participatingData.error ||
            "Erro ao carregar eventos dos quais você participa.",
        );
      }

      setEvents(organizedData.events);

      const organizedEventIds = new Set(
        organizedData.events.map((event) => event.id),
      );

      const onlyParticipating = participatingData.events.filter(
        (event) => !organizedEventIds.has(event.id),
      );

      setParticipatingEvents(onlyParticipating);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setError(error.message);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialEvents() {
      try {
        const [organizedResponse, participatingResponse] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/events/participating"),
        ]);

        const organizedData = await organizedResponse.json();
        const participatingData = await participatingResponse.json();

        if (!organizedResponse.ok) {
          throw new Error(
            organizedData.error || "Erro ao carregar seus eventos.",
          );
        }

        if (!participatingResponse.ok) {
          throw new Error(
            participatingData.error ||
              "Erro ao carregar eventos dos quais você participa.",
          );
        }

        if (!cancelled) {
          setEvents(organizedData.events);

          const organizedEventIds = new Set(
            organizedData.events.map((event) => event.id),
          );

          const onlyParticipating = participatingData.events.filter(
            (event) => !organizedEventIds.has(event.id),
          );

          setParticipatingEvents(onlyParticipating);
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

    fetchInitialEvents();

    return () => {
      cancelled = true;
    };
  }, []);

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
      <header>
        <h1>Dashboard</h1>
      </header>

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

      {!loading && (
        <section>
          <h2>Eventos que participo</h2>

          {participatingEvents.length === 0 ? (
            <p>Você ainda não participa de nenhum outro evento.</p>
          ) : (
            <ul>
              {participatingEvents.map((event) => (
                <li key={event.id}>
                  <Link href={`/dashboard/participating/${event.id}`}>
                    <strong>{event.name}</strong>
                    <span> — {getEventStatusLabel(event.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && <p>{error}</p>}
    </main>
  );
}
