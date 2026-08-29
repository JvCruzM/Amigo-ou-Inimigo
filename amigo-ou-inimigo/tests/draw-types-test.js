import test from "node:test";
import assert from "node:assert/strict";

import { assignDrawTypes } from "../src/lib/draw.js";

test("assignDrawTypes produz resultados independentes", () => {
  const draws = [
    { giverId: "1", receiverId: "2" },
    { giverId: "2", receiverId: "3" },
    { giverId: "3", receiverId: "1" },
  ];

  const randomValues = [0.1, 0.9, 0.1];

  const result = assignDrawTypes(
    draws,
    () => randomValues.shift(),
  );

  assert.deepEqual(
    result.map((draw) => draw.type),
    ["AMIGO", "INIMIGO", "AMIGO"],
  );
});