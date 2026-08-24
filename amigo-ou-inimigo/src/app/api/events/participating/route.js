import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const participations = await prisma.participant.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            organizer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const events = participations.map(
      (participation) => participation.event
    );

    return Response.json({
      events,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar eventos dos quais participo:",
      error
    );

    return Response.json(
      { error: "Erro interno ao buscar eventos." },
      { status: 500 }
    );
  }
}