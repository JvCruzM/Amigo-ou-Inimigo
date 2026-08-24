"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token;

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadInvitation() {
      try {
        const response = await fetch(
          `/api/invitations/${token}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erro ao carregar convite."
          );
        }

        setInvitation(data.invitation);
      } catch (error) {
        console.error("Erro ao carregar convite:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInvitation();
    }
  }, [token]);

  async function handleAcceptInvitation() {
    setError("");
    setMessage("");

    try {
      setAccepting(true);

      const response = await fetch(
        `/api/invitations/${token}/accept`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        const callbackUrl = `/invitations/${token}`;

        router.push(
          `/login?callbackUrl=${encodeURIComponent(
            callbackUrl
          )}`
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Erro ao aceitar convite."
        );
      }

      setMessage("Convite aceito com sucesso!");

      router.push(
        `/dashboard/participating/${data.participant.eventId}`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao aceitar convite:",
        error
      );

      setError(error.message);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <p className="text-muted">Carregando convite...</p>
      </main>
    );
  }

  if (error && !invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
          <h1 className="text-2xl font-bold">
            Convite
          </h1>

          <p className="mt-4 text-enemy">
            {error}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block font-semibold underline underline-offset-4"
          >
            Voltar para a página inicial
          </Link>
        </section>
      </main>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-2xl">
        <header className="text-center">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
          >
            Amigo ou Inimigo
          </Link>

          <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-primary">
            Você foi convidado
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {invitation.event.name}
          </h1>
        </header>

        <div className="mt-8 space-y-4 text-center text-muted">
          <p>
            <strong className="text-foreground">
              {invitation.event.organizer.name}
            </strong>{" "}
            convidou você para participar deste evento.
          </p>

          <p>
            Convite enviado para{" "}
            <strong className="text-foreground">
              {invitation.email}
            </strong>
            .
          </p>

          <p className="text-sm">
            Este convite é válido até{" "}
            {new Date(
              invitation.expiresAt
            ).toLocaleString("pt-BR")}
            .
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-6 rounded-xl border border-friend/30 bg-friend/10 px-4 py-3 text-sm text-friend">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleAcceptInvitation}
          disabled={accepting}
          className="mt-8 w-full rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {accepting
            ? "Aceitando convite..."
            : "Aceitar convite"}
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          Ainda não possui uma conta?{" "}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(
              `/invitations/${token}`
            )}`}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}