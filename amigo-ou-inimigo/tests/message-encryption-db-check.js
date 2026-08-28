import {
  encryptMessage,
  decryptMessage,
} from "../src/lib/message-encryption.js";

const original = "Qual tamanho você usa?";

const encrypted = encryptMessage(original);
const decrypted = decryptMessage(encrypted);

console.log("\n=== TESTE DE CRIPTOGRAFIA ===\n");

console.log("Texto original:");
console.log(original);

console.log("\nTexto criptografado:");
console.log(encrypted);

console.log("\nTexto descriptografado:");
console.log(decrypted);

console.log("\nValidação:");
console.log(
  decrypted === original
    ? "✓ Criptografia/descriptografia funcionando"
    : "✗ Falha na descriptografia",
);