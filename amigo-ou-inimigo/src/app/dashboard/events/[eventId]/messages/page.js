"use client";

import Link from "next/link";

import { useParams, useSearchParams } from "next/navigation";

import { useCallback, useEffect, useRef, useState } from "react";

import { setRealtimeAuth, supabaseBrowser } from "@/lib/supabase-browser";

export default function MessagesPage() {
  const { eventId } = useParams();

  const searchParams = useSearchParams();

  const requestedConversationId = searchParams.get("conversationId");

  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  const textareaRef = useRef(null);

  const activeConversationRef = useRef(null);

  const refreshSequenceRef = useRef(0);

  const markConversationAsRead = useCallback(
    async (selectedConversationId) => {
      if (!selectedConversationId) {
        return;
      }

      try {
        const response = await fetch(`/api/events/${eventId}/messages/read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: selectedConversationId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível marcar as mensagens como lidas.",
          );
        }

        window.dispatchEvent(new Event("unread-messages-updated"));

        console.log("Mensagens marcadas como lidas:", data.updatedCount);
      } catch (error) {
        console.error("Erro ao marcar mensagens como lidas:", error);
      }
    },
    [eventId],
  );

  const updateConversationActivity = useCallback(
    async (selectedConversationId) => {
      if (!selectedConversationId) {
        return;
      }

      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }

      try {
        const response = await fetch(
          `/api/events/${eventId}/messages/activity`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversationId: selectedConversationId,
            }),
          },
        );

        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            data.error || "Não foi possível atualizar a atividade da conversa.",
          );
        }
      } catch (error) {
        console.error("Erro ao atualizar atividade da conversa:", error);
      }
    },
    [eventId],
  );

  const clearConversationActivity = useCallback(
    async (selectedConversationId) => {
      if (!selectedConversationId) {
        return;
      }

      try {
        await fetch(`/api/events/${eventId}/messages/activity`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: selectedConversationId,
          }),
          keepalive: true,
        });
      } catch (error) {
        console.error("Erro ao remover atividade da conversa:", error);
      }
    },
    [eventId],
  );

  const refreshMessages = useCallback(
    async (selectedConversationId) => {
      if (!selectedConversationId) {
        return;
      }

      const requestId = ++refreshSequenceRef.current;

      try {
        const response = await fetch(
          `/api/events/${eventId}/messages?_t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível atualizar as mensagens.",
          );
        }

        if (requestId !== refreshSequenceRef.current) {
          return;
        }

        const refreshedConversation = data.conversations?.find(
          (conversation) => conversation.id === selectedConversationId,
        );

        if (!refreshedConversation) {
          return;
        }

        setMessages(refreshedConversation.messages ?? []);

        return refreshedConversation;
      } catch (error) {
        console.error("Erro ao atualizar mensagens:", error);
      }
    },
    [eventId],
  );

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let active = true;

    let channel = null;

    let activityInterval = null;

    async function initializeChat() {
      try {
        setLoading(true);

        setError("");

        const response = await fetch(
          `/api/events/${eventId}/messages?_t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível carregar as conversas.",
          );
        }

        if (!active) {
          return;
        }

        const availableConversations = data.conversations ?? [];

        let selectedConversation = null;

        if (requestedConversationId) {
          selectedConversation =
            availableConversations.find(
              (conversation) => conversation.id === requestedConversationId,
            ) ?? null;

          if (!selectedConversation) {
            throw new Error("Você não tem acesso a esta conversa.");
          }
        } else if (availableConversations.length === 1) {
          selectedConversation = availableConversations[0];
        } else if (availableConversations.length > 1) {
          throw new Error("Selecione uma conversa pela página de mensagens.");
        }

        if (!selectedConversation) {
          setConversationId(null);

          setMessages([]);

          return;
        }

        activeConversationRef.current = selectedConversation.id;

        setConversationId(selectedConversation.id);

        setMessages(selectedConversation.messages ?? []);

        await markConversationAsRead(selectedConversation.id);

        await updateConversationActivity(selectedConversation.id);

        activityInterval = window.setInterval(() => {
          updateConversationActivity(selectedConversation.id);
        }, 10_000);

        await setRealtimeAuth();

        if (!active) {
          return;
        }

        channel = supabaseBrowser
          .channel(`anonymous-messages-${selectedConversation.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "AnonymousMessage",
              filter: `conversationId=eq.${selectedConversation.id}`,
            },
            async () => {
              if (!active) {
                return;
              }

              console.log("Realtime INSERT recebido:", selectedConversation.id);

              await refreshMessages(selectedConversation.id);

              if (document.visibilityState === "visible") {
                await markConversationAsRead(selectedConversation.id);

                await updateConversationActivity(selectedConversation.id);
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "AnonymousMessage",
              filter: `conversationId=eq.${selectedConversation.id}`,
            },
            async () => {
              if (!active) {
                return;
              }

              console.log("Realtime UPDATE recebido:", selectedConversation.id);

              await refreshMessages(selectedConversation.id);
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Realtime conectado:", selectedConversation.id);
            }

            if (status === "CHANNEL_ERROR") {
              console.error("Erro no canal Realtime.");
            }

            if (status === "TIMED_OUT") {
              console.error("Timeout no canal Realtime.");
            }

            if (status === "CLOSED") {
              console.log("Canal Realtime fechado:", selectedConversation.id);
            }
          });
      } catch (error) {
        console.error("Erro ao inicializar chat:", error);

        if (active) {
          setError(error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeChat();

    async function handleVisibilityChange() {
      const selectedConversationId = activeConversationRef.current;

      if (!selectedConversationId || !active) {
        return;
      }

      if (document.visibilityState === "visible") {
        await updateConversationActivity(selectedConversationId);

        await markConversationAsRead(selectedConversationId);

        await refreshMessages(selectedConversationId);

        window.dispatchEvent(new Event("unread-messages-updated"));

        return;
      }

      await clearConversationActivity(selectedConversationId);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (activityInterval) {
        window.clearInterval(activityInterval);
      }

      if (channel) {
        supabaseBrowser.removeChannel(channel);
      }

      const selectedConversationId = activeConversationRef.current;

      if (selectedConversationId) {
        void clearConversationActivity(selectedConversationId);
      }

      activeConversationRef.current = null;
    };
  }, [
    eventId,
    requestedConversationId,
    markConversationAsRead,
    updateConversationActivity,
    clearConversationActivity,
    refreshMessages,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!loading && conversationId) {
      textareaRef.current?.focus();
    }
  }, [loading, conversationId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || sending) {
      return;
    }

    try {
      setSending(true);

      setError("");

      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content: trimmedContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível enviar a mensagem.");
      }

      setContent("");

      const sentMessage = {
        id: data.message.id,
        content: data.message.content,
        createdAt: data.message.createdAt,
        readAt: data.message.readAt,
        isMine: true,
      };

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (message) => message.id === sentMessage.id,
        );

        if (alreadyExists) {
          return currentMessages;
        }

        return [...currentMessages, sentMessage];
      });

      await updateConversationActivity(conversationId);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      setError(error.message);
    } finally {
      setSending(false);
    }
  }

  function handleTextareaKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!sending && content.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  function formatMessageTime(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100dvh-73px)] items-center justify-center bg-background px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
          </div>

          <p className="text-sm text-muted">Carregando conversa...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[calc(100dvh-73px)] items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-surface p-7 text-center shadow-2xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-enemy/10 text-enemy">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />

              <path d="m15 9-6 6" />

              <path d="m9 9 6 6" />
            </svg>
          </div>

          <p className="mt-5 text-sm leading-6 text-enemy">{error}</p>

          <Link
            href="/dashboard/messages"
            className="mt-7 inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
          >
            ← Voltar para mensagens
          </Link>
        </div>
      </main>
    );
  }

  if (!conversationId) {
    return (
      <main className="flex min-h-[calc(100dvh-73px)] items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-surface p-7 text-center shadow-2xl sm:p-8">
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

          <h1 className="mt-6 text-xl font-bold tracking-tight">
            Nenhuma conversa disponível
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Você ainda não possui uma conversa anônima disponível neste evento.
          </p>

          <Link
            href="/dashboard/messages"
            className="mt-7 inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
          >
            ← Voltar para mensagens
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background px-0 py-0 sm:px-4 sm:py-5">
      <div className="mx-auto flex h-[calc(100dvh-73px)] w-full max-w-4xl flex-col overflow-hidden border border-border bg-surface shadow-2xl sm:h-[calc(100dvh-113px)] sm:rounded-[2rem]">
        <header className="shrink-0 border-b border-border bg-surface px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.5-.75L4 20l1.4-4.5A8.38 8.38 0 0 1 4.5 11.5a8.5 8.5 0 1 1 16.5 0Z" />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Conversa anônima
                </p>

                <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
                  Chat privado
                </h1>
              </div>
            </div>

            <Link
              href="/dashboard/messages"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              <span className="hidden sm:inline">← Mensagens</span>

              <span className="sm:hidden" aria-hidden="true">
                ←
              </span>
            </Link>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />

              <path d="M12 10v6" />

              <path d="M12 7.5h.01" />
            </svg>

            <p className="text-xs leading-5 text-muted sm:text-sm">
              Sua identidade permanece escondida durante toda a conversa. Não
              revele informações que possam identificar você.
            </p>
          </div>
        </header>

        <section className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-background px-3 py-5 sm:px-6 sm:py-6">
          {messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center text-center">
              <div className="max-w-sm px-6">
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

                <p className="mt-5 text-base font-semibold">
                  Nenhuma mensagem ainda
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Comece a conversa para descobrir mais sobre a pessoa do outro
                  lado.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
              {messages.map((message) => {
                const isMine = message.isMine;

                const messageIsRead = isMine && Boolean(message.readAt);

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`group max-w-[88%] sm:max-w-[75%] ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-[1.25rem] px-4 py-3 shadow-sm ${
                          isMine
                            ? "rounded-br-md bg-primary text-white"
                            : "rounded-bl-md border border-border bg-surface"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[14px] leading-6 sm:text-sm">
                          {message.content}
                        </p>

                        <div
                          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                            isMine ? "text-white/70" : "text-muted"
                          }`}
                        >
                          <span>{formatMessageTime(message.createdAt)}</span>

                          {isMine && (
                            <span
                              className={`text-[11px] font-semibold tracking-[-0.15em] ${
                                messageIsRead ? "text-white" : "text-white/70"
                              }`}
                              aria-label={
                                messageIsRead
                                  ? "Mensagem lida"
                                  : "Mensagem enviada"
                              }
                            >
                              {messageIsRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          )}
        </section>

        <footer className="shrink-0 border-t border-border bg-surface p-3 sm:p-4">
          {error && (
            <div className="mb-3 rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-2xl items-center gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={sending}
                maxLength={2000}
                className="chat-input-scrollbar max-h-32 min-h-[48px] w-full resize-none rounded-[1.25rem] border border-border bg-background px-4 py-3 pr-12 text-sm leading-6 outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <span className="pointer-events-none absolute bottom-1.5 right-4 text-[10px] text-muted">
                {content.length > 0 ? `${content.length}/2000` : ""}
              </span>
            </div>

            <button
              type="submit"
              disabled={sending || !content.trim()}
              aria-label="Enviar mensagem"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
              ) : (
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
                  <path d="m5 12 14-7-4 14-3.5-5.5L5 12Z" />
                  <path d="M11.5 13.5 19 5" />
                </svg>
              )}
            </button>
          </form>
        </footer>
      </div>
    </main>
  );
}
