"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEventStatusLabel } from "@/lib/event-status";

export default function EventPage({ params }) {
  const [eventId, setEventId] = useState(null);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invitationEmail, setInvitationEmail] = useState("");
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState("");

  const [removingParticipantId, setRemovingParticipantId] =
    useState(null);
  const [participantMessage, setParticipantMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEventData() {
      try {
        const resolvedParams = await params;
        const currentEventId = resolvedParams.eventId;

        if (!cancelled) {
          setEventId(currentEventId);
        }

        const [
          eventResponse,
          participantsResponse,
          invitationsResponse,
        ] = await Promise.all([
          fetch(`/api/events/${currentEventId}`),
          fetch(
            `/api/events/${currentEventId}/participants`
          ),
          fetch(
            `/api/events/${currentEventId}/invitations`
          ),
        ]);

        const eventData = await eventResponse.json();
        const participantsData =
          await participantsResponse.json();
        const invitationsData =
          await invitationsResponse.json();

        if (!eventResponse.ok) {
          throw new Error(
            eventData.error || "Erro ao carregar evento."
          );
        }

        if (!participantsResponse.ok) {
          throw new Error(
            participantsData.error ||
              "Erro ao carregar participantes."
          );
        }

        if (!invitationsResponse.ok) {
          throw new Error(
            invitationsData.error ||
              "Erro ao carregar convites."
          );
        }

        if (!cancelled) {
          setEvent(eventData.event);
          setParticipants(
            participantsData.participants
          );
          setInvitations(invitationsData.invitations);
        }
      } catch (error) {
        console.error("Erro ao carregar evento:", error);

        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEventData();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function refreshEventData() {
    if (!eventId) {
      return;
    }

    try {
      const [
        eventResponse,
        participantsResponse,
        invitationsResponse,
      ] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/participants`),
        fetch(`/api/events/${eventId}/invitations`),
      ]);

      const eventData = await eventResponse.json();
      const participantsData =
        await participantsResponse.json();
      const invitationsData =
        await invitationsResponse.json();

      if (!eventResponse.ok) {
        throw new Error(
          eventData.error || "Erro ao atualizar evento."
        );
      }

      if (!participantsResponse.ok) {
        throw new Error(
          participantsData.error ||
            "Erro ao atualizar participantes."
        );
      }

      if (!invitationsResponse.ok) {
        throw new Error(
          invitationsData.error ||
            "Erro ao atualizar convites."
        );
      }

      setEvent(eventData.event);
      setParticipants(
        participantsData.participants
      );
      setInvitations(invitationsData.invitations);
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      setError(error.message);
    }
  }

  async function handleSendInvitation(event) {
    event.preventDefault();

    if (!invitationEmail.trim()) {
      setInvitationMessage("Digite um e-mail.");
      return;
    }

    try {
      setSendingInvitation(true);
      setInvitationMessage("");
      setError("");

      const response = await fetch(
        `/api/events/${eventId}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: invitationEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao enviar convite."
        );
      }

      setInvitationEmail("");
      setInvitationMessage(
        "Convite criado com sucesso."
      );

      await refreshEventData();
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      setInvitationMessage(error.message);
    } finally {
      setSendingInvitation(false);
    }
  }

  async function handleRemoveParticipant(participant) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${participant.user.name} deste evento?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingParticipantId(participant.id);
      setParticipantMessage("");
      setError("");

      const response = await fetch(
        `/api/events/${eventId}/participants/${participant.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao remover participante."
        );
      }

      setParticipantMessage(
        `${participant.user.name} foi removido do evento.`
      );

      await refreshEventData();
    } catch (error) {
      console.error(
        "Erro ao remover participante:",
        error
      );

      setParticipantMessage(error.message);
    } finally {
      setRemovingParticipantId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6">
          <p className="text-muted">Carregando evento...</p>
        </div>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6">
          <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
            <h1 className="text-2xl font-bold">Erro</h1>

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

  if (!event) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6">
          <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
            <h1 className="text-2xl font-bold">
              Evento não encontrado
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

  const isDraft = event.status === "DRAFT";
  const isDrawn = event.status === "DRAWN";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          ← Voltar para o Dashboard
        </Link>

        <header className="mt-8 rounded-3xl border border-border bg-surface p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Evento
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                {event.name}
              </h1>

              <p className="mt-3 text-muted">
                {isDraft
                  ? "Prepare os participantes e finalize o sorteio quando tudo estiver pronto."
                  : "O sorteio já foi realizado e a composição do evento está congelada."}
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

          {isDrawn && (
            <div className="mt-8 border-t border-border pt-6">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Resultado disponível
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  O sorteio já foi realizado.
                </h2>

                <p className="mt-2 text-muted">
                  Consulte o seu resultado secreto.
                </p>

                <Link
                  href={`/dashboard/events/${event.id}/result`}
                  className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  Ver meu resultado
                </Link>
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
            {error}
          </div>
        )}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Pessoas
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Participantes
              </h2>
            </div>

            <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
              {participants.length}
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/40 p-8">
              <h3 className="text-lg font-semibold">
                Nenhum participante ainda.
              </h3>

              <p className="mt-2 text-muted">
                Envie um convite para começar a montar seu
                grupo.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {participants.map((participant) => {
                const isOrganizer =
                  participant.userId ===
                  event.organizerId;

                return (
                  <article
                    key={participant.id}
                    className="rounded-2xl border border-border bg-surface p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold">
                          {participant.user.name}
                        </h3>

                        <p className="mt-1 truncate text-sm text-muted">
                          {participant.user.email}
                        </p>
                      </div>

                      {isOrganizer && (
                        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Organizador
                        </span>
                      )}
                    </div>

                    {isDraft && !isOrganizer && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveParticipant(
                            participant
                          )
                        }
                        disabled={
                          removingParticipantId ===
                          participant.id
                        }
                        className="mt-5 rounded-xl border border-enemy/30 px-4 py-2 text-sm font-semibold text-enemy transition-colors hover:bg-enemy/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingParticipantId ===
                        participant.id
                          ? "Removendo..."
                          : "Remover participante"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {participantMessage && (
            <p className="mt-4 rounded-xl border border-friend/30 bg-friend/10 px-4 py-3 text-sm text-friend">
              {participantMessage}
            </p>
          )}
        </section>

        {isDraft && (
          <section className="mt-10">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Convite
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Convidar participante
              </h2>

              <p className="mt-2 text-muted">
                Envie um convite para alguém entrar no evento.
              </p>

              <form
                onSubmit={handleSendInvitation}
                className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <div className="flex-1">
                  <label
                    htmlFor="invitation-email"
                    className="mb-2 block text-sm font-medium"
                  >
                    E-mail
                  </label>

                  <input
                    id="invitation-email"
                    type="email"
                    value={invitationEmail}
                    onChange={(event) =>
                      setInvitationEmail(
                        event.target.value
                      )
                    }
                    placeholder="maria@exemplo.com"
                    disabled={sendingInvitation}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingInvitation}
                  className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingInvitation
                    ? "Enviando..."
                    : "Enviar convite"}
                </button>
              </form>

              {invitationMessage && (
                <p className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                  {invitationMessage}
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Convites
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Convites enviados
              </h2>
            </div>

            <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">
              {invitations.length}
            </span>
          </div>

          {invitations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/40 p-8">
              <p className="text-muted">
                Nenhum convite enviado.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
              <ul className="divide-y divide-border">
                {invitations.map((invitation) => {
                  const accepted = Boolean(
                    invitation.acceptedAt
                  );

                  const expired =
                    !accepted &&
                    new Date(invitation.expiresAt) <=
                      new Date();

                  let status = "Pendente";
                  let statusClasses =
                    "border-primary/30 bg-primary/10 text-primary";

                  if (accepted) {
                    status = "Aceito";
                    statusClasses =
                      "border-friend/30 bg-friend/10 text-friend";
                  } else if (expired) {
                    status = "Expirado";
                    statusClasses =
                      "border-enemy/30 bg-enemy/10 text-enemy";
                  }

                  return (
                    <li
                      key={invitation.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {invitation.email}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          Expira em{" "}
                          {new Date(
                            invitation.expiresAt
                          ).toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}
                      >
                        {status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}