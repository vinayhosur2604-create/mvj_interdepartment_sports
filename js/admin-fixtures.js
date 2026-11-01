/**
 * MVJ INTERDEPARTMENT SPORTS - MANAGE FIXTURES & RESULTS (admin/fixtures.html)
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.MVJ_AUTH) {
    window.MVJ_AUTH.requireAuth();
  }

  setupAdminSessionUI();
  await initializeAdminFixtures();
  setupAddMatchModal();
  setupEditMatchModal();
  setupQuickResultModal();

  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      initializeAdminFixtures();
    });
  }
});

function setupAdminSessionUI() {
  const user = window.MVJ_AUTH?.currentUser;
  const adminNameEl = document.getElementById('adminUserName');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  if (user && adminNameEl) adminNameEl.textContent = user.name || user.email;
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out?')) {
        window.MVJ_AUTH.logout();
      }
    });
  }
}

let cachedMatches = [];
let cachedSports = [];
let cachedDepartments = [];
let adminFixtureFiltersInitialized = false;

async function initializeAdminFixtures() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    const [sports, departments] = await Promise.all([
      db.getSports(),
      db.getDepartments()
    ]);

    cachedSports = sports;
    cachedDepartments = departments;

    populateSportDropdowns(sports);
    populateTeamDropdowns(departments);

    if (!adminFixtureFiltersInitialized) {
      document.getElementById('filterSportSelect')?.addEventListener('change', loadFixturesTable);
      document.getElementById('filterStageSelect')?.addEventListener('change', loadFixturesTable);
      document.getElementById('filterStatusSelect')?.addEventListener('change', loadFixturesTable);
      adminFixtureFiltersInitialized = true;
    }

    await loadFixturesTable();
  } catch (err) {
    console.error('Error initializing admin fixtures:', err);
  }
}

function populateSportDropdowns(sports) {
  const filterSelect = document.getElementById('filterSportSelect');
  const addSelect = document.getElementById('addMatchSport');
  const editSelect = document.getElementById('editMatchSport');

  const optionsHtml = sports.map((s) => `<option value="${s.slug}">${s.name}</option>`).join('');

  if (filterSelect) filterSelect.innerHTML = `<option value="All">All Sports</option>` + optionsHtml;
  if (addSelect) addSelect.innerHTML = optionsHtml;
  if (editSelect) editSelect.innerHTML = optionsHtml;
}

function populateTeamDropdowns(departments) {
  const teamOptions = departments.map((d) => `<option value="${d.code}">${d.code} (${d.name})</option>`).join('');

  const addTeamA = document.getElementById('addMatchTeamA');
  const addTeamB = document.getElementById('addMatchTeamB');
  const editTeamA = document.getElementById('editMatchTeamA');
  const editTeamB = document.getElementById('editMatchTeamB');

  if (addTeamA) addTeamA.innerHTML = teamOptions;
  if (addTeamB) addTeamB.innerHTML = teamOptions;
  if (editTeamA) editTeamA.innerHTML = teamOptions;
  if (editTeamB) editTeamB.innerHTML = teamOptions;
}

async function loadFixturesTable() {
  const db = window.MVJ_DB;
  if (!db) return;

  const sportFilter = document.getElementById('filterSportSelect')?.value || 'All';
  const stageFilter = document.getElementById('filterStageSelect')?.value || 'All';
  const statusFilter = document.getElementById('filterStatusSelect')?.value || 'All';

  try {
    let matches = await db.getMatches();

    if (sportFilter !== 'All') {
      matches = matches.filter((m) => m.sport_slug?.toLowerCase() === sportFilter.toLowerCase());
    }
    if (stageFilter !== 'All') {
      matches = matches.filter((m) => m.stage === stageFilter);
    }
    if (statusFilter !== 'All') {
      matches = matches.filter((m) => m.status === statusFilter);
    }

    cachedMatches = matches;
    renderFixturesTable(cachedMatches);
  } catch (err) {
    console.error('Error loading matches table:', err);
  }
}

function renderFixturesTable(matches) {
  const tbody = document.getElementById('matchesTableBody');
  if (!tbody) return;

  if (!matches || matches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:24px;">No matches match the selected criteria. Click "+ Add New Match" to schedule one.</td></tr>';
    return;
  }

  tbody.innerHTML = matches.map((m) => {
    const statusClass = m.status === 'Live' ? 'status-live' : m.status === 'Completed' ? 'status-completed' : 'status-upcoming';

    return `
      <tr>
        <td>
          <span class="match-sport-badge">${(m.sport_slug || 'Sport').toUpperCase()}</span>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">${m.stage_label || m.stage}</div>
        </td>
        <td>
          <strong>${m.team_a}</strong> vs <strong>${m.team_b}</strong>
        </td>
        <td>
          <span style="font-weight:800; font-family:var(--font-heading); color:var(--blue-primary); font-size:1.05rem;">
            ${m.score_a} - ${m.score_b}
          </span>
        </td>
        <td><span class="match-status-badge ${statusClass}">${m.status}</span></td>
        <td>
          <div><i class="fa-regular fa-calendar"></i> ${m.match_date}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${m.match_time} &bull; ${m.venue}</div>
        </td>
        <td>
          ${m.winner ? `<span style="font-weight:700; color:var(--success);"><i class="fa-solid fa-crown"></i> ${m.winner}</span>` : '<span style="color:var(--text-secondary)">-</span>'}
        </td>
        <td>
          <div class="admin-actions-bar">
            <button class="btn-action result" onclick="openQuickResultModal('${m.id}')" title="Update Score / Result">
              <i class="fa-solid fa-square-poll-vertical"></i> Result
            </button>
            <button class="btn-action edit" onclick="openEditMatchModal('${m.id}')" title="Edit Match">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-action delete" onclick="confirmDeleteMatch('${m.id}', '${m.team_a} vs ${m.team_b}')" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupAddMatchModal() {
  const modal = document.getElementById('addMatchModal');
  const openBtn = document.getElementById('openAddMatchModalBtn');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('addMatchForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('addMatchDate').value = new Date().toISOString().split('T')[0];
      modal.classList.add('active');
    });
  }

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sport_slug = document.getElementById('addMatchSport').value;
      const stage = document.getElementById('addMatchStage').value;
      const stage_label = document.getElementById('addMatchStageLabel').value.trim() || stage;
      const team_a = document.getElementById('addMatchTeamA').value;
      const team_b = document.getElementById('addMatchTeamB').value;
      const match_date = document.getElementById('addMatchDate').value;
      const match_time = document.getElementById('addMatchTime').value.trim() || '10:00 AM';
      const venue = document.getElementById('addMatchVenue').value.trim() || 'MVJ College Ground';
      const status = document.getElementById('addMatchStatus').value;
      const score_a = document.getElementById('addMatchScoreA').value.trim() || '-';
      const score_b = document.getElementById('addMatchScoreB').value.trim() || '-';
      const winner = document.getElementById('addMatchWinner').value.trim();
      const result = document.getElementById('addMatchResult').value.trim();

      if (team_a === team_b) {
        alert('Team A and Team B cannot be the same department!');
        return;
      }

      try {
        await window.MVJ_DB.addMatch({
          sport_slug,
          stage,
          stage_label,
          team_a,
          team_b,
          match_date,
          match_time,
          venue,
          status,
          score_a,
          score_b,
          winner,
          result
        });

        modal.classList.remove('active');
        showToast('New match added to fixtures schedule!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function setupQuickResultModal() {
  const modal = document.getElementById('quickResultModal');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('quickResultForm');

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('resultMatchId').value;
      const score_a = document.getElementById('resultScoreA').value.trim();
      const score_b = document.getElementById('resultScoreB').value.trim();
      const status = document.getElementById('resultStatus').value;
      const winner = document.getElementById('resultWinner').value.trim();
      const result = document.getElementById('resultStatement').value.trim();

      try {
        await window.MVJ_DB.updateMatch(id, {
          score_a,
          score_b,
          status,
          winner,
          result
        });

        modal.classList.remove('active');
        showToast('Match scores and result updated successfully!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function openQuickResultModal(matchId) {
  const match = cachedMatches.find((m) => m.id === matchId);
  if (!match) return;

  document.getElementById('resultMatchId').value = match.id;
  document.getElementById('resultMatchHeading').textContent = `${match.team_a} vs ${match.team_b} (${(match.sport_slug || '').toUpperCase()})`;
  document.getElementById('resultLabelA').textContent = `Score for ${match.team_a}`;
  document.getElementById('resultLabelB').textContent = `Score for ${match.team_b}`;
  document.getElementById('resultScoreA').value = match.score_a;
  document.getElementById('resultScoreB').value = match.score_b;
  document.getElementById('resultStatus').value = match.status;

  // Populate winner dropdown with Team A, Team B, Draw, or None
  const winnerSelect = document.getElementById('resultWinner');
  winnerSelect.innerHTML = `
    <option value="">-- No Winner Yet --</option>
    <option value="${match.team_a}">${match.team_a}</option>
    <option value="${match.team_b}">${match.team_b}</option>
    <option value="Draw">Match Tied / Draw</option>
  `;
  winnerSelect.value = match.winner || '';
  document.getElementById('resultStatement').value = match.result || '';

  document.getElementById('quickResultModal').classList.add('active');
}
window.openQuickResultModal = openQuickResultModal;

function setupEditMatchModal() {
  const modal = document.getElementById('editMatchModal');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('editMatchForm');

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editMatchId').value;
      const sport_slug = document.getElementById('editMatchSport').value;
      const stage = document.getElementById('editMatchStage').value;
      const stage_label = document.getElementById('editMatchStageLabel').value.trim();
      const team_a = document.getElementById('editMatchTeamA').value;
      const team_b = document.getElementById('editMatchTeamB').value;
      const match_date = document.getElementById('editMatchDate').value;
      const match_time = document.getElementById('editMatchTime').value.trim();
      const venue = document.getElementById('editMatchVenue').value.trim();
      const status = document.getElementById('editMatchStatus').value;
      const score_a = document.getElementById('editMatchScoreA').value.trim();
      const score_b = document.getElementById('editMatchScoreB').value.trim();
      const winner = document.getElementById('editMatchWinner').value.trim();
      const result = document.getElementById('editMatchResult').value.trim();

      try {
        await window.MVJ_DB.updateMatch(id, {
          sport_slug,
          stage,
          stage_label,
          team_a,
          team_b,
          match_date,
          match_time,
          venue,
          status,
          score_a,
          score_b,
          winner,
          result
        });

        modal.classList.remove('active');
        showToast('Match updated successfully!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function openEditMatchModal(matchId) {
  const match = cachedMatches.find((m) => m.id === matchId);
  if (!match) return;

  document.getElementById('editMatchId').value = match.id;
  document.getElementById('editMatchSport').value = match.sport_slug || 'cricket';
  document.getElementById('editMatchStage').value = match.stage || 'Regular';
  document.getElementById('editMatchStageLabel').value = match.stage_label || '';
  document.getElementById('editMatchTeamA').value = match.team_a;
  document.getElementById('editMatchTeamB').value = match.team_b;
  document.getElementById('editMatchDate').value = match.match_date;
  document.getElementById('editMatchTime').value = match.match_time;
  document.getElementById('editMatchVenue').value = match.venue;
  document.getElementById('editMatchStatus').value = match.status;
  document.getElementById('editMatchScoreA').value = match.score_a;
  document.getElementById('editMatchScoreB').value = match.score_b;
  document.getElementById('editMatchWinner').value = match.winner || '';
  document.getElementById('editMatchResult').value = match.result || '';

  document.getElementById('editMatchModal').classList.add('active');
}
window.openEditMatchModal = openEditMatchModal;

async function confirmDeleteMatch(matchId, matchTitle) {
  if (confirm(`Are you sure you want to delete match "${matchTitle}"?`)) {
    try {
      await window.MVJ_DB.deleteMatch(matchId);
      showToast('Match deleted from schedule.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
window.confirmDeleteMatch = confirmDeleteMatch;

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toastContainer';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}
