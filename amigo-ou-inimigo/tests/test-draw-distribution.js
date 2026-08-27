import { generateDraw } from "../src/lib/draw.js";

const TOTAL_RUNS = 10_000;
const GROUP_SIZES = [3, 4, 5, 10, 20, 50];

function createParticipants(size) {
  return Array.from({ length: size }, (_, index) => ({
    id: `participant-${index + 1}`,
  }));
}

function getConfiguration(draws) {
  return draws
    .map((draw) => `${draw.giverId}->${draw.receiverId}`)
    .join("|");
}

function validateDraw(participants, draws) {
  if (draws.length !== participants.length) {
    return {
      valid: false,
      reason: "Quantidade de draws diferente da quantidade de participantes.",
    };
  }

  const participantIds = new Set(
    participants.map((participant) => participant.id),
  );

  const giverIds = draws.map((draw) => draw.giverId);
  const receiverIds = draws.map((draw) => draw.receiverId);

  const giverSet = new Set(giverIds);
  const receiverSet = new Set(receiverIds);

  if (giverSet.size !== participants.length) {
    return {
      valid: false,
      reason: "Existem giverIds duplicados ou ausentes.",
    };
  }

  if (receiverSet.size !== participants.length) {
    return {
      valid: false,
      reason: "Existem receiverIds duplicados ou ausentes.",
    };
  }

  for (const draw of draws) {
    if (!participantIds.has(draw.giverId)) {
      return {
        valid: false,
        reason: `giverId inválido: ${draw.giverId}`,
      };
    }

    if (!participantIds.has(draw.receiverId)) {
      return {
        valid: false,
        reason: `receiverId inválido: ${draw.receiverId}`,
      };
    }

    if (draw.giverId === draw.receiverId) {
      return {
        valid: false,
        reason: `Auto-sorteio detectado: ${draw.giverId}`,
      };
    }
  }

  return {
    valid: true,
  };
}

function theoreticalDerangements(n) {
  let d0 = 1;
  let d1 = 0;

  if (n === 0) {
    return d0;
  }

  if (n === 1) {
    return d1;
  }

  for (let i = 2; i <= n; i += 1) {
    const next = (i - 1) * (d1 + d0);
    d0 = d1;
    d1 = next;
  }

  return d1;
}

function checkUniformity(counts, totalRuns) {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return {
      possibleConfigurations: 0,
      min: 0,
      max: 0,
      spread: 0,
      expectedPercentage: 0,
    };
  }

  const values = entries.map(([, count]) => count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;

  return {
    possibleConfigurations: entries.length,
    min,
    max,
    spread,
    expectedPercentage:
      (100 / entries.length).toFixed(2) + "%",
    totalRuns,
  };
}

console.log("\n=== TESTE DE DISTRIBUIÇÃO DO SORTEIO ===\n");

let totalInvalidDraws = 0;
let totalRunsExecuted = 0;

for (const size of GROUP_SIZES) {
  const participants = createParticipants(size);
  const configurations = {};

  let invalidDraws = 0;

  for (let run = 0; run < TOTAL_RUNS; run += 1) {
    const draws = generateDraw(participants);

    const validation = validateDraw(
      participants,
      draws,
    );

    if (!validation.valid) {
      invalidDraws += 1;

      if (invalidDraws === 1) {
        console.error(
          `Primeiro erro no grupo de ${size}: ${validation.reason}`,
        );
      }

      continue;
    }

    const configuration = getConfiguration(draws);

    configurations[configuration] =
      (configurations[configuration] || 0) + 1;
  }

  const theoreticalCount =
    theoreticalDerangements(size);

  const uniformity = checkUniformity(
    configurations,
    TOTAL_RUNS,
  );

  totalInvalidDraws += invalidDraws;
  totalRunsExecuted += TOTAL_RUNS;

  console.log(`Grupo: ${size} participantes`);
  console.log(
    `Configurações válidas teóricas: ${theoreticalCount}`,
  );
  console.log(
    `Configurações observadas: ${uniformity.possibleConfigurations}`,
  );
  console.log(`Sorteios inválidos: ${invalidDraws}`);
  console.log(
    `Menor frequência: ${uniformity.min}`,
  );
  console.log(
    `Maior frequência: ${uniformity.max}`,
  );
  console.log(
    `Diferença entre menor/maior: ${uniformity.spread}`,
  );

  if (theoreticalCount > 0) {
    console.log(
      `Frequência esperada por configuração: ~${uniformity.expectedPercentage}`,
    );
  }

  console.log("");
}

console.log("=== RESUMO ===\n");
console.log(`Total de sorteios: ${totalRunsExecuted}`);
console.log(`Total de sorteios inválidos: ${totalInvalidDraws}`);

if (totalInvalidDraws > 0) {
  console.error("\nFALHA: foram encontrados sorteios inválidos.");
  process.exit(1);
}

console.log(
  "\nSUCESSO: todos os sorteios respeitaram as regras.",
);