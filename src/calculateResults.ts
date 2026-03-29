// Add a test

// Type definitions
export interface CompetitorResult {
  competitor: string;
  scores: number[];
  counts: number[];
  cumulativeCounts: number[];
  majorityColumn: number | null;
  cumulativeCountAtMajority: number;
  sumOfScoresAtMajority: number;
  place: number;
  highlightPlace: number | null;
}

interface CompetitorData {
  name: string;
  scores: number[];
  counts: number[];
  cumulativeCounts: number[];
  majorityColumn: number | null;
  cumulativeCountAtMajority: number;
  sumOfScoresAtMajority: number;
  place: number | null;
  highlightPlace: number | null;
  tieBreakScores?: number[];
  headToHeadWins?: number;
}

// Calculate results using the same algorithm as React version
export function calculateResults(rankings: number[][], competitors: string[]): CompetitorResult[] {
  const numJudges = rankings.length;
  const numCompetitors = rankings[0].length;
  const majority = Math.floor(numJudges / 2) + 1;

  const competitorsData: CompetitorData[] = competitors.map((name) => ({
    name,
    scores: [],
    counts: Array(numCompetitors).fill(0),
    cumulativeCounts: Array(numCompetitors).fill(0),
    majorityColumn: null,
    cumulativeCountAtMajority: 0,
    sumOfScoresAtMajority: 0,
    place: null,
    highlightPlace: null,
    tieBreakScores: undefined,
    headToHeadWins: undefined,
  }));

  // Aggregate rankings
  rankings.forEach((judgeRankings) => {
    judgeRankings.forEach((rank, idx) => {
      const competitor = competitorsData[idx];
      competitor.scores.push(rank);
      competitor.counts[rank - 1]++;
    });
  });

  // Calculate cumulative counts and determine where each competitor achieves majority
  competitorsData.forEach((competitor) => {
    let cumulative = 0;
    for (let i = 0; i < numCompetitors; i++) {
      cumulative += competitor.counts[i];
      competitor.cumulativeCounts[i] = cumulative;

      if (cumulative >= majority && competitor.majorityColumn === null) {
        competitor.majorityColumn = i;
        competitor.cumulativeCountAtMajority = cumulative;

        let sum = 0;
        for (let j = 0; j <= i; j++) {
          sum += competitor.counts[j] * (j + 1);
        }
        competitor.sumOfScoresAtMajority = sum;
      }
    }
  });

  // Determine placements
  let place = 1;
  const placedCompetitors: CompetitorData[] = [];

  while (placedCompetitors.length < numCompetitors) {
    const remainingCompetitors = competitorsData.filter((comp) => comp.place === null);

    if (remainingCompetitors.length === 0) break;

    const minMajorityColumn = Math.min(
      ...remainingCompetitors.map((comp) => comp.majorityColumn ?? numCompetitors)
    );

    let candidates = remainingCompetitors.filter(
      (comp) => comp.majorityColumn === minMajorityColumn
    );

    if (candidates.length === 1) {
      candidates[0].place = place++;
      candidates[0].highlightPlace = minMajorityColumn;
      placedCompetitors.push(candidates[0]);
    } else {
      const maxCumulativeCount = Math.max(
        ...candidates.map((comp) => comp.cumulativeCountAtMajority)
      );
      candidates = candidates.filter(
        (comp) => comp.cumulativeCountAtMajority === maxCumulativeCount
      );

      if (candidates.length === 1) {
        candidates[0].place = place++;
        candidates[0].highlightPlace = minMajorityColumn;
        placedCompetitors.push(candidates[0]);
      } else {
        const minSumOfScores = Math.min(
          ...candidates.map((comp) => comp.sumOfScoresAtMajority)
        );
        candidates = candidates.filter(
          (comp) => comp.sumOfScoresAtMajority === minSumOfScores
        );

        if (candidates.length === 1) {
          candidates[0].place = place++;
          candidates[0].highlightPlace = minMajorityColumn;
          placedCompetitors.push(candidates[0]);
        } else {
          let tieResolved = false;
          const maxRank = numCompetitors;

          for (let nextRank = minMajorityColumn + 1; nextRank < maxRank; nextRank++) {
            candidates.forEach((comp) => {
              comp.tieBreakScores = comp.scores
                .filter((score) => score <= nextRank + 1)
                .sort((a, b) => a - b);
            });

            candidates.forEach((comp) => {
              comp.cumulativeCountAtMajority = comp.tieBreakScores!.length;
            });

            const maxCumulativeCountNext = Math.max(
              ...candidates.map((comp) => comp.cumulativeCountAtMajority)
            );

            const newCandidates = candidates.filter(
              (comp) => comp.cumulativeCountAtMajority === maxCumulativeCountNext
            );

            if (newCandidates.length === 1) {
              newCandidates[0].place = place++;
              newCandidates[0].highlightPlace = nextRank;
              placedCompetitors.push(newCandidates[0]);
              tieResolved = true;
              break;
            } else {
              candidates = newCandidates;
            }
          }

          if (!tieResolved) {
            candidates.forEach((comp) => {
              comp.headToHeadWins = 0;
            });

            for (let judge = 0; judge < numJudges; judge++) {
              const judgeRankings = rankings[judge];

              const judgeScores = candidates.map((comp) => {
                const idx = competitorsData.findIndex((c) => c.name === comp.name);
                return {
                  competitor: comp,
                  score: judgeRankings[idx],
                };
              });

              judgeScores.sort((a, b) => a.score - b.score);

              for (let i = 0; i < judgeScores.length; i++) {
                judgeScores[i].competitor.headToHeadWins =
                  (judgeScores[i].competitor.headToHeadWins || 0) +
                  (judgeScores.length - i - 1);
              }
            }

            const maxWins = Math.max(
              ...candidates.map((comp) => comp.headToHeadWins || 0)
            );

            const finalCandidates = candidates.filter(
              (comp) => (comp.headToHeadWins || 0) === maxWins
            );

            if (finalCandidates.length === 1) {
              finalCandidates[0].place = place++;
              finalCandidates[0].highlightPlace = minMajorityColumn;
              placedCompetitors.push(finalCandidates[0]);
            } else {
              finalCandidates.forEach((comp) => {
                comp.place = place;
                comp.highlightPlace = null;
                placedCompetitors.push(comp);
              });
              place += finalCandidates.length;
            }
          }
        }
      }
    }
  }

  return competitorsData
    .map((data) => ({
      competitor: data.name,
      scores: data.scores,
      counts: data.counts,
      cumulativeCounts: data.cumulativeCounts,
      majorityColumn: data.majorityColumn,
      cumulativeCountAtMajority: data.cumulativeCountAtMajority,
      sumOfScoresAtMajority: data.sumOfScoresAtMajority,
      place: data.place!,
      highlightPlace: data.highlightPlace,
    }))
    .sort((a, b) => a.place - b.place);
}
