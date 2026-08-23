import { randomBytes } from "crypto";

import { auth } from "@/auth";
import { getEventForOrganizer } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
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

    const result = await getEventForOrganizer(eventId, session.user.id);

    if (result.error) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    const invitations = await prisma.eventInvitation.findMany({
      where: {
        eventId,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        expiresAt: true,
        acceptedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      invitations,
    });
  } catch (error) {
    console.error("Erro ao buscar convites:", error);

    return Response.json(
      { error: "Erro interno ao buscar convites." },
      { status: 500 },
    );
  }
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

    const result = await getEventForOrganizer(eventId, session.user.id);

    if (result.error) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    const { event } = result;

    if (event.status !== "DRAFT") {
      return Response.json(
        {
          error:
            "Não é possível enviar convites depois que o sorteio foi realizado.",
        },
        { status: 409 },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 },
      );
    }

    const { email } = body;

    if (!email || typeof email !== "string") {
      return Response.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return Response.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return Response.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (existingUser) {
      const existingParticipant = await prisma.participant.findUnique({
        where: {
          userId_eventId: {
            userId: existingUser.id,
            eventId,
          },
        },
      });

      if (existingParticipant) {
        return Response.json(
          {
            error: "Este usuário já participa do evento.",
          },
          { status: 409 },
        );
      }
    }

    const existingInvitation = await prisma.eventInvitation.findUnique({
      where: {
        eventId_email: {
          eventId,
          email: normalizedEmail,
        },
      },
    });

    if (existingInvitation) {
      if (existingInvitation.acceptedAt) {
        return Response.json(
          {
            error: "Este convite já foi aceito.",
          },
          { status: 409 },
        );
      }

      if (existingInvitation.expiresAt > new Date()) {
        return Response.json(
          {
            error: "Já existe um convite pendente para este e-mail.",
          },
          { status: 409 },
        );
      }
    }

    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = existingInvitation
      ? await prisma.eventInvitation.update({
          where: {
            id: existingInvitation.id,
          },
          data: {
            token,
            expiresAt,
            acceptedAt: null,
          },
        })
      : await prisma.eventInvitation.create({
          data: {
            email: normalizedEmail,
            token,
            expiresAt,
            eventId,
          },
        });

    return Response.json(
      {
        message: "Convite criado com sucesso.",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar convite:", error);

    return Response.json(
      { error: "Erro interno ao criar convite." },
      { status: 500 },
    );
  }
}
