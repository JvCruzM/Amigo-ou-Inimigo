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

      const [organizedResponse, participatingResponse] =
        await Promise.all([
          fetch("/api/events"),
          fetch("/api/events/participating"),
        ]);

      const organizedData = await organizedResponse.json();
      const participatingData =
        await participatingResponse.json();

      if (!organizedResponse.ok) {
        throw new Error(
          organizedData.error ||
            "Erro ao carregar seus eventos."
        );
      }

      if (!participatingResponse.ok) {
        throw new Error(
          participatingData.error ||
            "Erro ao carregar eventos dos quais você participa."
        );
      }

      setEvents(organizedData.events);

      const organizedEventIds = new Set(
        organizedData.events.map((event) => event.id)
      );

      const onlyParticipating =
        participatingData.events.filter(
          (event) => !organizedEventIds.has(event.id)
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
        const [
          organizedResponse,
          participatingResponse,
        ] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/events/participating"),
        ]);

        const organizedData =
          await organizedResponse.json();

        const participatingData =
          await participatingResponse.json();

        if (!organizedResponse.ok) {
          throw new Error(
            organizedData.error ||
              "Erro ao carregar seus eventos."
          );
        }

        if (!participatingResponse.ok) {
          throw new Error(
            participatingData.error ||
              "Erro ao carregar eventos dos quais você participa."
          );
        }

        if (!cancelled) {
          setEvents(organizedData.events);

          const organizedEventIds = new Set(
            organizedData.events.map((event) => event.id)
          );

          const onlyParticipating =
            participatingData.events.filter(
              (event) => !organizedEventIds.has(event.id)
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
        throw new Error(
          data.error || "Erro ao criar evento."
        );
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Área do jogador
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-muted">
              Organize seus eventos, acompanhe suas
              participações e descubra seus resultados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {showForm ? "Cancelar" : "+ Criar evento"}
          </button>
        </header>

        {showForm && (
          <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">
                Novo evento
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Crie sua próxima brincadeira
              </h2>

              <p className="mt-2 text-muted">
                Depois você poderá convidar os participantes
                por e-mail.
              </p>
            </div>

            <form
              onSubmit={handleCreateEvent}
              className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="event-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Nome do evento
                </label>

                <input
                  id="event-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Ex.: Amigo ou Inimigo 2026"
                  disabled={creating}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating
                  ? "Criando..."
                  : "Criar evento"}
              </button>
            </form>
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
            {error}
          </div>
        )}

        {loading ? (
          <section className="mt-12 rounded-2xl border border-border bg-surface p-8">
            <p className="text-muted">
              Carregando seus eventos...
            </p>
          </section>
        ) : (
          <>
            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    Organização
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Meus eventos
                  </h2>
                </div>

                <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
                  {events.length}
                </span>
              </div>

              {events.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/40 p-8">
                  <h3 className="text-lg font-semibold">
                    Você ainda não criou nenhum evento.
                  </h3>

                  <p className="mt-2 text-muted">
                    Comece criando um evento e convide seus
                    amigos.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-5 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Criar primeiro evento
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-hover"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold">
                            {event.name}
                          </h3>

                          <p className="mt-2 text-sm text-muted">
                            Gerenciado por você
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
                          {getEventStatusLabel(
                            event.status
                          )}
                        </span>
                      </div>

                      <div className="mt-8 flex items-center justify-between text-sm">
                        <span className="text-muted">
                          Abrir evento
                        </span>

                        <span className="font-semibold text-foreground transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-16 border-t border-border pt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    Participações
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Eventos que participo
                  </h2>
                </div>

                <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
                  {participatingEvents.length}
                </span>
              </div>

              {participatingEvents.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/40 p-8">
                  <h3 className="text-lg font-semibold">
                    Você ainda não participa de outros eventos.
                  </h3>

                  <p className="mt-2 text-muted">
                    Quando alguém convidar você e o convite
                    for aceito, o evento aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {participatingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/participating/${event.id}`}
                      className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-hover"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold">
                            {event.name}
                          </h3>

                          <p className="mt-2 text-sm text-muted">
                            Evento do qual você participa
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
                          {getEventStatusLabel(
                            event.status
                          )}
                        </span>
                      </div>

                      <div className="mt-8 flex items-center justify-between text-sm">
                        <span className="text-muted">
                          Ver participação
                        </span>

                        <span className="font-semibold text-foreground transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}