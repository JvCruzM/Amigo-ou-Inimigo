import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 },
      );
    }

    const { eventId } = await params;

    if (!eventId) {
      return Response.json(
        { error: "ID do evento não informado." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const conversationId =
      typeof body?.conversationId === "string"
        ? body.conversationId.trim()
        : "";

    if (!conversationId) {
      return Response.json(
        { error: "ID da conversa não informado." },
        { status: 400 },
      );
    }

    const participant = await prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!participant) {
      return Response.json(
        {
          error: "Você não participa deste evento.",
        },
        { status: 403 },
      );
    }

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!event) {
      return Response.json(
        { error: "Evento não encontrado." },
        { status: 404 },
      );
    }

    if (event.status !== "DRAWN") {
      return Response.json(
        {
          error:
            "As mensagens anônimas só estão disponíveis após o sorteio.",
        },
        { status: 409 },
      );
    }

    const conversation =
      await prisma.anonymousConversation.findFirst({
        where: {
          id: conversationId,
          eventId,
          OR: [
            {
              participantAId: participant.id,
            },
            {
              participantBId: participant.id,
            },
          ],
        },
        select: {
          id: true,
        },
      });

    if (!conversation) {
      return Response.json(
        {
          error:
            "Você não tem acesso a esta conversa.",
        },
        { status: 403 },
      );
    }

    const result =
      await prisma.anonymousMessage.updateMany({
        where: {
          conversationId: conversation.id,
          senderId: {
            not: participant.id,
          },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

    return Response.json({
      message: "Mensagens marcadas como lidas.",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error(
      "Erro ao marcar mensagens como lidas:",
      error,
    );

    return Response.json(
      {
        error:
          "Erro interno ao marcar mensagens como lidas.",
      },
      { status: 500 },
    );
  }
}