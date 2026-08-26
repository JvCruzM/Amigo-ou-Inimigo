import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();

    const token = body?.token;
    const password = body?.password;

    if (!token || !password) {
      return Response.json(
        {
          error: "Dados inválidos.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        {
          error:
            "A senha deve ter pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return Response.json(
        {
          error:
            "Este link de recuperação é inválido ou expirou.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      });

      await tx.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      });
    });

    return Response.json({
      message:
        "Senha redefinida com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao redefinir senha:",
      error
    );

    return Response.json(
      {
        error:
          "Não foi possível redefinir sua senha.",
      },
      { status: 500 }
    );
  }
}