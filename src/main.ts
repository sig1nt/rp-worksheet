import './styles.css';
import { sanitize } from './utils';

// State management
class AppState {
  competitors: string[];
  numJudges: number | null;
  rankings: number[][];

  constructor() {
    this.competitors = [];
    this.numJudges = null;
    this.rankings = [];
  }

  reset(): void {
    this.competitors = [];
    this.numJudges = null;
    this.rankings = [];
  }
}

const state = new AppState();

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
    navigateToResults();
  });
}

// Build query params and navigate to results page
function navigateToResults(): void {
  const params = new URLSearchParams();
  params.set('competitors', state.competitors.map(encodeURIComponent).join(','));

  for (let i = 0; i < state.rankings.length; i++) {
    params.set(`j${i}`, state.rankings[i].join(','));
  }

  window.location.href = `/results.html?${params.toString()}`;
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
