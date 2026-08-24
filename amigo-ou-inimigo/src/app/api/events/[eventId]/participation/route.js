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

    const participation = await prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      select: {
        id: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            organizer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!participation) {
      return Response.json(
        {
          error: "Você não participa deste evento.",
        },
        { status: 403 }
      );
    }

    return Response.json({
      participation,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar participação:",
      error
    );

    return Response.json(
      { error: "Erro interno ao buscar participação." },
      { status: 500 }
    );
  }
}