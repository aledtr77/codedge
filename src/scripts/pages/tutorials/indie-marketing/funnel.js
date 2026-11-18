export function calculateFunnel({ visitors, accounts, activated, customers, spend }) {
  const counts = { visitors, accounts, activated, customers };
  for (const [field, value] of Object.entries(counts)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      return { error: 'count', field };
    }
  }
  if (!Number.isFinite(spend) || spend < 0) return { error: 'spend', field: 'spend' };

  const stages = Object.entries(counts);
  for (let index = 1; index < stages.length; index++) {
    if (stages[index][1] > stages[index - 1][1]) {
      return { error: 'sequence', field: stages[index][0] };
    }
  }

  const ratio = (numerator, denominator) => denominator === 0 ? null : numerator / denominator;
  return {
    signup: ratio(accounts, visitors),
    activation: ratio(activated, accounts),
    purchase: ratio(customers, activated),
    overall: ratio(customers, visitors),
    cost: ratio(spend, customers),
  };
}
