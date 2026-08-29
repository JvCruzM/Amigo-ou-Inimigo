import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

  const { messageId } = await transporter.sendMail({
    from: `"Amigo ou Inimigo" <${process.env.GMAIL_USER}>`,
    to: email,
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
        <a
          href="${safeInvitationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
          "
        >
          Ver convite
        </a>
      </p>

      <p>
        Este convite é pessoal e não deve ser compartilhado.
      </p>
    `,
  });

  return messageId;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}) {
  await transporter.sendMail({
    from: `"Amigo ou Inimigo" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Redefinição de senha — Amigo ou Inimigo",
    html: `
      <h1>Redefinir sua senha</h1>

      <p>
        Recebemos uma solicitação para redefinir a senha da
        sua conta do Amigo ou Inimigo.
      </p>

      <p>
        <a href="${resetUrl}">
          Redefinir minha senha
        </a>
      </p>

      <p>
        Este link é temporário e pode ser usado apenas uma vez.
      </p>

      <p>
        Se você não solicitou essa alteração, ignore este
        e-mail.
      </p>
    `,
  });
}

export async function sendNewAnonymousMessageEmail({
  email,
  eventName,
  appUrl,
}) {
  const safeEventName = escapeHtml(eventName);
  const safeAppUrl = escapeHtml(appUrl);

  await transporter.sendMail({
    from: `"Amigo ou Inimigo" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Você recebeu uma nova mensagem anônima",
    html: `
      <h1>Você recebeu uma nova mensagem anônima</h1>

      <p>
        Há uma nova mensagem esperando por você.
      </p>

      <p>
        Evento:
        <strong>${safeEventName}</strong>
      </p>

      <p>
        Para preservar o anonimato, o conteúdo da mensagem
        e a identidade de quem enviou não são exibidos neste e-mail.
      </p>

      <p>
        <a
          href="${safeAppUrl}/dashboard/messages"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
          "
        >
          Ver mensagem
        </a>
      </p>
    `,
  });
}