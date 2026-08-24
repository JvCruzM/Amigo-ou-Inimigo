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
  const [removingParticipantId, setRemovingParticipantId] = useState(null);
  const [participantMessage, setParticipantMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEventData() {
      try {
        const resolvedParams = await params;
        const currentEventId = resolvedParams.eventId;

        if (!cancelled) {
          setEventId(currentEventId);
        }

        const [eventResponse, participantsResponse, invitationsResponse] =
          await Promise.all([
            fetch(`/api/events/${currentEventId}`),
            fetch(`/api/events/${currentEventId}/participants`),
            fetch(`/api/events/${currentEventId}/invitations`),
          ]);

        const eventData = await eventResponse.json();
        const participantsData = await participantsResponse.json();
        const invitationsData = await invitationsResponse.json();

        if (!eventResponse.ok) {
          throw new Error(eventData.error || "Erro ao carregar evento.");
        }

        if (!participantsResponse.ok) {
          throw new Error(
            participantsData.error || "Erro ao carregar participantes.",
          );
        }

        if (!invitationsResponse.ok) {
          throw new Error(
            invitationsData.error || "Erro ao carregar convites.",
          );
        }

        if (!cancelled) {
          setEvent(eventData.event);
          setParticipants(participantsData.participants);
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
      const [eventResponse, participantsResponse, invitationsResponse] =
        await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/participants`),
          fetch(`/api/events/${eventId}/invitations`),
        ]);

      const eventData = await eventResponse.json();
      const participantsData = await participantsResponse.json();
      const invitationsData = await invitationsResponse.json();

      if (!eventResponse.ok) {
        throw new Error(eventData.error || "Erro ao atualizar evento.");
      }

      if (!participantsResponse.ok) {
        throw new Error(
          participantsData.error || "Erro ao atualizar participantes.",
        );
      }

      if (!invitationsResponse.ok) {
        throw new Error(invitationsData.error || "Erro ao atualizar convites.");
      }

      setEvent(eventData.event);
      setParticipants(participantsData.participants);
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

      const response = await fetch(`/api/events/${eventId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitationEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar convite.");
      }

      setInvitationEmail("");
      setInvitationMessage("Convite criado com sucesso.");

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
      `Tem certeza que deseja remover ${participant.user.name} deste evento?`,
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
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover participante.");
      }

      setParticipantMessage(`${participant.user.name} foi removido do evento.`);

      await refreshEventData();
    } catch (error) {
      console.error("Erro ao remover participante:", error);

      setParticipantMessage(error.message);
    } finally {
      setRemovingParticipantId(null);
    }
  }

  if (loading) {
    return (
      <main>
        <p>Carregando evento...</p>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main>
        <h1>Erro</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main>
        <h1>Evento não encontrado</h1>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>{event.name}</h1>
        <p>Status: {getEventStatusLabel(event.status)}</p>
      </header>

      {event.status === "DRAWN" && (
        <section>
          <h2>Seu resultado</h2>

          <Link href={`/dashboard/events/${event.id}/result`}>
            Ver meu resultado
          </Link>
        </section>
      )}

      {error && <p>{error}</p>}

      <section>
        <h2>Participantes ({participants.length})</h2>

        {participants.length === 0 ? (
          <p>Nenhum participante ainda.</p>
        ) : (
          <ul>
            {participants.map((participant) => {
              const isOrganizer = participant.userId === event.organizerId;

              return (
                <li key={participant.id}>
                  <strong>{participant.user.name}</strong>
                  <span> — {participant.user.email}</span>

                  {event.status === "DRAFT" && (
                    <span>
                      {isOrganizer ? (
                        <span> — Organizador</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(participant)}
                          disabled={removingParticipantId === participant.id}
                        >
                          {removingParticipantId === participant.id
                            ? "Removendo..."
                            : "Remover"}
                        </button>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {participantMessage && <p>{participantMessage}</p>}
      </section>

      <section>
        <h2>Convidar participante</h2>

        {event.status === "DRAFT" ? (
          <form onSubmit={handleSendInvitation}>
            <div>
              <label htmlFor="invitation-email">E-mail</label>

              <input
                id="invitation-email"
                type="email"
                value={invitationEmail}
                onChange={(event) => setInvitationEmail(event.target.value)}
                placeholder="maria@exemplo.com"
                disabled={sendingInvitation}
              />
            </div>

            <button type="submit" disabled={sendingInvitation}>
              {sendingInvitation ? "Enviando..." : "Enviar convite"}
            </button>

            {invitationMessage && <p>{invitationMessage}</p>}
          </form>
        ) : (
          <p>Não é possível enviar novos convites depois do sorteio.</p>
        )}
      </section>

      <section>
        <h2>Convites ({invitations.length})</h2>

        {invitations.length === 0 ? (
          <p>Nenhum convite enviado.</p>
        ) : (
          <ul>
            {invitations.map((invitation) => {
              const accepted = Boolean(invitation.acceptedAt);

              const expired =
                !accepted && new Date(invitation.expiresAt) <= new Date();

              let status = "Pendente";

              if (accepted) {
                status = "Aceito";
              } else if (expired) {
                status = "Expirado";
              }

              return (
                <li key={invitation.id}>
                  <strong>{invitation.email}</strong>
                  <span> — {status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
