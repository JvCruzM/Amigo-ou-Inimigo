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
        {
          error: "ID da conversa não informado.",
        },
        { status: 400 },
      );
    }

    const participant =
      await prisma.participant.findUnique({
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
          error:
            "Você não participa deste evento.",
        },
        { status: 403 },
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
          participantAId: true,
          participantBId: true,
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

    const field =
      conversation.participantAId === participant.id
        ? "activeAtA"
        : "activeAtB";

    await prisma.anonymousConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        [field]: new Date(),
      },
    });

    return Response.json({
      active: true,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar atividade da conversa:",
      error,
    );

    return Response.json(
      {
        error:
          "Erro interno ao atualizar atividade da conversa.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
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
        {
          error: "ID da conversa não informado.",
        },
        { status: 400 },
      );
    }

    const participant =
      await prisma.participant.findUnique({
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
          error:
            "Você não participa deste evento.",
        },
        { status: 403 },
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
          participantAId: true,
          participantBId: true,
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

    const field =
      conversation.participantAId === participant.id
        ? "activeAtA"
        : "activeAtB";

    await prisma.anonymousConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        [field]: null,
      },
    });

    return Response.json({
      active: false,
    });
  } catch (error) {
    console.error(
      "Erro ao remover atividade da conversa:",
      error,
    );

    return Response.json(
      {
        error:
          "Erro interno ao remover atividade da conversa.",
      },
      { status: 500 },
    );
  }
}