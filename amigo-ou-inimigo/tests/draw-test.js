import assert from "node:assert/strict";
import test from "node:test";
import { generateDraw, assignDrawTypes } from "../src/lib/draw.js";

const participants = [
  { id: "joao" },
  { id: "maria" },
  { id: "carlos" },
  { id: "ana" },
];

function validateDraw(participants, draws) {
  assert.equal(
    draws.length,
    participants.length,
    "Cada participante deve possuir exatamente um sorteio."
  );

  const participantIds = new Set(
    participants.map((participant) => participant.id)
  );

  const giverIds = new Set(
    draws.map((draw) => draw.giverId)
  );

  const receiverIds = new Set(
    draws.map((draw) => draw.receiverId)
  );

  assert.equal(
    giverIds.size,
    participants.length,
    "Cada participante deve aparecer exatamente uma vez como giver."
  );

  assert.equal(
    receiverIds.size,
    participants.length,
    "Cada participante deve aparecer exatamente uma vez como receiver."
  );

  for (const draw of draws) {
    assert.ok(
      participantIds.has(draw.giverId),
      "O giver precisa ser um participante válido."
    );

    assert.ok(
      participantIds.has(draw.receiverId),
      "O receiver precisa ser um participante válido."
    );

    assert.notEqual(
      draw.giverId,
      draw.receiverId,
      "Ninguém pode sortear a si mesmo."
    );
  }
}

test("não permite sorteio com menos de dois participantes", () => {
  assert.throws(
    () => generateDraw([]),
    /pelo menos 2 participantes/i
  );

  assert.throws(
    () => generateDraw([{ id: "joao" }]),
    /pelo menos 2 participantes/i
  );
});

test("gera sorteio válido para dois participantes", () => {
  const participants = [
    { id: "joao" },
    { id: "maria" },
  ];

  const draws = generateDraw(participants);

  validateDraw(participants, draws);

  assert.ok(
    draws.some(
      (draw) =>
        draw.giverId === "joao" &&
        draw.receiverId === "maria"
    )
  );

  assert.ok(
    draws.some(
      (draw) =>
        draw.giverId === "maria" &&
        draw.receiverId === "joao"
    )
  );
});

test("gera sorteio válido para vários participantes", () => {
  const draws = generateDraw(participants);

  validateDraw(participants, draws);
});

test("não gera auto-sorteios em várias execuções", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const draws = generateDraw(participants);

    validateDraw(participants, draws);
  }
});

test("permite relações recíprocas", () => {
  const twoParticipants = [
    { id: "joao" },
    { id: "maria" },
  ];

  const draws = generateDraw(twoParticipants);

  const joaoDraw = draws.find(
    (draw) => draw.giverId === "joao"
  );

  const mariaDraw = draws.find(
    (draw) => draw.giverId === "maria"
  );

  assert.equal(joaoDraw.receiverId, "maria");
  assert.equal(mariaDraw.receiverId, "joao");
});

test("gera configurações diferentes ao longo de várias execuções", () => {
  const results = new Set();

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const draws = generateDraw(participants);

    const normalized = draws
      .sort((a, b) => a.giverId.localeCompare(b.giverId))
      .map((draw) => `${draw.giverId}:${draw.receiverId}`)
      .join("|");

    results.add(normalized);
  }

  assert.ok(
    results.size > 1,
    "O sorteio deveria produzir mais de uma configuração possível."
  );
});

test("atribui AMIGO quando o valor aleatório é menor que 0.5", () => {
  const draws = [
    {
      giverId: "joao",
      receiverId: "maria",
    },
  ];

  const result = assignDrawTypes(draws, () => 0.1);

  assert.deepEqual(result, [
    {
      giverId: "joao",
      receiverId: "maria",
      type: "AMIGO",
    },
  ]);
});

test("atribui INIMIGO quando o valor aleatório é maior ou igual a 0.5", () => {
  const draws = [
    {
      giverId: "joao",
      receiverId: "maria",
    },
  ];

  const result = assignDrawTypes(draws, () => 0.9);

  assert.deepEqual(result, [
    {
      giverId: "joao",
      receiverId: "maria",
      type: "INIMIGO",
    },
  ]);
});

test("não altera giverId e receiverId ao atribuir o tipo", () => {
  const draws = [
    {
      giverId: "joao",
      receiverId: "maria",
    },
    {
      giverId: "maria",
      receiverId: "joao",
    },
  ];

  const result = assignDrawTypes(draws, () => 0.1);

  assert.deepEqual(result, [
    {
      giverId: "joao",
      receiverId: "maria",
      type: "AMIGO",
    },
    {
      giverId: "maria",
      receiverId: "joao",
      type: "AMIGO",
    },
  ]);
});

test("gera somente tipos válidos", () => {
  const draws = generateDraw(participants);

  const result = assignDrawTypes(draws);

  for (const draw of result) {
    assert.ok(
      draw.type === "AMIGO" || draw.type === "INIMIGO",
      "O tipo deve ser AMIGO ou INIMIGO."
    );
  }
});

test("permite tipos diferentes em relações diferentes", () => {
  const draws = [
    {
      giverId: "joao",
      receiverId: "maria",
    },
    {
      giverId: "maria",
      receiverId: "joao",
    },
  ];

  let index = 0;

  const result = assignDrawTypes(draws, () => {
    index += 1;
    return index === 1 ? 0.1 : 0.9;
  });

  assert.deepEqual(result, [
    {
      giverId: "joao",
      receiverId: "maria",
      type: "AMIGO",
    },
    {
      giverId: "maria",
      receiverId: "joao",
      type: "INIMIGO",
    },
  ]);
});