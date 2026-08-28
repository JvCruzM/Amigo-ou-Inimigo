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
      });
    }

    const participantIds = participants.map((participant) => participant.id);

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

    const participantByEventId = new Map(
      participants.map((participant) => [participant.eventId, participant.id]),
    );

    const result = conversations
      .map((conversation) => {
        const participantId = participantByEventId.get(conversation.eventId);

        if (!participantId) {
          return null;
        }

        const lastMessage = conversation.messages[0] ?? null;

        return {
          conversationId: conversation.id,
          eventId: conversation.eventId,
          eventName: conversation.event.name,
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

    return Response.json({
      conversations: result,
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
