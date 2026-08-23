"use client";

import { useEffect, useState } from "react";

export default function InvitationPage({ params }) {
  const [token, setToken] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvitation() {
      try {
        const resolvedParams = await params;
        setToken(resolvedParams.token);

        const response = await fetch(
          `/api/invitations/${resolvedParams.token}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar convite.");
        }

        setInvitation(data.invitation);
      } catch (error) {
        console.error("Erro ao carregar convite:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [params]);

  if (loading) {
    return (
      <main>
        <h1>Convite</h1>
        <p>Carregando convite...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Convite</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Você foi convidado!</h1>

      <section>
        <h2>{invitation.event.name}</h2>

        <p>
          Organizado por:{" "}
          <strong>{invitation.event.organizer.name}</strong>
        </p>

        <p>
          Convite enviado para:{" "}
          <strong>{invitation.email}</strong>
        </p>

        <p>
          Este convite é válido até:{" "}
          {new Date(invitation.expiresAt).toLocaleString("pt-BR")}
        </p>

        <button type="button">
          Aceitar convite
        </button>
      </section>
    </main>
  );
}