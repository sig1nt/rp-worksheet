// src/__tests__/calculateResults.test.ts
import { calculateResults } from '../calculateResults';

describe('calculateResults', () => {
  test('Basic scenario with clear majority', () => {
    const rankings = [
      [1, 2, 3], // Judge 1
      [1, 2, 3], // Judge 2
      [1, 2, 3], // Judge 3
    ];

    const competitors = ['Competitor A', 'Competitor B', 'Competitor C'];

    const results = calculateResults(rankings, competitors);

    expect(results).toEqual([
      expect.objectContaining({ competitor: 'Competitor A', place: 1 }),
      expect.objectContaining({ competitor: 'Competitor B', place: 2 }),
      expect.objectContaining({ competitor: 'Competitor C', place: 3 }),
    ]);
  });

  test('Tie resolved by sum totals', () => {
    const rankings = [
      [3, 2, 1], // Judge 1
      [2, 3, 1], // Judge 2
      [2, 1, 3], // Judge 3
    ];

    const competitors = ['Competitor A', 'Competitor B', 'Competitor C'];

    const results = calculateResults(rankings, competitors);

    expect(results).toEqual([
      expect.objectContaining({ competitor: 'Competitor C', place: 1 }),
      expect.objectContaining({ competitor: 'Competitor B', place: 2 }),
      expect.objectContaining({ competitor: 'Competitor A', place: 3 }),
    ]);
  });

  test('Exact tie requiring head-to-head comparison', () => {
    const rankings = [
      [1, 2], // Judge 1
      [2, 1], // Judge 2
      [1, 2], // Judge 3
      [2, 1], // Judge 4
      [1, 2], // Judge 5
    ];

    const competitors = ['Competitor A', 'Competitor B'];

    const results = calculateResults(rankings, competitors);

    expect(results).toEqual([
      expect.objectContaining({ competitor: 'Competitor A', place: 1 }),
      expect.objectContaining({ competitor: 'Competitor B', place: 2 }),
    ]);
  });

  test('Edge case with minimum number of judges', () => {
    const rankings = [
      [1, 2], // Judge 1
    ];

    const competitors = ['Competitor A', 'Competitor B'];

    const results = calculateResults(rankings, competitors);

    expect(results).toEqual([
      expect.objectContaining({ competitor: 'Competitor A', place: 1 }),
      expect.objectContaining({ competitor: 'Competitor B', place: 2 }),
    ]);
  });

  test('User-provided example with complex tie-breakers', () => {
    const rankings = [
      [1, 2, 3, 4], // J1
      [3, 1, 2, 4], // J2
      [1, 2, 4, 3], // J3
      [1, 3, 2, 4], // J4
      [3, 2, 1, 4], // J5
    ];

    const competitors = [
      'Parker & Elliot',
      'Morgan & Jordan',
      'Charlie & Casey',
      'Ryan & Cameron',
    ];

    const results = calculateResults(rankings, competitors);

    expect(results).toEqual([
      expect.objectContaining({ competitor: 'Parker & Elliot', place: 1 }),
      expect.objectContaining({ competitor: 'Morgan & Jordan', place: 2 }),
      expect.objectContaining({ competitor: 'Charlie & Casey', place: 3 }),
      expect.objectContaining({ competitor: 'Ryan & Cameron', place: 4 }),
    ]);
  });
});
