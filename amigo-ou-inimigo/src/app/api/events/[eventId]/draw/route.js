import { auth } from "@/auth";
import { assignDrawTypes, generateDraw } from "@/lib/draw";
import { prisma } from "@/lib/prisma";

const MAX_TRANSACTION_RETRIES = 3;

async function executeDraw(eventId, userId) {
  return prisma.$transaction(
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

      if (event.organizerId !== userId) {
        return {
          type: "error",
          status: 403,
          error: "Você não tem permissão para realizar o sorteio deste evento.",
        };
      }

      if (event.status !== "DRAFT") {
        return {
          type: "error",
          status: 409,
          error: "Este evento já teve o sorteio realizado.",
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
          error: "Este evento já possui resultados de sorteio.",
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

      const conversationPairs = draws.map((draw) => {
        const [participantAId, participantBId] = [
          draw.giverId,
          draw.receiverId,
        ].sort();

        return {
          eventId,
          participantAId,
          participantBId,
        };
      });

      const uniqueConversationPairs = Array.from(
        new Map(
          conversationPairs.map((pair) => [
            `${pair.eventId}:${pair.participantAId}:${pair.participantBId}`,
            pair,
          ]),
        ).values(),
      );

      await tx.anonymousConversation.createMany({
        data: uniqueConversationPairs,
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
    },
  );
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { eventId } = await params;

    if (!eventId) {
      return Response.json(
        { error: "ID do evento não informado." },
        { status: 400 },
      );
    }

    let result;

    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        result = await executeDraw(eventId, session.user.id);

        break;
      } catch (error) {
        if (error?.code !== "P2034") {
          throw error;
        }

        console.warn(
          `Conflito de concorrência no sorteio. Tentativa ${attempt}/${MAX_TRANSACTION_RETRIES}.`,
        );

        if (attempt === MAX_TRANSACTION_RETRIES) {
          return Response.json(
            {
              error:
                "Não foi possível concluir o sorteio devido a uma tentativa simultânea. Tente novamente.",
            },
            { status: 409 },
          );
        }
      }
    }

    if (result.type === "error") {
      return Response.json({ error: result.error }, { status: result.status });
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
      { status: 500 },
    );
  }
}
