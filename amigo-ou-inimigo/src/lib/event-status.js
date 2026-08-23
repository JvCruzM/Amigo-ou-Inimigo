const eventStatusLabels = {
  DRAFT: "Em preparação",
  DRAWN: "Sorteio realizado",
};

export function getEventStatusLabel(status) {
  return eventStatusLabels[status] || "Status desconhecido";
}