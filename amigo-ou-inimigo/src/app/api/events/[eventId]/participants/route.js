import { auth } from "@/auth";
import { getEventForOrganizer } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const { eventId } = await params;

    if (!eventId) {
      return Response.json(
        { error: "ID do evento não informado." },
        { status: 400 }
      );
    }

    const result = await getEventForOrganizer(
      eventId,
      session.user.id
    );

    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const participants = await prisma.participant.findMany({
      where: {
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return Response.json({
      participants,
    });
  } catch (error) {
    console.error("Erro ao buscar participantes:", error);

    return Response.json(
      { error: "Erro interno ao buscar participantes." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const { eventId } = await params;

    if (!eventId) {
      return Response.json(
        { error: "ID do evento não informado." },
        { status: 400 }
      );
    }

    const result = await getEventForOrganizer(
      eventId,
      session.user.id
    );

    if (result.error) {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { event } = result;

    if (event.status !== "DRAFT") {
      return Response.json(
        {
          error:
            "Não é possível adicionar participantes depois que o sorteio foi realizado.",
        },
        { status: 409 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 }
      );
    }

    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return Response.json(
        { error: "userId é obrigatório." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const existingParticipant = await prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingParticipant) {
      return Response.json(
        { error: "Este usuário já participa do evento." },
        { status: 409 }
      );
    }

    const participant = await prisma.participant.create({
      data: {
        userId,
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return Response.json(
      {
        message: "Participante adicionado com sucesso.",
        participant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao adicionar participante:", error);

    return Response.json(
      { error: "Erro interno ao adicionar participante." },
      { status: 500 }
    );
  }
}