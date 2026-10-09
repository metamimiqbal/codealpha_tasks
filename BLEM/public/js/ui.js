/**
 * BLEM UI Renderer & Component Generator
 */

const UI = {
  // Utility: Sanitize user-generated content to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Utility: Calculate human-friendly relative time
  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  },

  // Toast notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✦';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠';

    toast.innerHTML = `<span>${icon}</span> <span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  },

  // Render Top Navbar Auth Section
  renderNavbarAuth(user) {
    const container = document.getElementById('nav-auth-actions');
    if (!container) return;

    if (user) {
      const initial = (user.name || user.username || 'U')[0].toUpperCase();
      container.innerHTML = `
        <button class="btn btn-outline btn-sm user-nav-profile-btn" data-action="view-my-profile">
          <div class="avatar-circle avatar-sm">${this.escapeHtml(initial)}</div>
          <span>@${this.escapeHtml(user.username)}</span>
        </button>
        <button class="btn btn-secondary btn-sm" id="logout-btn" title="Log out">Log Out</button>
      `;
    } else {
      container.innerHTML = `
        <button class="btn btn-primary btn-sm" id="open-auth-btn">Log In / Sign Up</button>
      `;
    }
  },

  // Render Left Sidebar Identity Card
  renderSidebarUserCard(user) {
    const card = document.getElementById('user-sidebar-card');
    const profileNavItem = document.getElementById('nav-btn-profile');
    const postComposer = document.getElementById('post-composer');
    const sidebarPostBtn = document.getElementById('sidebar-post-trigger');

    if (!card) return;

    if (user) {
      if (profileNavItem) profileNavItem.style.display = 'flex';
      if (postComposer) postComposer.style.display = 'flex';
      if (sidebarPostBtn) sidebarPostBtn.style.display = 'flex';

      const initial = (user.name || user.username || 'U')[0].toUpperCase();
      const composerAvatar = document.getElementById('composer-user-avatar');
      if (composerAvatar) composerAvatar.textContent = initial;

      card.innerHTML = `
        <div class="sidebar-user-row" data-action="view-my-profile">
          <div class="avatar-circle">${this.escapeHtml(initial)}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${this.escapeHtml(user.name)}</div>
            <div class="sidebar-user-handle">@${this.escapeHtml(user.username)}</div>
          </div>
        </div>
        <div class="sidebar-user-stats">
          <div class="stat-metric">
            <span class="stat-number">${user.followingCount || 0}</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat-metric">
            <span class="stat-number">${user.followersCount || 0}</span>
            <span class="stat-label">Followers</span>
          </div>
        </div>
      `;
    } else {
      if (profileNavItem) profileNavItem.style.display = 'none';
      if (postComposer) postComposer.style.display = 'none';
      if (sidebarPostBtn) sidebarPostBtn.style.display = 'none';

      card.innerHTML = `
        <div style="text-align: center; padding: 0.5rem 0;">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.4rem;">Join BLEM</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.85rem;">
            Sign up to like, comment, and follow creators across the platform.
          </p>
          <button class="btn btn-primary btn-sm btn-block" id="sidebar-auth-btn">Get Started</button>
        </div>
      `;
    }
  },

  // Render Post Card HTML
  renderPostCard(post, currentUser) {
    const author = post.author || {};
    const authorName = author.name || author.username || 'Anonymous';
    const authorUsername = author.username || 'unknown';
    const initial = authorName[0].toUpperCase();
    const timeAgo = this.formatTimeAgo(post.createdAt);
    const isLiked = !!post.hasLiked;
    const isOwner = currentUser && (String(currentUser._id) === String(author._id || author));

    return `
      <article class="post-card" id="post-${post._id}" data-post-id="${post._id}">
        <header class="post-header">
          <div class="post-author-link" data-username="${this.escapeHtml(authorUsername)}">
            <div class="avatar-circle">${this.escapeHtml(initial)}</div>
            <div class="post-author-details">
              <span class="post-author-name">${this.escapeHtml(authorName)}</span>
              <span class="post-author-meta">
                <span>@${this.escapeHtml(authorUsername)}</span> • <span>${timeAgo}</span>
              </span>
            </div>
          </div>
          ${
            isOwner
              ? `<button class="action-btn delete-btn" data-action="delete-post" data-post-id="${post._id}" title="Delete post" aria-label="Delete post">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>`
              : ''
          }
        </header>

        <div class="post-content">${this.escapeHtml(post.content)}</div>

        <footer class="post-actions">
          <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-action="toggle-like" data-post-id="${post._id}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="likes-count">${post.likesCount || 0}</span>
          </button>

          <button class="action-btn comment-btn" data-action="toggle-comments" data-post-id="${post._id}">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span class="comments-count">${post.commentsCount || 0}</span>
          </button>
        </footer>

        <!-- Expandable Comments Tray -->
        <section class="comments-section" id="comments-section-${post._id}" style="display:none;">
          <div class="comment-input-row">
            <input type="text" placeholder="Write a comment..." maxlength="300" class="comment-input" data-post-id="${post._id}">
            <button class="btn btn-primary btn-sm" data-action="submit-comment" data-post-id="${post._id}">Send</button>
          </div>
          <div class="comment-list" id="comment-list-${post._id}">
            <div style="font-size: 0.8rem; color: var(--text-faint); padding: 0.5rem 0;">Loading comments...</div>
          </div>
        </section>
      </article>
    `;
  },

  // Render list of comments inside a post
  renderCommentsList(container, comments, currentUser) {
    if (!comments || comments.length === 0) {
      container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-faint); padding: 0.4rem 0;">No comments yet. Start the conversation!</div>`;
      return;
    }

    container.innerHTML = comments
      .map((c) => {
        const author = c.author || {};
        const authorName = author.name || author.username || 'Anonymous';
        const initial = authorName[0].toUpperCase();
        const timeAgo = this.formatTimeAgo(c.createdAt);
        const isOwner = currentUser && (String(currentUser._id) === String(author._id || author));

        return `
          <div class="comment-item" id="comment-${c._id}">
            <div class="avatar-circle avatar-sm">${this.escapeHtml(initial)}</div>
            <div class="comment-content-col">
              <div class="comment-author-row">
                <span class="comment-author-name">${this.escapeHtml(authorName)}</span>
                <span class="comment-time">${timeAgo}</span>
              </div>
              <p class="comment-text">${this.escapeHtml(c.content)}</p>
            </div>
            ${
              isOwner
                ? `<button class="comment-delete-btn" data-action="delete-comment" data-comment-id="${c._id}" data-post-id="${c.post}" title="Delete comment">✕</button>`
                : ''
            }
          </div>
        `;
      })
      .join('');
  },

  // Render User Profile Hero View
  renderProfileHero(profile, currentUser) {
    const container = document.getElementById('profile-view-container');
    if (!container) return;

    const initial = (profile.name || profile.username || 'U')[0].toUpperCase();
    const isSelf = currentUser && String(currentUser._id) === String(profile._id);
    const isFollowing = !!profile.isFollowing;

    let actionButton = '';
    if (isSelf) {
      actionButton = `<button class="btn btn-secondary btn-sm" id="edit-profile-open-btn">Edit Profile</button>`;
    } else if (currentUser) {
      actionButton = `
        <button class="btn btn-sm ${isFollowing ? 'btn-following' : 'btn-follow'}" 
                id="profile-follow-toggle-btn" 
                data-user-id="${profile._id}" 
                data-following="${isFollowing}">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    }

    container.innerHTML = `
      <div class="profile-banner-bg"></div>
      <div class="profile-header-content">
        <div class="profile-avatar-row">
          <div class="profile-large-avatar">${this.escapeHtml(initial)}</div>
          <div class="profile-actions-wrapper">${actionButton}</div>
        </div>

        <div class="profile-info">
          <h2 class="profile-display-name">${this.escapeHtml(profile.name)}</h2>
          <span class="profile-handle">@${this.escapeHtml(profile.username)}</span>
          ${profile.bio ? `<p class="profile-bio">${this.escapeHtml(profile.bio)}</p>` : ''}
          <div class="profile-meta-row">
            <span>Joined ${new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div class="profile-stats-row">
          <div class="profile-stat-item">
            <strong>${profile.postsCount || 0}</strong>
            <span>Posts</span>
          </div>
          <div class="profile-stat-item">
            <strong>${profile.followingCount || 0}</strong>
            <span>Following</span>
          </div>
          <div class="profile-stat-item">
            <strong id="profile-followers-count">${profile.followersCount || 0}</strong>
            <span>Followers</span>
          </div>
        </div>
      </div>
    `;
    container.style.display = 'block';
  },

  // Render Suggested Users Widget
  renderSuggestedUsers(users, currentUser) {
    const container = document.getElementById('suggested-users-list');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-faint);">No suggestions found right now.</div>`;
      return;
    }

    container.innerHTML = users
      .map((u) => {
        const initial = (u.name || u.username || 'U')[0].toUpperCase();
        const isFollowing = !!u.isFollowing;
        return `
          <div class="suggested-user-item">
            <div class="suggested-user-info" data-username="${this.escapeHtml(u.username)}">
              <div class="avatar-circle avatar-sm">${this.escapeHtml(initial)}</div>
              <div class="suggested-user-names">
                <div class="suggested-name">${this.escapeHtml(u.name)}</div>
                <div class="suggested-handle">@${this.escapeHtml(u.username)}</div>
              </div>
            </div>
            ${
              currentUser && String(currentUser._id) !== String(u._id)
                ? `<button class="btn ${isFollowing ? 'btn-following' : 'btn-follow'}" 
                           data-action="toggle-follow-user" 
                           data-user-id="${u._id}" 
                           data-following="${isFollowing}">
                    ${isFollowing ? 'Following' : 'Follow'}
                  </button>`
                : ''
            }
          </div>
        `;
      })
      .join('');
  },

  // Render Search Dropdown Results
  renderSearchResults(users) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (!users || users.length === 0) {
      dropdown.innerHTML = `<div style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted); text-align: center;">No creators found</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = users
      .map((u) => {
        const initial = (u.name || u.username || 'U')[0].toUpperCase();
        return `
          <div class="search-item" data-username="${this.escapeHtml(u.username)}">
            <div class="avatar-circle avatar-sm">${this.escapeHtml(initial)}</div>
            <div>
              <div style="font-size: 0.88rem; font-weight: 700;">${this.escapeHtml(u.name)}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">@${this.escapeHtml(u.username)}</div>
            </div>
          </div>
        `;
      })
      .join('');
    dropdown.style.display = 'block';
  }
};

window.UI = UI;
