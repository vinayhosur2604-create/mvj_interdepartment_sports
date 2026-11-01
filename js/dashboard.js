/**
 * MVJ INTERDEPARTMENT SPORTS - ADMIN DASHBOARD LOGIC (dashboard.html)
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Authentication Guard
  if (window.MVJ_AUTH) {
    window.MVJ_AUTH.requireAuth();
  }

  // Sidebar Mobile Toggle
  const adminMobileToggle = document.getElementById('adminMobileToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  if (adminMobileToggle && adminSidebar) {
    adminMobileToggle.addEventListener('click', () => {
      adminSidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!adminSidebar.contains(e.target) && !adminMobileToggle.contains(e.target)) {
        adminSidebar.classList.remove('open');
      }
    });
  }

  // Setup Admin Info & Logout
  setupAdminSessionUI();

  // Load Dashboard Data & Charts
  await loadDashboardAnalytics();

  // Real-time synchronization
  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadDashboardAnalytics();
    });
  }
});

function setupAdminSessionUI() {
  const user = window.MVJ_AUTH?.currentUser;
  const adminNameEl = document.getElementById('adminUserName');
  const adminRoleEl = document.getElementById('adminUserRole');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  if (user) {
    if (adminNameEl) adminNameEl.textContent = user.name || user.email;
    if (adminRoleEl) adminRoleEl.textContent = (user.role || 'Administrator').toUpperCase();
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out of the Sports Administration Dashboard?')) {
        window.MVJ_AUTH.logout();
      }
    });
  }
}

async function loadDashboardAnalytics() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    // 1. Fetch Stats
    const stats = await db.getStats();
    document.getElementById('dashTotalDepts').textContent = stats.totalDepartments;
    document.getElementById('dashTotalSports').textContent = stats.totalSports;
    document.getElementById('dashTotalMatches').textContent = stats.totalMatches;
    document.getElementById('dashCompletedMatches').textContent = stats.completedMatches;
    document.getElementById('dashUpcomingMatches').textContent = stats.upcomingMatches;
    document.getElementById('dashLiveMatches').textContent = stats.liveMatches;

    // 2. Fetch Departments & Render Charts + Ranking List
    const departments = await db.getDepartments();

    // Render Department Donut Chart
    if (window.MVJ_CHARTS) {
      window.MVJ_CHARTS.initDonutChart('donutChartCanvas', departments);
      window.MVJ_CHARTS.initBarChart('barChartCanvas', departments);
      window.MVJ_CHARTS.initMatchStatusChart('statusChartCanvas', stats);
    }

    // Render Department Ranking List beside Chart
    renderDepartmentRankingsList(departments);

    // 3. Render Recent Matches Table
    const matches = await db.getMatches();
    renderRecentMatchesTable(matches);

  } catch (err) {
    console.error('Error loading admin dashboard analytics:', err);
  }
}

function renderDepartmentRankingsList(departments) {
  const container = document.getElementById('dashRankingList');
  if (!container) return;

  container.innerHTML = departments.map((dept, index) => {
    const rank = index + 1;
    return `
      <li class="ranking-item">
        <div class="rank-item-left">
          <span class="rank-item-badge">${rank}</span>
          <div>
            <div class="rank-dept-name">${dept.name}</div>
            <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:700;">
              🥇 ${dept.gold} | 🥈 ${dept.silver} | 🥉 ${dept.bronze}
            </span>
          </div>
        </div>
        <div class="rank-points-tag">${dept.points} pts</div>
      </li>
    `;
  }).join('');
}

function renderRecentMatchesTable(matches) {
  const tbody = document.getElementById('dashRecentMatchesTable');
  if (!tbody) return;

  if (!matches || matches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:20px;">No matches found</td></tr>';
    return;
  }

  // Show up to 5 most recent
  const slice = matches.slice(0, 5);

  tbody.innerHTML = slice.map((m) => {
    const statusClass = m.status === 'Live' ? 'status-live' : m.status === 'Completed' ? 'status-completed' : 'status-upcoming';

    return `
      <tr>
        <td>
          <strong>${(m.sport_slug || 'Sport').toUpperCase()}</strong>
          <div style="font-size:0.75rem; color:var(--text-secondary)">${m.stage_label || m.stage}</div>
        </td>
        <td><strong>${m.team_a}</strong> vs <strong>${m.team_b}</strong></td>
        <td>${m.score_a} - ${m.score_b}</td>
        <td><span class="match-status-badge ${statusClass}">${m.status}</span></td>
        <td>${m.match_date}</td>
        <td>
          <a href="fixtures.html" class="btn-action edit" title="Manage in Fixtures">
            <i class="fa-solid fa-pen-to-square"></i>
          </a>
        </td>
      </tr>
    `;
  }).join('');
}
