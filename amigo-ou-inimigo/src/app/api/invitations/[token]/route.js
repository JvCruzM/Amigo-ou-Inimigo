import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
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
      include: {
        event: {
          select: {
            id: true,
            name: true,
            status: true,
            organizer: {
              select: {
                name: true,
              },
            },
          },
        },
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

    return Response.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        event: invitation.event,
      },
    });
  } catch (error) {
    console.error("Erro ao consultar convite:", error);

    return Response.json(
      { error: "Erro interno ao consultar convite." },
      { status: 500 }
    );
  }
}