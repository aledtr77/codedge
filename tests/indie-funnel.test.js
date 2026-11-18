import { describe, expect, it } from 'vitest';
import { calculateFunnel } from '../src/scripts/pages/tutorials/indie-marketing/funnel.js';

const cohort = { visitors: 200, accounts: 20, activated: 8, customers: 2, spend: 60 };

describe('single-cohort marketing calculator', () => {
  it('distinguishes stage conversion from overall conversion and acquisition spending', () => {
    expect(calculateFunnel(cohort)).toEqual({ signup: 0.1, activation: 0.4, purchase: 0.25, overall: 0.01, cost: 30 });
  });

  it('does not present a zero-denominator ratio as zero or infinity', () => {
    expect(calculateFunnel({ visitors: 0, accounts: 0, activated: 0, customers: 0, spend: 60 }))
      .toEqual({ signup: null, activation: null, purchase: null, overall: null, cost: null });
    expect(calculateFunnel({ ...cohort, customers: 0 })).toMatchObject({ overall: 0, purchase: 0, cost: null });
  });

  it('allows a genuine zero attributed spending without implying total cost is free', () => {
    expect(calculateFunnel({ ...cohort, spend: 0 }).cost).toBe(0);
  });

  it.each([
    ['accounts', 201], ['activated', 21], ['customers', 9],
  ])('rejects %s when it exceeds the preceding stage of the same cohort', (field, value) => {
    expect(calculateFunnel({ ...cohort, [field]: value })).toEqual({ error: 'sequence', field });
  });

  it.each([NaN, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid person counts: %s', (value) => {
    expect(calculateFunnel({ ...cohort, visitors: value })).toEqual({ error: 'count', field: 'visitors' });
  });

  it.each([NaN, -0.01, Infinity])('rejects invalid spending: %s', (value) => {
    expect(calculateFunnel({ ...cohort, spend: value })).toEqual({ error: 'spend', field: 'spend' });
  });
});
