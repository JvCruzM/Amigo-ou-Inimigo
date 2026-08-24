import { auth } from "@/auth";
import { getEventForOrganizer } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const { eventId, participantId } = await params;

    if (!eventId || !participantId) {
      return Response.json(
        {
          error:
            "ID do evento e ID do participante são obrigatórios.",
        },
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

    if (result.event.status !== "DRAFT") {
      return Response.json(
        {
          error:
            "Não é possível remover participantes depois que o sorteio foi realizado.",
        },
        { status: 409 }
      );
    }

    const participant = await prisma.participant.findFirst({
      where: {
        id: participantId,
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!participant) {
      return Response.json(
        { error: "Participante não encontrado." },
        { status: 404 }
      );
    }

    if (participant.userId === result.event.organizerId) {
      return Response.json(
        {
          error:
            "O organizador não pode ser removido do evento.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.participant.delete({
        where: {
          id: participantId,
        },
      });

      await tx.eventInvitation.deleteMany({
        where: {
          eventId,
          email: participant.user.email,
        },
      });
    });

    return Response.json({
      message: "Participante removido com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao remover participante:",
      error
    );

    return Response.json(
      { error: "Erro interno ao remover participante." },
      { status: 500 }
    );
  }
}