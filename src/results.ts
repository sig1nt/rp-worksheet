import './styles.css';
import { calculateResults } from './calculateResults';
import { sanitize, ordinalSuffix } from './utils';

function parseQueryParams(): { competitors: string[]; rankings: number[][] } | null {
  const params = new URLSearchParams(window.location.search);

  const competitorsParam = params.get('competitors');
  if (!competitorsParam) return null;

  const competitors = competitorsParam.split(',').map(decodeURIComponent);
  if (competitors.length === 0) return null;

  const rankings: number[][] = [];
  let judgeIndex = 1;
  while (params.has(`j${judgeIndex}`)) {
    const judgeRanks = params.get(`j${judgeIndex}`)!.split(',').map(Number);
    if (judgeRanks.length !== competitors.length || judgeRanks.some(isNaN)) {
      return null;
    }
    rankings.push(judgeRanks);
    judgeIndex++;
  }

  if (rankings.length === 0) return null;

  return { competitors, rankings };
}

function renderResults(competitors: string[], rankings: number[][]): void {
  const app = document.getElementById('app');
  if (!app) return;

  const results = calculateResults(rankings, competitors);
  const numJudges = rankings.length;
  const maxPlace = results.length;

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
  for (let i = 0; i < numJudges; i++) {
    tableHTML += `<th>J${i + 1}</th>`;
  }

  // Cumulative count columns
  for (let i = 0; i < maxPlace; i++) {
    const dividerClass = i === 0 ? ' class="rp-divider"' : '';
    tableHTML += `<th${dividerClass}>1-${i + 1}</th>`;
  }

  tableHTML += '<th>Place</th></tr></thead><tbody>';

  // Result rows
  results.forEach(result => {
    tableHTML += `<tr><td>${sanitize(result.competitor)}</td>`;

    // Scores
    result.scores.forEach(score => {
      tableHTML += `<td>${score}</td>`;
    });

    // Cumulative counts
    result.cumulativeCounts.forEach((cumulativeCount, idx) => {
      const isHighlighted = result.highlightPlace !== null && idx === result.highlightPlace;
      const classes: string[] = [];
      if (idx === 0) classes.push('rp-divider');
      if (isHighlighted) classes.push('highlight');
      const className = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
      const sumText = isHighlighted ? ` (${result.sumOfScoresAtMajority})` : '';
      tableHTML += `<td${className}>${cumulativeCount}${sumText}</td>`;
    });

    tableHTML += `<td>${ordinalSuffix(result.place)}</td></tr>`;
  });

  tableHTML += '</tbody></table></div>';
  app.innerHTML = tableHTML;
}

function renderError(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <h1>Relative Placement Scoring System</h1>
    <p>Invalid or missing data. <a href="/index.html">Go back to enter scores.</a></p>
  `;
}

function init(): void {
  const data = parseQueryParams();
  if (data) {
    renderResults(data.competitors, data.rankings);
  } else {
    renderError();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
