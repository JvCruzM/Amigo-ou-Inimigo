import { auth } from "@/auth";
import { generateDraw, assignDrawTypes } from "@/lib/draw";
import { prisma } from "@/lib/prisma";

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

    const result = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: {
            id: eventId,
          },
        });

        if (!event) {
          return {
            type: "error",
            status: 404,
            error: "Evento não encontrado.",
          };
        }

        if (event.organizerId !== session.user.id) {
          return {
            type: "error",
            status: 403,
            error:
              "Você não tem permissão para realizar o sorteio deste evento.",
          };
        }

        if (event.status !== "DRAFT") {
          return {
            type: "error",
            status: 409,
            error:
              "Este evento já teve o sorteio realizado.",
          };
        }

        const participants = await tx.participant.findMany({
          where: {
            eventId,
          },
          select: {
            id: true,
          },
        });

        if (participants.length < 2) {
          return {
            type: "error",
            status: 409,
            error:
              "O evento precisa ter pelo menos 2 participantes para realizar o sorteio.",
          };
        }

        const existingDraws = await tx.draw.count({
          where: {
            eventId,
          },
        });

        if (existingDraws > 0) {
          return {
            type: "error",
            status: 409,
            error:
              "Este evento já possui resultados de sorteio.",
          };
        }

        const draws = generateDraw(participants);
        const drawsWithTypes = assignDrawTypes(draws);

        await tx.draw.createMany({
          data: drawsWithTypes.map((draw) => ({
            eventId,
            giverId: draw.giverId,
            receiverId: draw.receiverId,
            type: draw.type,
          })),
        });

        const updatedEvent = await tx.event.update({
          where: {
            id: eventId,
          },
          data: {
            status: "DRAWN",
          },
        });

        return {
          type: "success",
          event: updatedEvent,
          drawsCount: drawsWithTypes.length,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    if (result.type === "error") {
      return Response.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return Response.json({
      message: "Sorteio realizado com sucesso.",
      event: result.event,
      drawsCount: result.drawsCount,
    });
  } catch (error) {
    console.error("Erro ao realizar sorteio:", error);

    return Response.json(
      { error: "Erro interno ao realizar sorteio." },
      { status: 500 }
    );
  }
}