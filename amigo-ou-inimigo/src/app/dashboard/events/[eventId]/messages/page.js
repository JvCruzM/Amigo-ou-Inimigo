"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let active = true;
    let channel = null;

    async function initializeChat() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/events/${eventId}/messages`);

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

        setConversationId(selectedConversation.id);
        setMessages(selectedConversation.messages ?? []);

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
              try {
                const response = await fetch(`/api/events/${eventId}/messages`);

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(
                    data.error || "Não foi possível atualizar as mensagens.",
                  );
                }

                if (!active) {
                  return;
                }

                const refreshedConversation = data.conversations?.find(
                  (conversation) => conversation.id === selectedConversation.id,
                );

                if (!refreshedConversation) {
                  return;
                }

                setMessages(refreshedConversation.messages ?? []);
              } catch (error) {
                console.error(
                  "Erro ao atualizar mensagens em tempo real:",
                  error,
                );
              }
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Realtime conectado:", selectedConversation.id);
            }

            if (status === "CHANNEL_ERROR") {
              console.error("Erro no canal Realtime.");
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

    return () => {
      active = false;

      if (channel) {
        supabaseBrowser.removeChannel(channel);
      }
    };
  }, [eventId, requestedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      setError(error.message);
    } finally {
      setSending(false);
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
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <p className="text-muted">Carregando conversa...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-surface p-8 text-center shadow-2xl">
          <p className="text-sm text-enemy">{error}</p>

          <Link
            href="/dashboard/messages"
            className="mt-6 inline-block text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Voltar para mensagens
          </Link>
        </div>
      </main>
    );
  }

  if (!conversationId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-surface p-8 text-center shadow-2xl">
          <h1 className="text-xl font-bold">Nenhuma conversa disponível</h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Você ainda não possui uma conversa anônima disponível neste evento.
          </p>

          <Link
            href="/dashboard/messages"
            className="mt-6 inline-block text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Voltar para mensagens
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-border bg-surface shadow-2xl">
        <header className="border-b border-border px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Conversa anônima
              </p>

              <h1 className="mt-1 text-xl font-bold tracking-tight">
                Mensagens
              </h1>
            </div>

            <Link
              href="/dashboard/messages"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              ← Mensagens
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-sm leading-6 text-muted">
              Sua identidade permanece escondida durante toda a conversa. Não
              revele informações que possam identificar você.
            </p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto bg-background px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center text-center">
              <div className="max-w-sm">
                <p className="text-base font-medium">Nenhuma mensagem ainda.</p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Comece a conversa para descobrir mais sobre a pessoa do outro
                  lado.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                      message.isMine
                        ? "bg-primary text-white"
                        : "border border-border bg-surface"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.content}
                    </p>

                    <div
                      className={`mt-1 text-right text-[11px] ${
                        message.isMine ? "text-white/70" : "text-muted"
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        <footer className="border-t border-border bg-surface p-4">
          {error && (
            <div className="mb-3 rounded-2xl border border-enemy/30 bg-enemy/10 px-4 py-3 text-sm text-enemy">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Digite sua mensagem..."
              rows={1}
              disabled={sending}
              maxLength={2000}
              className="min-h-[48px] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-all placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
            />

            <button
              type="submit"
              disabled={sending || !content.trim()}
              aria-label="Enviar mensagem"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              →
            </button>
          </form>
        </footer>
      </div>
    </main>
  );
}
