/**
 * MVJ INTERDEPARTMENT SPORTS - DYNAMIC FIXTURES LOGIC (fixtures.html)
 * Loads dynamic schedule for any sport via ?sport=xyz
 * Displays Section A: Regular Matches, Section B: Semi-Finals, Section C: Grand Final
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Parse URL parameter: ?sport=xyz
  const urlParams = new URLSearchParams(window.location.search);
  let activeSportSlug = urlParams.get('sport') || 'cricket';

  await initializeFixturesPage(activeSportSlug);

  // Status Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.getAttribute('data-status');
      currentStatusFilter = status;
      applyFilters();
    });
  });

  // Team search
  const teamSearchInput = document.getElementById('teamSearchInput');
  if (teamSearchInput) {
    teamSearchInput.addEventListener('input', (e) => {
      currentTeamSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Real-time synchronization
  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadSportFixtures(currentSport);
    });
  }
});

let currentSport = null;
let currentMatches = [];
let currentStatusFilter = 'All';
let currentTeamSearch = '';

async function initializeFixturesPage(slug) {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    const sports = await db.getSports();
    renderSportSelectorChips(sports, slug);

    // Find current sport by slug or fallback to first
    let selected = sports.find((s) => s.slug?.toLowerCase() === slug?.toLowerCase());
    if (!selected && sports.length > 0) {
      selected = sports[0];
    }

    currentSport = selected;
    await loadSportFixtures(currentSport);
  } catch (err) {
    console.error('Error initializing fixtures:', err);
  }
}

function renderSportSelectorChips(sports, activeSlug) {
  const container = document.getElementById('sportSelectorContainer');
  if (!container) return;

  container.innerHTML = sports.map((sport) => {
    const isActive = sport.slug?.toLowerCase() === activeSlug?.toLowerCase();
    const iconClass = sport.icon && sport.icon.startsWith('fa-') ? sport.icon : 'fa-trophy';
    return `
      <a href="fixtures.html?sport=${encodeURIComponent(sport.slug)}" 
         class="sport-chip ${isActive ? 'active' : ''}">
        <i class="fa-solid ${iconClass}"></i>
        <span>${sport.name}</span>
      </a>
    `;
  }).join('');
}

async function loadSportFixtures(sport) {
  if (!sport) return;

  // Update header text
  const titleEl = document.getElementById('sportActiveTitle');
  const descEl = document.getElementById('sportActiveDesc');
  const stageEl = document.getElementById('sportStageBadge');

  if (titleEl) titleEl.textContent = `${sport.name.toUpperCase()} TOURNAMENT`;
  if (descEl) descEl.textContent = sport.description || `Interdepartment ${sport.name} championship fixtures and live score updates.`;
  if (stageEl) stageEl.textContent = sport.current_stage || 'Tournament';

  // Fetch all matches for this sport
  const db = window.MVJ_DB;
  const allMatches = await db.getMatches();

  currentMatches = allMatches.filter(
    (m) => m.sport_slug?.toLowerCase() === sport.slug?.toLowerCase() || m.sport_id === sport.id
  );

  applyFilters();
}

function applyFilters() {
  let filtered = currentMatches;

  if (currentStatusFilter !== 'All') {
    filtered = filtered.filter((m) => m.status === currentStatusFilter);
  }

  if (currentTeamSearch) {
    filtered = filtered.filter(
      (m) =>
        m.team_a?.toLowerCase().includes(currentTeamSearch) ||
        m.team_b?.toLowerCase().includes(currentTeamSearch)
    );
  }

  renderFixturesSections(filtered);
}

function renderFixturesSections(matches) {
  // 1. Grand Final
  const grandFinalMatches = matches.filter((m) => m.stage === 'Grand Final');
  renderGrandFinalSection(grandFinalMatches);

  // 2. Semi-Finals
  const semiFinalMatches = matches.filter((m) => m.stage === 'Semi-Final');
  renderSemiFinalsSection(semiFinalMatches);

  // 3. Regular Matches
  const regularMatches = matches.filter((m) => m.stage === 'Regular' || (!m.stage.includes('Final')));
  renderRegularMatchesSection(regularMatches);
}

function renderGrandFinalSection(matches) {
  const container = document.getElementById('grandFinalContainer');
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `
      <div class="grand-final-showcase text-center">
        <div class="final-trophy-badge"><i class="fa-solid fa-trophy"></i> THE GRAND FINAL</div>
        <div style="padding: 20px 0; color: var(--text-secondary); font-size: 1.1rem; font-weight: 700;">
          <i class="fa-solid fa-hourglass-start" style="margin-right:8px"></i> FINAL MATCH PENDING
        </div>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">Grand final teams will be announced following the completion of the semi-finals.</p>
      </div>
    `;
    return;
  }

  const match = matches[0]; // Primary grand final
  const isCompleted = match.status === 'Completed';
  const hasWinner = Boolean(match.winner && match.winner.trim() !== '');

  const statusClass = match.status === 'Live' ? 'status-live' : isCompleted ? 'status-completed' : 'status-upcoming';
  const statusLabel = match.status === 'Live' ? 'LIVE NOW' : isCompleted ? 'CHAMPIONSHIP COMPLETED' : 'FINAL MATCH PENDING';

  container.innerHTML = `
    <div class="grand-final-showcase">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div class="final-trophy-badge">
          <i class="fa-solid fa-trophy"></i> THE GRAND FINAL
        </div>
        <span class="match-status-badge ${statusClass}">${statusLabel}</span>
      </div>

      <div class="final-matchup-container">
        <div class="final-team-block">
          <div class="final-team-circle">${match.team_a.substring(0, 4)}</div>
          <div class="final-team-name">${match.team_a}</div>
          <div class="final-score-box">${match.score_a !== '-' ? match.score_a : '-'}</div>
        </div>

        <div class="final-vs-hub">
          <div class="final-trophy-icon"><i class="fa-solid fa-trophy"></i></div>
          <div style="font-family:var(--font-heading); font-size:1.4rem; font-weight:900; color:var(--gold);">VS</div>
        </div>

        <div class="final-team-block">
          <div class="final-team-circle">${match.team_b.substring(0, 4)}</div>
          <div class="final-team-name">${match.team_b}</div>
          <div class="final-score-box">${match.score_b !== '-' ? match.score_b : '-'}</div>
        </div>
      </div>

      ${hasWinner ? `
        <div class="final-champion-banner">
          <i class="fa-solid fa-crown" style="margin-right:8px; color:var(--gold)"></i> 
          CHAMPION: ${match.winner} - ${match.result || 'Victory in Grand Final'}
        </div>
      ` : match.result ? `
        <div class="match-result-banner" style="margin-top:16px;">
          <i class="fa-solid fa-circle-info"></i> ${match.result}
        </div>
      ` : ''}

      <div class="match-meta-info" style="margin-top:24px;">
        <span><i class="fa-regular fa-calendar"></i> ${match.match_date}</span>
        <span><i class="fa-regular fa-clock"></i> ${match.match_time}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${match.venue}</span>
      </div>
    </div>
  `;
}

function renderSemiFinalsSection(matches) {
  const container = document.getElementById('semiFinalsContainer');
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-state-title">No semi-final matches scheduled yet.</div>
        <div class="empty-state-text">Semi-final pairings will be updated as regular stages conclude.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map((match) => {
    const statusClass = match.status === 'Live' ? 'status-live' : match.status === 'Completed' ? 'status-completed' : 'status-upcoming';
    const statusText = match.status === 'Live' ? 'LIVE NOW' : match.status === 'Completed' ? 'COMPLETED' : 'UPCOMING';

    return `
      <div class="semi-final-card">
        <div class="match-card-header">
          <span class="semi-final-tag">
            <i class="fa-solid fa-fire"></i> ${match.stage_label || 'SEMI-FINAL'}
          </span>
          <span class="match-status-badge ${statusClass}">${statusText}</span>
        </div>

        <div class="match-teams-row">
          <div class="match-team">
            <div class="match-team-code">${match.team_a}</div>
            <div class="match-team-score">${match.score_a !== '-' ? match.score_a : ''}</div>
          </div>
          <div class="match-vs-divider">
            <div class="vs-circle">VS</div>
          </div>
          <div class="match-team">
            <div class="match-team-code">${match.team_b}</div>
            <div class="match-team-score">${match.score_b !== '-' ? match.score_b : ''}</div>
          </div>
        </div>

        ${match.result ? `
          <div class="match-result-banner ${match.winner ? 'winner-declared' : ''}">
            <i class="fa-solid ${match.winner ? 'fa-award' : 'fa-circle-info'}"></i> ${match.result}
          </div>
        ` : ''}

        <div class="match-meta-info">
          <span><i class="fa-regular fa-calendar"></i> ${match.match_date}</span>
          <span><i class="fa-regular fa-clock"></i> ${match.match_time}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${match.venue}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderRegularMatchesSection(matches) {
  const container = document.getElementById('regularMatchesContainer');
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-state-title">No matches scheduled yet.</div>
        <div class="empty-state-text">Check back for tournament fixtures announcements.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map((match) => {
    const statusClass = match.status === 'Live' ? 'status-live' : match.status === 'Completed' ? 'status-completed' : 'status-upcoming';
    const statusText = match.status === 'Live' ? 'LIVE NOW' : match.status === 'Completed' ? 'MATCH COMPLETED' : 'MATCH NOT STARTED';

    return `
      <div class="match-card">
        <div class="match-card-header">
          <span class="match-sport-badge">
            ${match.stage_label || 'REGULAR MATCH'}
          </span>
          <span class="match-status-badge ${statusClass}">${statusText}</span>
        </div>

        <div class="match-teams-row">
          <div class="match-team">
            <div class="match-team-code">${match.team_a}</div>
            <div class="match-team-score">${match.score_a !== '-' ? match.score_a : ''}</div>
          </div>
          <div class="match-vs-divider">
            <div class="vs-circle">VS</div>
          </div>
          <div class="match-team">
            <div class="match-team-code">${match.team_b}</div>
            <div class="match-team-score">${match.score_b !== '-' ? match.score_b : ''}</div>
          </div>
        </div>

        ${match.result ? `
          <div class="match-result-banner ${match.winner ? 'winner-declared' : ''}">
            <i class="fa-solid ${match.winner ? 'fa-award' : 'fa-circle-info'}"></i> ${match.result}
          </div>
        ` : ''}

        <div class="match-meta-info">
          <span><i class="fa-regular fa-calendar"></i> ${match.match_date}</span>
          <span><i class="fa-regular fa-clock"></i> ${match.match_time}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${match.venue}</span>
        </div>
      </div>
    `;
  }).join('');
}
