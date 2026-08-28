import test from "node:test";
import assert from "node:assert/strict";

import {
  encryptMessage,
  decryptMessage,
} from "../src/lib/message-encryption.js";

test("criptografa e descriptografa uma mensagem", () => {
  const original =
    "Qual tamanho de roupa você usa?";

  const encrypted = encryptMessage(original);
  const decrypted = decryptMessage(encrypted);

  assert.notEqual(encrypted, original);
  assert.equal(decrypted, original);
});

test("duas criptografias da mesma mensagem produzem resultados diferentes", () => {
  const original = "Olá!";

  const encrypted1 = encryptMessage(original);
  const encrypted2 = encryptMessage(original);

  assert.notEqual(encrypted1, encrypted2);
});

test("conteúdo criptografado não contém o texto original", () => {
  const original =
    "Esta mensagem deve permanecer secreta.";

  const encrypted = encryptMessage(original);

  assert.equal(
    encrypted.includes(original),
    false,
  );
});

test("falha ao alterar o conteúdo criptografado", () => {
  const encrypted = encryptMessage("Olá!");

  const data = Buffer.from(encrypted, "base64");

  data[data.length - 1] ^= 1;

  assert.throws(() => {
    decryptMessage(data.toString("base64"));
  });
});