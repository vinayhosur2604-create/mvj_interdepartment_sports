/**
 * MVJ INTERDEPARTMENT SPORTS - MANAGE SPORTS LOGIC (admin/sports.html)
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.MVJ_AUTH) {
    window.MVJ_AUTH.requireAuth();
  }

  setupAdminSessionUI();
  await loadSportsManagementTable();
  setupAddSportModal();
  setupEditSportModal();

  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadSportsManagementTable();
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

let cachedSports = [];
let cachedMatches = [];

async function loadSportsManagementTable() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    const [sports, matches] = await Promise.all([
      db.getSports(),
      db.getMatches()
    ]);

    cachedSports = sports;
    cachedMatches = matches;

    renderSportsTable(cachedSports, cachedMatches);
  } catch (err) {
    console.error('Error loading sports table:', err);
  }
}

function renderSportsTable(sports, matches) {
  const tbody = document.getElementById('sportsTableBody');
  if (!tbody) return;

  if (!sports || sports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:24px;">No sports registered. Click "+ Add New Sport" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = sports.map((sport) => {
    const associatedMatches = matches.filter(
      (m) => m.sport_slug?.toLowerCase() === sport.slug?.toLowerCase() || m.sport_id === sport.id
    );

    const iconClass = sport.icon && sport.icon.startsWith('fa-') ? sport.icon : 'fa-trophy';

    return `
      <tr>
        <td style="width: 50px; text-align:center;">
          <div style="width:36px; height:36px; border-radius:8px; background:var(--blue-light); color:var(--blue-primary); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <i class="fa-solid ${iconClass}"></i>
          </div>
        </td>
        <td>
          <strong style="font-size:1rem; color:var(--text-main);">${sport.name}</strong>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${sport.description || 'Interdepartment tournament'}</div>
        </td>
        <td><code>${sport.slug}</code></td>
        <td>
          <span class="dept-code-tag">${sport.current_stage || 'Regular Matches'}</span>
        </td>
        <td>
          <strong style="color:var(--blue-primary); font-size:1.05rem;">${associatedMatches.length}</strong> matches
        </td>
        <td>
          <div class="admin-actions-bar">
            <button class="btn-action edit" onclick="openEditSportModal('${sport.id}')">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn-action delete" onclick="confirmDeleteSport('${sport.id}', '${sport.name.replace(/'/g, "\\'")}', ${associatedMatches.length})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupAddSportModal() {
  const modal = document.getElementById('addSportModal');
  const openBtn = document.getElementById('openAddSportModalBtn');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('addSportForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      form.reset();
      modal.classList.add('active');
    });
  }

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('addSportName').value.trim();
      const slug = document.getElementById('addSportSlug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const icon = document.getElementById('addSportIcon').value.trim() || 'fa-trophy';
      const image = document.getElementById('addSportImage').value.trim();
      const current_stage = document.getElementById('addSportStage').value;
      const description = document.getElementById('addSportDesc').value.trim();

      try {
        await window.MVJ_DB.addSport({
          name,
          slug,
          icon,
          image,
          current_stage,
          description
        });
        modal.classList.remove('active');
        showToast(`Sport "${name}" added successfully!`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function setupEditSportModal() {
  const modal = document.getElementById('editSportModal');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('editSportForm');

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editSportId').value;
      const name = document.getElementById('editSportName').value.trim();
      const slug = document.getElementById('editSportSlug').value.trim();
      const icon = document.getElementById('editSportIcon').value.trim();
      const image = document.getElementById('editSportImage').value.trim();
      const current_stage = document.getElementById('editSportStage').value;
      const description = document.getElementById('editSportDesc').value.trim();

      try {
        await window.MVJ_DB.updateSport(id, {
          name,
          slug,
          icon,
          image,
          current_stage,
          description
        });
        modal.classList.remove('active');
        showToast(`Sport "${name}" updated successfully!`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function openEditSportModal(sportId) {
  const sport = cachedSports.find((s) => s.id === sportId);
  if (!sport) return;

  document.getElementById('editSportId').value = sport.id;
  document.getElementById('editSportName').value = sport.name;
  document.getElementById('editSportSlug').value = sport.slug;
  document.getElementById('editSportIcon').value = sport.icon || 'fa-trophy';
  document.getElementById('editSportImage').value = sport.image || '';
  document.getElementById('editSportStage').value = sport.current_stage || 'Regular Matches';
  document.getElementById('editSportDesc').value = sport.description || '';

  document.getElementById('editSportModal').classList.add('active');
}
window.openEditSportModal = openEditSportModal;

async function confirmDeleteSport(sportId, sportName, matchCount) {
  if (matchCount > 0) {
    alert(`Cannot delete "${sportName}" because it currently has ${matchCount} associated matches in the database. Please delete or reassign those matches first.`);
    return;
  }

  if (confirm(`Are you sure you want to delete sport "${sportName}"?`)) {
    try {
      await window.MVJ_DB.deleteSport(sportId);
      showToast(`Sport "${sportName}" deleted.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
window.confirmDeleteSport = confirmDeleteSport;

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
