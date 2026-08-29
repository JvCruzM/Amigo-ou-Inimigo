import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptMessage } from "@/lib/message-encryption";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          error: "Não autenticado.",
        },
        { status: 401 },
      );
    }

    const participants = await prisma.participant.findMany({
      where: {
        userId: session.user.id,
        event: {
          status: "DRAWN",
        },
      },
      select: {
        id: true,
        eventId: true,
      },
    });

    if (participants.length === 0) {
      return Response.json({
        conversations: [],
        totalUnreadCount: 0,
      });
    }

    const participantIds = participants.map((participant) => participant.id);

    const participantByEventId = new Map(
      participants.map((participant) => [participant.eventId, participant.id]),
    );

    const conversations = await prisma.anonymousConversation.findMany({
      where: {
        event: {
          status: "DRAWN",
        },
        OR: [
          {
            participantAId: {
              in: participantIds,
            },
          },
          {
            participantBId: {
              in: participantIds,
            },
          },
        ],
      },
      select: {
        id: true,
        eventId: true,
        createdAt: true,
        participantAId: true,
        participantBId: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    });

    const eventIds = [
      ...new Set(conversations.map((conversation) => conversation.eventId)),
    ];

    const draws =
      eventIds.length > 0
        ? await prisma.draw.findMany({
            where: {
              eventId: {
                in: eventIds,
              },
              OR: [
                {
                  giverId: {
                    in: participantIds,
                  },
                },
                {
                  receiverId: {
                    in: participantIds,
                  },
                },
              ],
            },
            select: {
              eventId: true,
              giverId: true,
              receiverId: true,
            },
          })
        : [];

    const drawByParticipantAndEvent = new Map();

    for (const draw of draws) {
      const currentParticipantId = participantByEventId.get(draw.eventId);

      if (!currentParticipantId) {
        continue;
      }

      if (draw.giverId === currentParticipantId) {
        drawByParticipantAndEvent.set(
          `${draw.eventId}:${currentParticipantId}:outgoing`,
          draw.receiverId,
        );
      }

      if (draw.receiverId === currentParticipantId) {
        drawByParticipantAndEvent.set(
          `${draw.eventId}:${currentParticipantId}:incoming`,
          draw.giverId,
        );
      }
    }

    const conversationIds = conversations.map(
      (conversation) => conversation.id,
    );

    const unreadMessages =
      conversationIds.length > 0
        ? await prisma.anonymousMessage.groupBy({
            by: ["conversationId"],
            where: {
              conversationId: {
                in: conversationIds,
              },
              readAt: null,
              senderId: {
                notIn: participantIds,
              },
            },
            _count: {
              _all: true,
            },
          })
        : [];

    const unreadCountByConversation = new Map(
      unreadMessages.map((item) => [item.conversationId, item._count._all]),
    );

    const result = conversations
      .map((conversation) => {
        const participantId = participantByEventId.get(conversation.eventId);

        if (!participantId) {
          return null;
        }

        const outgoingReceiver =
          drawByParticipantAndEvent.get(
            `${conversation.eventId}:${participantId}:outgoing`,
          ) ?? null;

        const incomingGiver =
          drawByParticipantAndEvent.get(
            `${conversation.eventId}:${participantId}:incoming`,
          ) ?? null;

        const counterpartId =
          conversation.participantAId === participantId
            ? conversation.participantBId
            : conversation.participantAId;

        let relationship = "UNKNOWN";

        if (
          outgoingReceiver === counterpartId &&
          incomingGiver === counterpartId
        ) {
          relationship = "MUTUAL";
        } else if (outgoingReceiver === counterpartId) {
          relationship = "I_DREW";
        } else if (incomingGiver === counterpartId) {
          relationship = "DREW_ME";
        }

        const lastMessage = conversation.messages[0] ?? null;

        return {
          conversationId: conversation.id,
          eventId: conversation.eventId,
          eventName: conversation.event.name,
          relationship,
          unreadCount: unreadCountByConversation.get(conversation.id) ?? 0,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: decryptMessage(lastMessage.content),
                createdAt: lastMessage.createdAt,
                isMine: lastMessage.senderId === participantId,
              }
            : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) {
          return 0;
        }

        if (!a.lastMessage) {
          return 1;
        }

        if (!b.lastMessage) {
          return -1;
        }

        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      });

    const totalUnreadCount = result.reduce(
      (total, conversation) => total + conversation.unreadCount,
      0,
    );

    return Response.json({
      conversations: result,
      totalUnreadCount,
    });
  } catch (error) {
    console.error("Erro ao buscar conversas anônimas:", error);

    return Response.json(
      {
        error: "Erro interno ao buscar conversas anônimas.",
      },
      { status: 500 },
    );
  }
}
