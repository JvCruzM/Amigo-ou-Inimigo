import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = body?.name?.trim();

    if (!name) {
      return Response.json(
        { error: "O nome do evento é obrigatório." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        organizerId: session.user.id,
      },
    });

    return Response.json(
      {
        message: "Evento criado com sucesso.",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar evento:", error);

    return Response.json(
      { error: "Erro interno ao criar evento." },
      { status: 500 }
    );
  }
}