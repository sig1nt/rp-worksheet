import './styles.css';
import { calculateResults, type CompetitorResult } from './calculateResults';
import DOMPurify from 'dompurify';

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

// Utility function to sanitize user input and prevent XSS
function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

// Utility function for ordinal suffix
function ordinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return i + 'st';
  if (j === 2 && k !== 12) return i + 'nd';
  if (j === 3 && k !== 13) return i + 'rd';
  return i + 'th';
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
            ${sanitize(state.competitors[competitorIndex])} Rank:
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
    tableHTML += `<tr><td>${sanitize(result.competitor)}</td>`;

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
