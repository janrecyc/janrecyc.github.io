/* ============================================================
   components/profile-header.js — renders the avatar/name/role
   card at the top of profile.html from data/profile.js's
   CURRENT_USER. Separate from section-list.js because this is a
   one-off layout (a header), not a row in a list.
   ============================================================ */
function renderProfileHeader(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount || typeof CURRENT_USER === 'undefined') return;

  mount.innerHTML = `
    <div class="profile-header">
      <span class="profile-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${CURRENT_USER.avatarIcon}</svg>
      </span>
      <span class="profile-info">
        <span class="profile-name">${CURRENT_USER.name}</span>
        <span class="profile-role">${CURRENT_USER.role}</span>
      </span>
    </div>`;
}
