import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
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

    const conversations =
      await prisma.anonymousConversation.findMany({
        where: {
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
          createdAt: true,
          participantAId: true,
          participantBId: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              content: true,
              createdAt: true,
              readAt: true,
              senderId: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

    const formattedConversations = conversations.map(
      (conversation) => ({
        id: conversation.id,
        createdAt: conversation.createdAt,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          readAt: message.readAt,
          isMine: message.senderId === participant.id,
        })),
      }),
    );

    return Response.json({
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar mensagens anônimas:",
      error,
    );

    return Response.json(
      {
        error:
          "Erro interno ao buscar mensagens anônimas.",
      },
      { status: 500 },
    );
  }
}

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

    const content =
      typeof body?.content === "string"
        ? body.content.trim()
        : "";

    if (!conversationId) {
      return Response.json(
        { error: "ID da conversa não informado." },
        { status: 400 },
      );
    }

    if (!content) {
      return Response.json(
        { error: "A mensagem não pode estar vazia." },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return Response.json(
        {
          error:
            "A mensagem não pode ter mais de 2000 caracteres.",
        },
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

    const message = await prisma.anonymousMessage.create({
      data: {
        content,
        conversationId: conversation.id,
        senderId: participant.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        readAt: true,
      },
    });

    await prisma.anonymousConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return Response.json(
      {
        message: {
          ...message,
          isMine: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Erro ao enviar mensagem anônima:",
      error,
    );

    return Response.json(
      {
        error:
          "Erro interno ao enviar mensagem anônima.",
      },
      { status: 500 },
    );
  }
}