/**
 * MVJ INTERDEPARTMENT SPORTS - SPORTS LISTING LOGIC (sports.html)
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

  await loadSportsCatalog();

  // Search filter
  const searchInput = document.getElementById('sportSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      filterSports(term);
    });
  }

  // Real-time synchronization
  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadSportsCatalog();
    });
  }
});

let allSportsData = [];
let allMatchesData = [];

async function loadSportsCatalog() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    const [sports, matches] = await Promise.all([
      db.getSports(),
      db.getMatches()
    ]);

    allSportsData = sports;
    allMatchesData = matches;

    renderSportsList(allSportsData, allMatchesData);
  } catch (err) {
    console.error('Error loading sports catalog:', err);
  }
}

function renderSportsList(sports, matches) {
  const container = document.getElementById('sportsGridContainer');
  if (!container) return;

  if (!sports || sports.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <i class="fa-solid fa-trophy empty-state-icon"></i>
        <div class="empty-state-title">Sports will be announced soon.</div>
        <div class="empty-state-text">Check back shortly for official tournament event schedules.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = sports.map((sport) => {
    // Calculate sport match statistics
    const sportMatches = matches.filter(
      (m) => m.sport_slug?.toLowerCase() === sport.slug?.toLowerCase() || m.sport_id === sport.id
    );

    const totalMatches = sportMatches.length;
    const completedMatches = sportMatches.filter((m) => m.status === 'Completed').length;
    const upcomingMatches = sportMatches.filter((m) => m.status === 'Upcoming' || m.status === 'Live').length;

    const iconClass = sport.icon && sport.icon.startsWith('fa-') ? sport.icon : 'fa-trophy';
    const fallbackImg = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80';
    const imageSrc = sport.image || fallbackImg;

    return `
      <div class="sport-card" data-sport-name="${sport.name.toLowerCase()}">
        <div class="sport-card-img-wrap">
          <img src="${imageSrc}" alt="${sport.name}" class="sport-card-img" onerror="this.src='${fallbackImg}'">
          <span class="sport-card-stage-pill">${sport.current_stage || 'Tournament'}</span>
          <div class="sport-icon-float">
            <i class="fa-solid ${iconClass}"></i>
          </div>
        </div>

        <div class="sport-card-body">
          <div class="sport-title-row">
            <h3 class="sport-card-name">${sport.name}</h3>
          </div>
          <p class="sport-card-desc">${sport.description || 'Interdepartment championship tournament at MVJCE.'}</p>

          <div class="sport-metrics-row">
            <div class="sport-metric">
              <span class="metric-val">${totalMatches}</span>
              <span class="metric-label">Matches</span>
            </div>
            <div class="sport-metric">
              <span class="metric-val" style="color:var(--success)">${completedMatches}</span>
              <span class="metric-label">Finished</span>
            </div>
            <div class="sport-metric">
              <span class="metric-val" style="color:var(--blue-primary)">${upcomingMatches}</span>
              <span class="metric-label">Upcoming</span>
            </div>
          </div>

          <a href="fixtures.html?sport=${encodeURIComponent(sport.slug)}" class="btn-view-fixtures">
            <span>View Fixtures</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function filterSports(term) {
  const cards = document.querySelectorAll('.sport-card');
  let visibleCount = 0;

  cards.forEach((card) => {
    const name = card.getAttribute('data-sport-name') || '';
    if (name.includes(term)) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const emptyMsg = document.getElementById('searchEmptyMsg');
  if (emptyMsg) {
    emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}
