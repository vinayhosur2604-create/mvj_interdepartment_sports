/**
 * MVJ INTERDEPARTMENT SPORTS - HOMEPAGE LOGIC (index.html)
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileNavToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking outside or clicking a link
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      }
    });
  }

  // Load all homepage data
  await loadHomepageData();

  // Listen for real-time updates from Supabase or admin mutations
  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadHomepageData();
    });
  }
});

async function loadHomepageData() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    // 1. Settings & Branding
    const settings = await db.getSettings();
    if (settings) {
      const tournamentName = settings.tournament_name || window.MVJ_CONFIG.PORTAL_TITLE;
      const tournamentNameEl = document.getElementById('heroTournamentName');
      if (tournamentName) {
        document.title = `${tournamentName} | MVJ College of Engineering`;
        if (tournamentNameEl) tournamentNameEl.textContent = tournamentName;
      }
      const heroTaglineEl = document.getElementById('heroTagline');
      const heroSubtitleEl = document.getElementById('heroSubtitle');
      const tournamentStatusEl = document.getElementById('tournamentStatusText');
      const academicYearEl = document.getElementById('heroAcademicYear');

      if (heroTaglineEl) heroTaglineEl.textContent = settings.homepage_tagline || window.MVJ_CONFIG.TAGLINE;
      if (heroSubtitleEl) heroSubtitleEl.textContent = settings.homepage_subtitle || window.MVJ_CONFIG.SUBTITLE;
      if (tournamentStatusEl) tournamentStatusEl.textContent = `${settings.tournament_status || 'Ongoing'} Championship`;
      if (academicYearEl) academicYearEl.textContent = `AY ${settings.academic_year || '2026-2027'}`;
    }

    // 2. Statistics Cards
    const stats = await db.getStats();
    document.getElementById('statTotalDepts').textContent = stats.totalDepartments;
    document.getElementById('statTotalSports').textContent = stats.totalSports;
    document.getElementById('statTotalMatches').textContent = stats.totalMatches;
    document.getElementById('statCompletedMatches').textContent = stats.completedMatches;
    document.getElementById('statUpcomingMatches').textContent = stats.upcomingMatches;
    document.getElementById('statLiveMatches').textContent = stats.liveMatches;

    // 3. Department Leaderboard & Podium
    const departments = await db.getDepartments();
    renderLeaderboardAndPodium(departments);

    // 4. Latest Match Results & Upcoming Matches
    const matches = await db.getMatches();
    renderHomepageMatches(matches);

    // 5. Announcements
    const announcements = await db.getAnnouncements(true);
    renderAnnouncements(announcements);

  } catch (error) {
    console.error('Error loading homepage data:', error);
  }
}

function renderLeaderboardAndPodium(departments) {
  const podiumContainer = document.getElementById('podiumContainer');
  const leaderboardTableBody = document.getElementById('leaderboardTableBody');

  if (!podiumContainer || !leaderboardTableBody) return;

  if (!departments || departments.length === 0) {
    podiumContainer.innerHTML = '<div class="empty-state">No departments registered yet.</div>';
    leaderboardTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No data available</td></tr>';
    return;
  }

  // Top 3 for Podium
  const top1 = departments[0];
  const top2 = departments[1];
  const top3 = departments[2];

  let podiumHtml = '';

  // Step 2: 2nd place (order 1)
  if (top2) {
    podiumHtml += `
      <div class="podium-step rank-2">
        <div class="podium-badge"><i class="fa-solid fa-medal"></i></div>
        <div class="podium-dept-name">${top2.code}</div>
        <div class="podium-dept-full" title="${top2.name}">${top2.name}</div>
        <div class="podium-points">${top2.points} <span style="font-size:0.8rem;font-weight:600">PTS</span></div>
        <div class="podium-medals-mini">
          <span>🥇 ${top2.gold}</span>
          <span>🥈 ${top2.silver}</span>
          <span>🥉 ${top2.bronze}</span>
        </div>
        <div class="podium-block">2</div>
      </div>
    `;
  }

  // Step 1: 1st place (order 2)
  if (top1) {
    podiumHtml += `
      <div class="podium-step rank-1">
        <div class="podium-badge"><i class="fa-solid fa-crown"></i></div>
        <div class="podium-dept-name" style="font-size:1.35rem;color:var(--gold)">${top1.code}</div>
        <div class="podium-dept-full" title="${top1.name}" style="font-weight:700">${top1.name}</div>
        <div class="podium-points" style="font-size:1.7rem;color:var(--gold)">${top1.points} <span style="font-size:0.85rem;font-weight:600">PTS</span></div>
        <div class="podium-medals-mini">
          <span>🥇 ${top1.gold}</span>
          <span>🥈 ${top1.silver}</span>
          <span>🥉 ${top1.bronze}</span>
        </div>
        <div class="podium-block">1</div>
      </div>
    `;
  }

  // Step 3: 3rd place (order 3)
  if (top3) {
    podiumHtml += `
      <div class="podium-step rank-3">
        <div class="podium-badge"><i class="fa-solid fa-award"></i></div>
        <div class="podium-dept-name">${top3.code}</div>
        <div class="podium-dept-full" title="${top3.name}">${top3.name}</div>
        <div class="podium-points">${top3.points} <span style="font-size:0.8rem;font-weight:600">PTS</span></div>
        <div class="podium-medals-mini">
          <span>🥇 ${top3.gold}</span>
          <span>🥈 ${top3.silver}</span>
          <span>🥉 ${top3.bronze}</span>
        </div>
        <div class="podium-block">3</div>
      </div>
    `;
  }

  podiumContainer.innerHTML = podiumHtml;

  // Complete Leaderboard Table
  let tableRows = '';
  departments.forEach((dept, index) => {
    const rank = index + 1;
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

    tableRows += `
      <tr>
        <td style="width: 70px;">
          <span class="rank-num ${rankClass}">${rank}</span>
        </td>
        <td>
          <div class="dept-flex">
            <span class="dept-color-bar" style="background-color: ${dept.color || 'var(--blue-primary)'}"></span>
            <div>
              <div class="dept-title-name">${dept.name}</div>
              <span class="dept-code-tag">${dept.code}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="points-pill">${dept.points}</span>
        </td>
        <td><span class="medal-tag gold"><i class="fa-solid fa-medal"></i> ${dept.gold}</span></td>
        <td><span class="medal-tag silver"><i class="fa-solid fa-medal"></i> ${dept.silver}</span></td>
        <td><span class="medal-tag bronze"><i class="fa-solid fa-medal"></i> ${dept.bronze}</span></td>
      </tr>
    `;
  });

  leaderboardTableBody.innerHTML = tableRows;
}

function renderHomepageMatches(matches) {
  const latestResultsContainer = document.getElementById('latestResultsContainer');
  const upcomingMatchesContainer = document.getElementById('upcomingMatchesContainer');

  if (!matches) return;

  // Filter completed matches (most recent first)
  const completedMatches = matches
    .filter((m) => m.status === 'Completed')
    .slice(0, 4);

  // Filter upcoming and live matches
  const upcomingMatches = matches
    .filter((m) => m.status === 'Upcoming' || m.status === 'Live')
    .slice(0, 4);

  if (latestResultsContainer) {
    if (completedMatches.length === 0) {
      latestResultsContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1"><i class="fa-solid fa-flag-checkered empty-state-icon"></i><div class="empty-state-title">No completed matches yet</div><div class="empty-state-text">Results will be displayed here as matches finish.</div></div>';
    } else {
      latestResultsContainer.innerHTML = completedMatches.map(createMatchCardHtml).join('');
    }
  }

  if (upcomingMatchesContainer) {
    if (upcomingMatches.length === 0) {
      upcomingMatchesContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1"><i class="fa-solid fa-calendar-xmark empty-state-icon"></i><div class="empty-state-title">No upcoming matches scheduled</div><div class="empty-state-text">Upcoming tournament schedules will appear shortly.</div></div>';
    } else {
      upcomingMatchesContainer.innerHTML = upcomingMatches.map(createMatchCardHtml).join('');
    }
  }
}

function createMatchCardHtml(match) {
  const statusClass = match.status === 'Live' ? 'status-live' : match.status === 'Completed' ? 'status-completed' : 'status-upcoming';
  const statusText = match.status === 'Live' ? 'LIVE NOW' : match.status === 'Completed' ? 'MATCH COMPLETED' : 'MATCH NOT STARTED';
  const sportName = (match.sport_slug || 'Sport').toUpperCase();

  const isWinnerDeclared = Boolean(match.winner && match.winner !== '');

  return `
    <div class="match-card">
      <div class="match-card-header">
        <span class="match-sport-badge">
          <i class="fa-solid fa-trophy"></i> ${sportName} &bull; ${match.stage_label || match.stage}
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
        <div class="match-result-banner ${isWinnerDeclared ? 'winner-declared' : ''}">
          <i class="fa-solid ${isWinnerDeclared ? 'fa-award' : 'fa-circle-info'}"></i> ${match.result}
        </div>
      ` : ''}

      <div class="match-meta-info">
        <span><i class="fa-regular fa-calendar"></i> ${match.match_date}</span>
        <span><i class="fa-regular fa-clock"></i> ${match.match_time}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${match.venue}</span>
      </div>
    </div>
  `;
}

function renderAnnouncements(announcements) {
  const container = document.getElementById('announcementsContainer');
  if (!container) return;

  if (!announcements || announcements.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1"><div class="empty-state-title">No new announcements.</div></div>';
    return;
  }

  container.innerHTML = announcements.map((item) => `
    <div class="announcement-card">
      ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="announcement-image" loading="lazy">` : ''}
      <div class="announcement-meta">
        <span class="announcement-category">${escapeHtml(item.category || 'General')}</span>
        <span class="announcement-date"><i class="fa-regular fa-calendar-days"></i> ${escapeHtml(item.publish_date || '')}</span>
      </div>
      <h3 class="announcement-title">${escapeHtml(item.title)}</h3>
      <p class="announcement-desc">${escapeHtml(item.description)}</p>
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}
