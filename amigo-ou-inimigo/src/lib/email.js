import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendInvitationEmail({
  email,
  eventName,
  organizerName,
  invitationUrl,
}) {
  const safeEventName = escapeHtml(eventName);
  const safeOrganizerName = escapeHtml(organizerName);
  const safeInvitationUrl = escapeHtml(invitationUrl);

  const { data, error } = await resend.emails.send({
    from: "Amigo ou Inimigo <onboarding@resend.dev>",
    to: [email],
    subject: `Você foi convidado para ${eventName}`,
    html: `
      <h1>Você foi convidado!</h1>

      <p>
        <strong>${safeOrganizerName}</strong>
        convidou você para participar de:
      </p>

      <h2>${safeEventName}</h2>

      <p>
        Clique no botão abaixo para visualizar seu convite.
      </p>

      <p>
        <a href="${safeInvitationUrl}">
          Ver convite
        </a>
      </p>

      <p>
        Este convite é pessoal e não deve ser compartilhado.
      </p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}