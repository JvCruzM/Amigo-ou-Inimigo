import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return Response.json(
        {
          error: "Informe seu e-mail.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return Response.json({
        message:
          "Se existir uma conta para este e-mail, enviaremos as instruções para redefinir sua senha.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${baseUrl}/reset-password/${rawToken}`;

    await sendPasswordResetEmail({
      email: user.email,
      resetUrl,
    });

    return Response.json({
      message:
        "Se existir uma conta para este e-mail, enviaremos as instruções para redefinir sua senha.",
    });
  } catch (error) {
    console.error(
      "Erro ao solicitar recuperação de senha:",
      error
    );

    return Response.json(
      {
        error:
          "Não foi possível processar a solicitação.",
      },
      { status: 500 }
    );
  }
}