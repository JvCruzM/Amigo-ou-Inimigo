import { auth } from "@/auth";
import { SignJWT } from "jose";

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET não está configurado.",
    );
  }

  return encoder.encode(secret);
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        {
          error: "Não autenticado.",
        },
        { status: 401 },
      );
    }

    const token = await new SignJWT({
      app_user_id: session.user.id,
      role: "authenticated",
    })
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setSubject(session.user.id)
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(getJwtSecret());

    return Response.json({
      token,
    });
  } catch (error) {
    console.error(
      "Erro ao gerar token do Realtime:",
      error,
    );

    return Response.json(
      {
        error:
          "Não foi possível autorizar o Realtime.",
      },
      { status: 500 },
    );
  }
}