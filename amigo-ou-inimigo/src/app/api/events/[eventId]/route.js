import { auth } from "@/auth";
import { getEventForOrganizer } from "@/lib/event-access";

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

    return Response.json({
      event: result.event,
    });
  } catch (error) {
    console.error("Erro ao buscar evento:", error);

    return Response.json(
      { error: "Erro interno ao buscar evento." },
      { status: 500 }
    );
  }
}