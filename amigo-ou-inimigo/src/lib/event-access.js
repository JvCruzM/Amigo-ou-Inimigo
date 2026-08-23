import { prisma } from "@/lib/prisma";

export async function getEventForOrganizer(eventId, userId) {
  if (!eventId || !userId) {
    return {
      event: null,
      error: "Dados de autorização inválidos.",
      status: 400,
    };
  }

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return {
      event: null,
      error: "Evento não encontrado.",
      status: 404,
    };
  }

  if (event.organizerId !== userId) {
    return {
      event: null,
      error: "Você não tem permissão para acessar este evento.",
      status: 403,
    };
  }

  return {
    event,
    error: null,
    status: 200,
  };
}