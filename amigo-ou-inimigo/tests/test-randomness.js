import { generateDraw, assignDrawTypes } from "../src/lib/draw.js";

const TOTAL_RUNS = 10_000;

const participants2 = [
  { id: "A" },
  { id: "B" },
];

const typeCounts = {
  "AMIGO/AMIGO": 0,
  "AMIGO/INIMIGO": 0,
  "INIMIGO/AMIGO": 0,
  "INIMIGO/INIMIGO": 0,
};

let invalidDraws = 0;

for (let i = 0; i < TOTAL_RUNS; i += 1) {
  const draws = generateDraw(participants2);
  const drawsWithTypes = assignDrawTypes(draws);

  const first = drawsWithTypes[0].type;
  const second = drawsWithTypes[1].type;

  typeCounts[`${first}/${second}`] += 1;

  const receivers = draws.map((draw) => draw.receiverId);

  const uniqueReceivers = new Set(receivers);

  const hasSelfDraw = draws.some(
    (draw) => draw.giverId === draw.receiverId,
  );

  if (
    uniqueReceivers.size !== participants2.length ||
    hasSelfDraw
  ) {
    invalidDraws += 1;
  }
}

console.log("\n=== TESTE DE ALEATORIEDADE ===\n");

console.log(`Total de sorteios: ${TOTAL_RUNS}\n`);

for (const [combination, count] of Object.entries(typeCounts)) {
  const percentage = (count / TOTAL_RUNS) * 100;

  console.log(
    `${combination.padEnd(20)} ${String(count).padStart(5)} (${percentage.toFixed(2)}%)`,
  );
}

console.log("\n=== VALIDAÇÃO ===\n");

console.log(
  `Sorteios inválidos: ${invalidDraws}`,
);

console.log(
  `Resultado esperado por combinação: ~25%`,
);

console.log(
  `Resultado esperado para tipos iguais: ~50%`,
);

console.log(
  `Resultado esperado para tipos diferentes: ~50%`,
);