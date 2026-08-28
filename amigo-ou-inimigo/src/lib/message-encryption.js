import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const secret = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY não está configurada.",
    );
  }

  const key = Buffer.from(secret, "base64");

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY precisa representar exatamente 32 bytes.",
    );
  }

  return key;
}

export function encryptMessage(text) {
  if (typeof text !== "string") {
    throw new TypeError(
      "O conteúdo da mensagem precisa ser uma string.",
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]).toString("base64");
}

export function decryptMessage(encryptedText) {
  if (typeof encryptedText !== "string") {
    throw new TypeError(
      "O conteúdo criptografado precisa ser uma string.",
    );
  }

  const data = Buffer.from(encryptedText, "base64");

  const minimumLength =
    IV_LENGTH + AUTH_TAG_LENGTH + 1;

  if (data.length < minimumLength) {
    throw new Error(
      "Mensagem criptografada inválida.",
    );
  }

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(
    IV_LENGTH,
    IV_LENGTH + AUTH_TAG_LENGTH,
  );
  const encrypted = data.subarray(
    IV_LENGTH + AUTH_TAG_LENGTH,
  );

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}