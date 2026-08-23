import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      where: {
        organizerId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      events,
    });
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);

    return Response.json(
      { error: "Erro interno ao buscar eventos." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return Response.json(
        { error: "O nome do evento é obrigatório." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name,
          organizerId: session.user.id,
        },
      });

      const participant = await tx.participant.create({
        data: {
          userId: session.user.id,
          eventId: event.id,
        },
      });

      return {
        event,
        participant,
      };
    });

    return Response.json(
      {
        message: "Evento criado com sucesso.",
        event: result.event,
        participant: result.participant,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar evento:", error);

    return Response.json(
      { error: "Erro interno ao criar evento." },
      { status: 500 },
    );
  }
}
