import { auth } from "@/auth";
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

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!event) {
      return Response.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.status !== "DRAWN") {
      return Response.json(
        {
          error:
            "O sorteio deste evento ainda não foi realizado.",
        },
        { status: 409 }
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
          error:
            "Você não participa deste evento.",
        },
        { status: 403 }
      );
    }

    const draw = await prisma.draw.findUnique({
      where: {
        eventId_giverId: {
          eventId,
          giverId: participant.id,
        },
      },
      select: {
        type: true,
        receiver: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!draw) {
      return Response.json(
        {
          error:
            "Seu resultado não foi encontrado.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      result: {
        event: {
          id: event.id,
          name: event.name,
        },
        receiver: {
          name: draw.receiver.user.name,
        },
        type: draw.type,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resultado:", error);

    return Response.json(
      { error: "Erro interno ao buscar resultado." },
      { status: 500 }
    );
  }
}