"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { setRealtimeAuth, supabaseBrowser } from "@/lib/supabase-browser";

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const channelsRef = useRef([]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/messages", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível carregar suas mensagens.",
        );
      }

      setConversations(data.conversations ?? []);

      return data.conversations ?? [];
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);

      setError(error.message);

      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeMessages() {
      try {
        setLoading(true);

        setError("");

        const availableConversations = await loadConversations();

        if (!active || availableConversations.length === 0) {
          return;
        }

        await setRealtimeAuth();

        if (!active) {
          return;
        }

        for (const conversation of availableConversations) {
          const channel = supabaseBrowser
            .channel(`messages-list-${conversation.conversationId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "AnonymousMessage",
                filter: `conversationId=eq.${conversation.conversationId}`,
              },
              async () => {
                if (!active) {
                  return;
                }

                await loadConversations();
              },
            )
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                console.log(
                  "Realtime da lista conectado:",
                  conversation.conversationId,
                );
              }

              if (status === "CHANNEL_ERROR") {
                console.error(
                  "Erro no canal Realtime da lista:",
                  conversation.conversationId,
                );
              }
            });

          channelsRef.current.push(channel);
        }
      } catch (error) {
        console.error("Erro ao inicializar mensagens em tempo real:", error);

        if (active) {
          setError(error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeMessages();

    return () => {
      active = false;

      for (const channel of channelsRef.current) {
        supabaseBrowser.removeChannel(channel);
      }

      channelsRef.current = [];
    };
  }, [loadConversations]);

  function formatMessageTime(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getConversationInfo(relationship) {
    switch (relationship) {
      case "I_DREW":
        return {
          label: "Pessoa que você sorteou",
          description: "Conversa anônima com a pessoa sorteada por você",
        };

      case "DREW_ME":
        return {
          label: "Pessoa que sorteou você",
          description: "Conversa anônima com a pessoa que tirou você",
        };

      case "MUTUAL":
        return {
          label: "Pessoa que você sorteou e que sorteou você",
          description: "Conversa anônima recíproca",
        };

      default:
        return {
          label: "Conversa anônima",
          description: "Conversa anônima",
        };
    }
  }

  function renderConversation(conversation) {
    const lastMessage = conversation.lastMessage;

    const unreadCount = conversation.unreadCount ?? 0;

    const conversationInfo = getConversationInfo(conversation.relationship);

    const href =
      `/dashboard/events/${conversation.eventId}/messages` +
      `?conversationId=${encodeURIComponent(conversation.conversationId)}`;

    return (
      <Link
        key={conversation.conversationId}
        href={href}
        className={`group block px-5 py-5 transition-colors hover:bg-background sm:px-6 ${
          unreadCount > 0 ? "bg-primary/[0.035]" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl transition-colors ${
              unreadCount > 0
                ? "bg-primary/15 text-primary"
                : "bg-primary/10 text-primary"
            }`}
          >
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
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate ${
                      unreadCount > 0 ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {conversation.eventName}
                  </p>

                  {unreadCount > 0 && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>

                <p
                  className={`mt-1 text-sm ${
                    unreadCount > 0
                      ? "font-medium text-foreground"
                      : "text-muted"
                  }`}
                >
                  {conversationInfo.label}
                </p>
              </div>

              {lastMessage && (
                <span
                  className={`shrink-0 text-xs ${
                    unreadCount > 0
                      ? "font-semibold text-primary"
                      : "text-muted"
                  }`}
                >
                  {formatMessageTime(lastMessage.createdAt)}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                {lastMessage ? (
                  <p
                    className={`truncate text-sm ${
                      unreadCount > 0
                        ? "font-medium text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted">Nenhuma mensagem ainda</p>
                )}
              </div>

              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} ${
                    unreadCount === 1
                      ? "mensagem não lida"
                      : "mensagens não lidas"
                  }`}
                  className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold leading-none text-white"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              <span
                className="shrink-0 text-lg text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const conversationsIChose = conversations.filter(
    (conversation) => conversation.relationship === "I_DREW",
  );

  const conversationsWhoChoseMe = conversations.filter(
    (conversation) => conversation.relationship === "DREW_ME",
  );

  const mutualConversations = conversations.filter(
    (conversation) => conversation.relationship === "MUTUAL",
  );

  const renderConversationSection = ({ title, description, items }) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <p className="text-sm font-semibold">{title}</p>

          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>

        <div className="divide-y divide-border">
          {items.map((conversation) => renderConversation(conversation))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />

          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />

          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />

          <p className="ml-1 text-sm">Carregando mensagens...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
          </span>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Conversas anônimas
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Mensagens
            </h1>
          </div>
        </div>

        <p className="mt-4 leading-7 text-muted">
          Tire suas dúvidas, peça dicas e converse de forma anônima com as
          pessoas relacionadas aos seus sorteios.
        </p>
      </header>

      {error && (
        <div className="mt-8 rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
          {error}
        </div>
      )}

      {!error && conversations.length === 0 && (
        <section className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-xl">
          <div className="px-8 py-12 text-center sm:px-10 sm:py-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.5-.75L4 20l1.4-4.5A8.38 8.38 0 0 1 4.5 11.5a8.5 8.5 0 1 1 16.5 0Z" />
              </svg>
            </div>

            <h2 className="mt-6 text-xl font-bold tracking-tight">
              Nenhuma conversa ainda
            </h2>

            <p className="mx-auto mt-3 max-w-md leading-7 text-muted">
              Depois que um evento tiver o sorteio realizado, suas conversas
              anônimas aparecerão aqui.
            </p>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center font-semibold text-foreground transition-colors hover:text-primary"
            >
              ← Voltar para o Dashboard
            </Link>
          </div>
        </section>
      )}

      {conversations.length > 0 && (
        <div className="mt-8 space-y-6">
          {renderConversationSection({
            title: "Pessoas que você sorteou",
            description: "Conversas com as pessoas que você tirou no sorteio.",
            items: conversationsIChose,
          })}

          {renderConversationSection({
            title: "Pessoas que sortearam você",
            description:
              "Conversas com as pessoas que tiraram você no sorteio.",
            items: conversationsWhoChoseMe,
          })}

          {renderConversationSection({
            title: "Conversas recíprocas",
            description: "Quando você e a outra pessoa sortearam um ao outro.",
            items: mutualConversations,
          })}
        </div>
      )}
    </main>
  );
}
