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
    });

    if (!event) {
      return Response.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.organizerId !== session.user.id) {
      return Response.json(
        { error: "Você não tem permissão para acessar este evento." },
        { status: 403 }
      );
    }

    return Response.json({
      event,
    });
  } catch (error) {
    console.error("Erro ao buscar evento:", error);

    return Response.json(
      { error: "Erro interno ao buscar evento." },
      { status: 500 }
    );
  }
}