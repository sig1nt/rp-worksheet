import './styles.css';

// Type definitions
interface CompetitorResult {
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

// State management
class AppState {
  competitors: string[];
  numJudges: number | null;
  results: CompetitorResult[] | null;
  rankings: number[][];

  constructor() {
    this.competitors = [];
    this.numJudges = null;
    this.results = null;
    this.rankings = [];
  }

  reset(): void {
    this.competitors = [];
    this.numJudges = null;
    this.results = null;
    this.rankings = [];
  }
}

const state = new AppState();

// Utility function for ordinal suffix
function ordinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return i + 'st';
  if (j === 2 && k !== 12) return i + 'nd';
  if (j === 3 && k !== 13) return i + 'rd';
  return i + 'th';
}

// Calculate results using the same algorithm as React version
function calculateResults(rankings: number[][], competitors: string[]): CompetitorResult[] {
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

// Setup Form Component
function renderSetupForm(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <h1>Relative Placement Scoring System</h1>
    <form id="setup-form">
      <label>
        Number of Competitors:
        <input type="number" id="num-competitors" min="1" required />
      </label>
      <br />
      <div id="competitor-names"></div>
      <br />
      <label>
        Number of Judges:
        <input type="number" id="num-judges" min="1" required />
      </label>
      <br />
      <button type="submit">Next</button>
    </form>
  `;

  const numCompetitorsInput = document.getElementById('num-competitors') as HTMLInputElement;
  const competitorNamesDiv = document.getElementById('competitor-names') as HTMLDivElement;
  const form = document.getElementById('setup-form') as HTMLFormElement;

  numCompetitorsInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    competitorNamesDiv.innerHTML = '';

    for (let i = 0; i < value; i++) {
      const div = document.createElement('div');
      div.innerHTML = `
        <label>
          Competitor ${i + 1} Name:
          <input type="text" class="competitor-name" data-index="${i}" required />
        </label>
      `;
      competitorNamesDiv.appendChild(div);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const competitorInputs = document.querySelectorAll<HTMLInputElement>('.competitor-name');
    state.competitors = Array.from(competitorInputs).map(input => input.value);

    const numJudgesInput = document.getElementById('num-judges') as HTMLInputElement;
    state.numJudges = parseInt(numJudgesInput.value);

    // Initialize rankings array
    state.rankings = Array.from(
      { length: state.numJudges },
      () => Array(state.competitors.length).fill(0)
    );

    renderRankingsInput();
  });
}

// Rankings Input Component
function renderRankingsInput(): void {
  const app = document.getElementById('app');
  if (!app || state.numJudges === null) return;

  const numCompetitors = state.competitors.length;

  let formHTML = '<h1>Relative Placement Scoring System</h1><form id="rankings-form">';

  for (let judgeIndex = 0; judgeIndex < state.numJudges; judgeIndex++) {
    formHTML += `<div><h3>Judge ${judgeIndex + 1}</h3>`;

    for (let competitorIndex = 0; competitorIndex < state.competitors.length; competitorIndex++) {
      formHTML += `
        <div>
          <label>
            ${state.competitors[competitorIndex]} Rank:
            <input
              type="number"
              class="ranking-input"
              data-judge="${judgeIndex}"
              data-competitor="${competitorIndex}"
              min="1"
              max="${numCompetitors}"
              required
            />
          </label>
        </div>
      `;
    }

    formHTML += '</div>';
  }

  formHTML += '<button type="submit">Calculate Results</button></form>';
  app.innerHTML = formHTML;

  const rankingInputs = document.querySelectorAll<HTMLInputElement>('.ranking-input');
  rankingInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const judgeIndex = parseInt(target.dataset.judge!);
      const competitorIndex = parseInt(target.dataset.competitor!);
      const value = parseInt(target.value) || 0;

      state.rankings[judgeIndex][competitorIndex] = value;
    });
  });

  const form = document.getElementById('rankings-form') as HTMLFormElement;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.results = calculateResults(state.rankings, state.competitors);
    renderResults();
  });
}

// Results Component
function renderResults(): void {
  const app = document.getElementById('app');
  if (!app || !state.results || state.numJudges === null) return;

  const maxPlace = state.results.length;

  let tableHTML = `
    <h1>Relative Placement Scoring System</h1>
    <div>
      <h2>Final Results</h2>
      <table border="1" cellpadding="5" style="margin: 0 auto; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Competitor</th>
  `;

  // Judge columns
  for (let i = 0; i < state.numJudges; i++) {
    tableHTML += `<th>J${i + 1}</th>`;
  }

  // Cumulative count columns
  for (let i = 0; i < maxPlace; i++) {
    tableHTML += `<th>1-${i + 1}</th>`;
  }

  tableHTML += '<th>Place</th></tr></thead><tbody>';

  // Result rows
  state.results.forEach(result => {
    tableHTML += `<tr><td>${result.competitor}</td>`;

    // Scores
    result.scores.forEach(score => {
      tableHTML += `<td>${score}</td>`;
    });

    // Cumulative counts
    result.cumulativeCounts.forEach((cumulativeCount, idx) => {
      const isHighlighted = result.highlightPlace !== null && idx === result.highlightPlace;
      const className = isHighlighted ? ' class="highlight"' : '';
      const sumText = isHighlighted ? ` (${result.sumOfScoresAtMajority})` : '';
      tableHTML += `<td${className}>${cumulativeCount}${sumText}</td>`;
    });

    tableHTML += `<td>${ordinalSuffix(result.place)}</td></tr>`;
  });

  tableHTML += '</tbody></table></div>';
  app.innerHTML = tableHTML;
}

// Initialize the app
function init(): void {
  renderSetupForm();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
