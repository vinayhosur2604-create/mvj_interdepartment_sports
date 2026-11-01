/**
 * MVJ INTERDEPARTMENT SPORTS - MANAGE DEPARTMENTS & SCORES (departments.html)
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.MVJ_AUTH) {
    window.MVJ_AUTH.requireAuth();
  }

  // Setup Admin UI & Sidebar
  setupAdminSessionUI();

  // Load Department Data
  await loadDepartmentsTable();

  // Setup Add Department Modal
  setupAddDepartmentModal();

  // Setup Edit Department Modal
  setupEditDepartmentModal();

  // Real-time synchronization
  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadDepartmentsTable();
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

let cachedDepartments = [];

async function loadDepartmentsTable() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    cachedDepartments = await db.getDepartments();
    renderDepartmentManagementTable(cachedDepartments);
    renderQuickScoresTable(cachedDepartments);
  } catch (err) {
    console.error('Error loading departments table:', err);
  }
}

function renderDepartmentManagementTable(departments) {
  const tbody = document.getElementById('departmentsTableBody');
  if (!tbody) return;

  if (!departments || departments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:24px;">No departments found. Click "+ Add Department" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = departments.map((dept, index) => {
    const rank = index + 1;
    return `
      <tr>
        <td style="width: 50px; font-weight:800; font-family:var(--font-heading);">${rank}</td>
        <td>
          <div class="dept-flex">
            <span class="dept-color-bar" style="background-color: ${dept.color || '#174EA6'}"></span>
            <div>
              <div style="font-weight:700;">${dept.name}</div>
              <span class="dept-code-tag">${dept.code}</span>
            </div>
          </div>
        </td>
        <td><strong style="font-size:1.1rem; color:var(--blue-primary);">${dept.points}</strong></td>
        <td>🥇 ${dept.gold}</td>
        <td>🥈 ${dept.silver}</td>
        <td>🥉 ${dept.bronze}</td>
        <td>
          <div class="admin-actions-bar">
            <button class="btn-action edit" onclick="openEditModal('${dept.id}')">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn-action delete" onclick="confirmDeleteDepartment('${dept.id}', '${dept.name.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Section 11: Quick Score Update Table
function renderQuickScoresTable(departments) {
  const tbody = document.getElementById('quickScoresTableBody');
  if (!tbody) return;

  tbody.innerHTML = departments.map((dept) => {
    return `
      <tr data-dept-id="${dept.id}">
        <td>
          <strong style="color:var(--text-main); font-size:1rem;">${dept.code}</strong>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${dept.name}</div>
        </td>
        <td>
          <input type="number" class="score-inline-input dept-input-points" value="${dept.points}" min="0">
        </td>
        <td>
          <input type="number" class="score-inline-input dept-input-gold" value="${dept.gold}" min="0">
        </td>
        <td>
          <input type="number" class="score-inline-input dept-input-silver" value="${dept.silver}" min="0">
        </td>
        <td>
          <input type="number" class="score-inline-input dept-input-bronze" value="${dept.bronze}" min="0">
        </td>
        <td>
          <button class="btn-action edit" onclick="saveQuickScore('${dept.id}', this)">
            <i class="fa-solid fa-floppy-disk"></i> Save
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function saveQuickScore(deptId, buttonEl) {
  const row = buttonEl.closest('tr');
  if (!row) return;

  const points = parseInt(row.querySelector('.dept-input-points').value, 10) || 0;
  const gold = parseInt(row.querySelector('.dept-input-gold').value, 10) || 0;
  const silver = parseInt(row.querySelector('.dept-input-silver').value, 10) || 0;
  const bronze = parseInt(row.querySelector('.dept-input-bronze').value, 10) || 0;

  try {
    buttonEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving';
    buttonEl.disabled = true;

    await window.MVJ_DB.updateDepartment(deptId, {
      points,
      gold,
      silver,
      bronze
    });

    showToast('Department scores updated successfully!', 'success');
  } catch (err) {
    showToast('Failed to update score: ' + err.message, 'error');
  } finally {
    buttonEl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save';
    buttonEl.disabled = false;
  }
}
window.saveQuickScore = saveQuickScore;

function setupAddDepartmentModal() {
  const modal = document.getElementById('addDeptModal');
  const openBtn = document.getElementById('openAddDeptModalBtn');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('addDeptForm');

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
      const name = document.getElementById('addDeptName').value.trim();
      const code = document.getElementById('addDeptCode').value.trim().toUpperCase();
      const points = parseInt(document.getElementById('addDeptPoints').value, 10) || 0;
      const gold = parseInt(document.getElementById('addDeptGold').value, 10) || 0;
      const silver = parseInt(document.getElementById('addDeptSilver').value, 10) || 0;
      const bronze = parseInt(document.getElementById('addDeptBronze').value, 10) || 0;
      const color = document.getElementById('addDeptColor').value;

      try {
        await window.MVJ_DB.addDepartment({
          name,
          code,
          points,
          gold,
          silver,
          bronze,
          color
        });
        modal.classList.remove('active');
        showToast(`Department "${code}" added successfully!`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function setupEditDepartmentModal() {
  const modal = document.getElementById('editDeptModal');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('editDeptForm');

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editDeptId').value;
      const name = document.getElementById('editDeptName').value.trim();
      const code = document.getElementById('editDeptCode').value.trim().toUpperCase();
      const points = parseInt(document.getElementById('editDeptPoints').value, 10) || 0;
      const gold = parseInt(document.getElementById('editDeptGold').value, 10) || 0;
      const silver = parseInt(document.getElementById('editDeptSilver').value, 10) || 0;
      const bronze = parseInt(document.getElementById('editDeptBronze').value, 10) || 0;
      const color = document.getElementById('editDeptColor').value;

      try {
        await window.MVJ_DB.updateDepartment(id, {
          name,
          code,
          points,
          gold,
          silver,
          bronze,
          color
        });
        modal.classList.remove('active');
        showToast(`Department "${code}" updated successfully!`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function openEditModal(deptId) {
  const dept = cachedDepartments.find((d) => d.id === deptId);
  if (!dept) return;

  document.getElementById('editDeptId').value = dept.id;
  document.getElementById('editDeptName').value = dept.name;
  document.getElementById('editDeptCode').value = dept.code;
  document.getElementById('editDeptPoints').value = dept.points;
  document.getElementById('editDeptGold').value = dept.gold;
  document.getElementById('editDeptSilver').value = dept.silver;
  document.getElementById('editDeptBronze').value = dept.bronze;
  document.getElementById('editDeptColor').value = dept.color || '#174EA6';

  document.getElementById('editDeptModal').classList.add('active');
}
window.openEditModal = openEditModal;

async function confirmDeleteDepartment(deptId, deptName) {
  if (confirm(`Are you sure you want to delete department "${deptName}"? This action cannot be undone.`)) {
    try {
      await window.MVJ_DB.deleteDepartment(deptId);
      showToast(`Department "${deptName}" deleted.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
window.confirmDeleteDepartment = confirmDeleteDepartment;

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}
window.showToast = showToast;

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toastContainer';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}
