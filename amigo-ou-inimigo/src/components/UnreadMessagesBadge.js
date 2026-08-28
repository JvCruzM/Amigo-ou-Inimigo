"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  setRealtimeAuth,
  supabaseBrowser,
} from "@/lib/supabase-browser";

export default function UnreadMessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  const channelsRef = useRef([]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/messages");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível carregar as mensagens.",
        );
      }

      setUnreadCount(data.totalUnreadCount ?? 0);

      return data;
    } catch (error) {
      console.error(
        "Erro ao carregar contador de mensagens:",
        error,
      );
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const data = await loadUnreadCount();

        if (!active || !data) {
          return;
        }

        const conversations =
          data.conversations ?? [];

        if (conversations.length === 0) {
          return;
        }

        await setRealtimeAuth();

        if (!active) {
          return;
        }

        for (const conversation of conversations) {
          const channel = supabaseBrowser
            .channel(
              `unread-messages-${conversation.conversationId}`,
            )
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

                await loadUnreadCount();
              },
            )
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                console.log(
                  "Realtime do contador conectado:",
                  conversation.conversationId,
                );
              }

              if (status === "CHANNEL_ERROR") {
                console.error(
                  "Erro no canal Realtime do contador:",
                  conversation.conversationId,
                );
              }
            });

          channelsRef.current.push(channel);
        }
      } catch (error) {
        console.error(
          "Erro ao inicializar contador de mensagens:",
          error,
        );
      }
    }

    initialize();

    return () => {
      active = false;

      for (const channel of channelsRef.current) {
        supabaseBrowser.removeChannel(channel);
      }

      channelsRef.current = [];
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    function handleUnreadMessagesUpdated() {
      loadUnreadCount();
    }

    window.addEventListener(
      "unread-messages-updated",
      handleUnreadMessagesUpdated,
    );

    return () => {
      window.removeEventListener(
        "unread-messages-updated",
        handleUnreadMessagesUpdated,
      );
    };
  }, [loadUnreadCount]);

  if (unreadCount <= 0) {
    return null;
  }

  return (
    <span
      aria-label={`${unreadCount} ${
        unreadCount === 1
          ? "mensagem não lida"
          : "mensagens não lidas"
      }`}
      className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}