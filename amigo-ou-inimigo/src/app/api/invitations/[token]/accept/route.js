import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return Response.json(
        { error: "Você precisa estar autenticado para aceitar este convite." },
        { status: 401 }
      );
    }

    const { token } = await params;

    if (!token) {
      return Response.json(
        { error: "Token do convite não informado." },
        { status: 400 }
      );
    }

    const invitation = await prisma.eventInvitation.findUnique({
      where: {
        token,
      },
    });

    if (!invitation) {
      return Response.json(
        { error: "Convite não encontrado." },
        { status: 404 }
      );
    }

    if (invitation.acceptedAt) {
      return Response.json(
        { error: "Este convite já foi aceito." },
        { status: 409 }
      );
    }

    if (invitation.expiresAt <= new Date()) {
      return Response.json(
        { error: "Este convite expirou." },
        { status: 410 }
      );
    }

    const userEmail = session.user.email.trim().toLowerCase();
    const invitationEmail = invitation.email.trim().toLowerCase();

    if (userEmail !== invitationEmail) {
      return Response.json(
        {
          error:
            "Este convite foi enviado para outro endereço de e-mail.",
        },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: {
        id: invitation.eventId,
      },
    });

    if (!event) {
      return Response.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    if (event.status !== "DRAFT") {
      return Response.json(
        {
          error:
            "Não é possível aceitar convites depois que o sorteio foi realizado.",
        },
        { status: 409 }
      );
    }

    const existingParticipant =
      await prisma.participant.findUnique({
        where: {
          userId_eventId: {
            userId: session.user.id,
            eventId: invitation.eventId,
          },
        },
      });

    if (existingParticipant) {
      return Response.json(
        {
          error: "Você já participa deste evento.",
        },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const participant = await tx.participant.create({
        data: {
          userId: session.user.id,
          eventId: invitation.eventId,
        },
      });

      const updatedInvitation =
        await tx.eventInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            acceptedAt: new Date(),
          },
        });

      return {
        participant,
        invitation: updatedInvitation,
      };
    });

    return Response.json(
      {
        message: "Convite aceito com sucesso.",
        participant: {
          id: result.participant.id,
          eventId: result.participant.eventId,
          userId: result.participant.userId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);

    return Response.json(
      { error: "Erro interno ao aceitar convite." },
      { status: 500 }
    );
  }
}