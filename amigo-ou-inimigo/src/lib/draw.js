function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function hasSelfDraw(participants, receivers) {
  return participants.some(
    (participant, index) =>
      participant.id === receivers[index].id
  );
}

export function generateDraw(participants) {
  if (!Array.isArray(participants)) {
    throw new TypeError("participants precisa ser um array.");
  }

  if (participants.length < 2) {
    throw new Error(
      "É necessário ter pelo menos 2 participantes para realizar o sorteio."
    );
  }

  const participantIds = new Set(
    participants.map((participant) => participant.id)
  );

  if (participantIds.size !== participants.length) {
    throw new Error(
      "Os participantes não podem possuir IDs duplicados."
    );
  }

  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const receivers = shuffle(participants);

    if (hasSelfDraw(participants, receivers)) {
      continue;
    }

    return participants.map((giver, index) => ({
      giverId: giver.id,
      receiverId: receivers[index].id,
    }));
  }

  throw new Error(
    "Não foi possível gerar uma configuração válida de sorteio."
  );
}

export function assignDrawTypes(draws, random = Math.random) {
  if (!Array.isArray(draws)) {
    throw new TypeError("draws precisa ser um array.");
  }

  return draws.map((draw) => ({
    ...draw,
    type: random() < 0.5 ? "AMIGO" : "INIMIGO",
  }));
}