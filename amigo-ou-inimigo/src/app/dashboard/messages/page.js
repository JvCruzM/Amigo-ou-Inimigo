"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/messages");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Não foi possível carregar suas mensagens.",
          );
        }

        if (!active) {
          return;
        }

        setConversations(data.conversations ?? []);
      } catch (error) {
        console.error(
          "Erro ao carregar mensagens:",
          error,
        );

        if (active) {
          setError(error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      active = false;
    };
  }, []);

  function formatMessageTime(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center justify-center px-6 py-12">
        <p className="text-muted">
          Carregando mensagens...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Conversas anônimas
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Mensagens
        </h1>

        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Converse anonimamente com as pessoas relacionadas
          aos seus sorteios.
        </p>
      </header>

      {error && (
        <div className="mt-8 rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
          {error}
        </div>
      )}

      {!error && conversations.length === 0 && (
        <section className="mt-8 rounded-[2rem] border border-border bg-surface p-8 text-center shadow-xl sm:p-10">
          <div className="mx-auto max-w-md">
            <h2 className="text-xl font-bold tracking-tight">
              Nenhuma conversa ainda
            </h2>

            <p className="mt-3 leading-7 text-muted">
              Depois que um evento tiver o sorteio realizado,
              suas conversas anônimas aparecerão aqui.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center font-semibold text-foreground transition-colors hover:text-primary"
            >
              ← Voltar para o Dashboard
            </Link>
          </div>
        </section>
      )}

      {conversations.length > 0 && (
        <section className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-xl">
          <div className="divide-y divide-border">
            {conversations.map((conversation) => {
              const lastMessage =
                conversation.lastMessage;

              const href =
                `/dashboard/events/${conversation.eventId}/messages` +
                `?conversationId=${encodeURIComponent(
                  conversation.conversationId,
                )}`;

              return (
                <Link
                  key={conversation.conversationId}
                  href={href}
                  className="block px-5 py-5 transition-colors hover:bg-background sm:px-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.5-.75L4 20l1.4-4.5A8.38 8.38 0 0 1 4.5 11.5a8.5 8.5 0 1 1 16.5 0Z" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {conversation.eventName}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            Conversa anônima
                          </p>
                        </div>

                        {lastMessage && (
                          <span className="shrink-0 text-xs text-muted">
                            {formatMessageTime(
                              lastMessage.createdAt,
                            )}
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        {lastMessage ? (
                          <p className="truncate text-sm text-muted">
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted">
                            Nenhuma mensagem ainda
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className="mt-3 text-muted"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}