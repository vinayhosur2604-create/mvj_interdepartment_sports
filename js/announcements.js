/**
 * MVJ INTERDEPARTMENT SPORTS - TOURNAMENT ANNOUNCEMENTS & SETTINGS (admin/settings.html)
 * MVJ College of Engineering
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.MVJ_AUTH) {
    window.MVJ_AUTH.requireAuth();
  }

  setupAdminSessionUI();
  await loadAnnouncementsTable();
  await loadTournamentSettings();
  setupAddAnnouncementModal();
  setupSettingsForm();

  if (window.MVJ_DB) {
    window.MVJ_DB.subscribe(() => {
      loadAnnouncementsTable();
      loadTournamentSettings();
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

let cachedAnnouncements = [];

async function loadAnnouncementsTable() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    cachedAnnouncements = await db.getAnnouncements(false); // get all including unpublished
    renderAnnouncementsTable(cachedAnnouncements);
  } catch (err) {
    console.error('Error loading announcements:', err);
  }
}

function renderAnnouncementsTable(list) {
  const tbody = document.getElementById('announcementsTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:24px;">No announcements posted. Click "+ Add Announcement" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((a) => {
    return `
      <tr>
        <td>
          ${a.image_url ? `<img src="${escapeHtml(a.image_url)}" alt="" style="width:72px;height:48px;object-fit:cover;border-radius:6px;margin-bottom:8px;">` : ''}
          <strong style="color:var(--text-main); font-size:0.98rem;">${escapeHtml(a.title)}</strong>
          <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin-top:4px;">${escapeHtml(a.description)}</div>
        </td>
        <td>
          <span class="announcement-category">${escapeHtml(a.category || 'General')}</span>
        </td>
        <td>${escapeHtml(a.publish_date || '')}</td>
        <td>
          <span class="match-status-badge ${a.is_published ? 'status-completed' : 'status-upcoming'}">
            ${a.is_published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>
          <div class="admin-actions-bar">
            <button class="btn-action edit" onclick="togglePublishAnnouncement('${a.id}', ${!a.is_published})">
              <i class="fa-solid ${a.is_published ? 'fa-eye-slash' : 'fa-eye'}"></i> ${a.is_published ? 'Unpublish' : 'Publish'}
            </button>
            <button class="btn-action delete" onclick="confirmDeleteAnnouncement('${a.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupAddAnnouncementModal() {
  const modal = document.getElementById('addAnnouncementModal');
  const openBtn = document.getElementById('openAddAnnouncementModalBtn');
  const closeBtns = modal?.querySelectorAll('.modal-close-trigger');
  const form = document.getElementById('addAnnouncementForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('addAnnDate').value = new Date().toISOString().split('T')[0];
      clearPhotoPreview();
      modal.classList.add('active');
    });
  }

  closeBtns?.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.classList.remove('active');
      clearPhotoPreview();
    });
  });

  const photoInput = document.getElementById('addAnnPhoto');
  const photoPreview = document.getElementById('announcementPhotoPreview');
  const clearPhotoPreview = () => {
    if (photoPreview.src.startsWith('blob:')) URL.revokeObjectURL(photoPreview.src);
    photoPreview.hidden = true;
    photoPreview.removeAttribute('src');
  };

  photoInput?.addEventListener('change', () => {
    clearPhotoPreview();
    if (photoInput.files?.[0]) {
      photoPreview.src = URL.createObjectURL(photoInput.files[0]);
      photoPreview.hidden = false;
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('addAnnTitle').value.trim();
      const category = document.getElementById('addAnnCategory').value;
      const publish_date = document.getElementById('addAnnDate').value;
      const description = document.getElementById('addAnnDesc').value.trim();
      const is_published = document.getElementById('addAnnPublished').checked;
      const photo = photoInput?.files?.[0];
      const submitButton = form.querySelector('button[type="submit"]');
      let uploadedPhoto = null;

      try {
        submitButton.disabled = true;
        uploadedPhoto = photo
          ? await window.MVJ_DB.uploadAnnouncementPhoto(photo)
          : {};
        await window.MVJ_DB.addAnnouncement({
          title,
          category,
          publish_date,
          description,
          is_published,
          ...uploadedPhoto
        });

        uploadedPhoto = null;
        modal.classList.remove('active');
        form.reset();
        clearPhotoPreview();
        showToast('Announcement saved.', 'success');
      } catch (err) {
        if (uploadedPhoto?.image_path) {
          try {
            await window.MVJ_DB.removeAnnouncementPhoto(uploadedPhoto.image_path);
          } catch (cleanupError) {
            console.error('Failed to clean up an unused announcement photo:', cleanupError);
          }
        }
        showToast(err.message, 'error');
      } finally {
        submitButton.disabled = false;
      }
    });
  }
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

async function togglePublishAnnouncement(id, newStatus) {
  try {
    await window.MVJ_DB.updateAnnouncement(id, { is_published: newStatus });
    showToast(`Announcement ${newStatus ? 'published' : 'unpublished'}.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.togglePublishAnnouncement = togglePublishAnnouncement;

async function confirmDeleteAnnouncement(id) {
  if (confirm('Are you sure you want to delete this announcement?')) {
    try {
      await window.MVJ_DB.deleteAnnouncement(id);
      showToast('Announcement deleted.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}
window.confirmDeleteAnnouncement = confirmDeleteAnnouncement;

async function loadTournamentSettings() {
  const db = window.MVJ_DB;
  if (!db) return;

  try {
    const settings = await db.getSettings();
    if (settings) {
      document.getElementById('settingTournamentName').value = settings.tournament_name || '';
      document.getElementById('settingAcademicYear').value = settings.academic_year || '2026-2027';
      document.getElementById('settingTournamentStatus').value = settings.tournament_status || 'Ongoing';
      document.getElementById('settingHomepageTagline').value = settings.homepage_tagline || '';
      document.getElementById('settingHomepageSubtitle').value = settings.homepage_subtitle || '';
      document.getElementById('settingLogoRef').value = settings.logo_path || 'assets/images/mvj-logo.png';

      document.getElementById('settingSupabaseUrl').value = localStorage.getItem('MVJ_SUPABASE_URL') || '';
      document.getElementById('settingSupabaseKey').value = localStorage.getItem('MVJ_SUPABASE_ANON_KEY') || '';
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

function setupSettingsForm() {
  const form = document.getElementById('tournamentSettingsForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tournament_name = document.getElementById('settingTournamentName').value.trim();
    const academic_year = document.getElementById('settingAcademicYear').value.trim();
    const tournament_status = document.getElementById('settingTournamentStatus').value;
    const homepage_tagline = document.getElementById('settingHomepageTagline').value.trim();
    const homepage_subtitle = document.getElementById('settingHomepageSubtitle').value.trim();
    const logo_path = document.getElementById('settingLogoRef').value.trim();
    const supabaseUrl = document.getElementById('settingSupabaseUrl').value.trim();
    const supabaseKey = document.getElementById('settingSupabaseKey').value.trim();

    if (supabaseUrl) localStorage.setItem('MVJ_SUPABASE_URL', supabaseUrl);
    if (supabaseKey) localStorage.setItem('MVJ_SUPABASE_ANON_KEY', supabaseKey);
    if (supabaseUrl || supabaseKey) {
      window.MVJ_DB.initSupabaseClient();
    }

    try {
      await window.MVJ_DB.updateSettings({
        tournament_name,
        academic_year,
        tournament_status,
        homepage_tagline,
        homepage_subtitle,
        logo_path
      });

      showToast('Tournament settings saved successfully!', 'success');
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  });
}

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
