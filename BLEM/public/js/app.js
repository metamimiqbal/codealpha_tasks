/**
 * BLEM Application Main Controller
 * Event handling, routing, state synchronization, and user flows
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements cache
  const authDialog = document.getElementById('auth-dialog');
  const editProfileDialog = document.getElementById('edit-profile-dialog');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authModalTitle = document.getElementById('auth-modal-title');
  const tabLoginBtn = document.getElementById('auth-tab-login');
  const tabRegisterBtn = document.getElementById('auth-tab-register');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const registerErrorMsg = document.getElementById('register-error-msg');

  const tabHomeFeed = document.getElementById('tab-home-feed');
  const tabExploreFeed = document.getElementById('tab-explore-feed');
  const refreshFeedBtn = document.getElementById('refresh-feed-btn');
  const composerTextarea = document.getElementById('composer-textarea');
  const charCounter = document.getElementById('char-counter');
  const publishPostBtn = document.getElementById('publish-post-btn');
  const postsStream = document.getElementById('posts-stream');
  const streamLoader = document.getElementById('stream-loader');
  const profileHeroContainer = document.getElementById('profile-view-container');
  const feedHeaderBar = document.getElementById('feed-header-bar');
  const postComposer = document.getElementById('post-composer');

  const navHomeBtn = document.getElementById('nav-btn-home');
  const navExploreBtn = document.getElementById('nav-btn-explore');
  const navProfileBtn = document.getElementById('nav-btn-profile');
  const brandHomeLink = document.getElementById('brand-home-link');

  const globalSearchInput = document.getElementById('global-search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const searchResultsDropdown = document.getElementById('search-results-dropdown');

  // =========================================================================
  // State Subscribers
  // =========================================================================
  State.on('userChanged', (user) => {
    UI.renderNavbarAuth(user);
    UI.renderSidebarUserCard(user);
    loadSuggestedUsers();
  });

  State.on('feedTypeChanged', (type) => {
    if (tabHomeFeed && tabExploreFeed) {
      if (type === 'home') {
        tabHomeFeed.classList.add('active');
        tabExploreFeed.classList.remove('active');
        if (navHomeBtn) navHomeBtn.classList.add('active');
        if (navExploreBtn) navExploreBtn.classList.remove('active');
      } else {
        tabHomeFeed.classList.remove('active');
        tabExploreFeed.classList.add('active');
        if (navHomeBtn) navHomeBtn.classList.remove('active');
        if (navExploreBtn) navExploreBtn.classList.add('active');
      }
    }
  });

  State.on('postsUpdated', (posts) => {
    renderPostsStream(posts);
  });

  State.on('postUpdated', ({ postId, updates }) => {
    const postEl = document.getElementById(`post-${postId}`);
    if (!postEl) return;
    if (updates.likesCount !== undefined) {
      const countEl = postEl.querySelector('.likes-count');
      if (countEl) countEl.textContent = updates.likesCount;
    }
    if (updates.hasLiked !== undefined) {
      const likeBtn = postEl.querySelector('.like-btn');
      if (likeBtn) likeBtn.classList.toggle('liked', updates.hasLiked);
    }
    if (updates.commentsCount !== undefined) {
      const countEl = postEl.querySelector('.comments-count');
      if (countEl) countEl.textContent = updates.commentsCount;
    }
  });

  // =========================================================================
  // App Initialization
  // =========================================================================
  async function init() {
    setupEventListeners();

    // Check existing auth token
    const token = API.getToken();
    if (token) {
      try {
        const response = await API.auth.getMe();
        if (response.success && response.data?.user) {
          State.setCurrentUser(response.data.user);
        } else {
          API.setToken(null);
          State.setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        API.setToken(null);
        State.setCurrentUser(null);
      }
    } else {
      State.setCurrentUser(null);
    }

    // Default to home feed if logged in, or explore if guest
    const initialFeed = State.currentUser ? 'home' : 'explore';
    State.setFeedType(initialFeed);
    loadFeed(initialFeed);
    loadSuggestedUsers();
  }

  // =========================================================================
  // Feed & Post Loading
  // =========================================================================
  async function loadFeed(type = State.activeFeedType) {
    showLoader(true);
    try {
      // Clear profile view if currently active
      if (profileHeroContainer) profileHeroContainer.style.display = 'none';
      if (feedHeaderBar) feedHeaderBar.style.display = 'flex';
      if (postComposer && State.currentUser) postComposer.style.display = 'flex';

      const response = await API.posts.getFeed(type);
      if (response.success && response.data) {
        State.setPosts(response.data.posts || []);
        if (response.data.feedType === 'explore_fallback' && type === 'home') {
          UI.showToast('Showing global explore posts to get you started!', 'info');
        }
      }
    } catch (err) {
      UI.showToast(err.message || 'Failed to load feed', 'error');
    } finally {
      showLoader(false);
    }
  }

  function renderPostsStream(posts) {
    if (!postsStream) return;

    if (!posts || posts.length === 0) {
      postsStream.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✦</div>
          <h3>Quiet stream for now</h3>
          <p>Be the first to share your thoughts, or follow other creators to see their updates right here.</p>
        </div>
      `;
      return;
    }

    postsStream.innerHTML = posts.map((p) => UI.renderPostCard(p, State.currentUser)).join('');
  }

  function showLoader(visible) {
    if (streamLoader) {
      streamLoader.style.display = visible ? 'flex' : 'none';
    }
  }

  // =========================================================================
  // Profile View
  // =========================================================================
  async function loadUserProfile(username) {
    showLoader(true);
    try {
      const response = await API.users.getProfile(username);
      if (response.success && response.data) {
        const profile = response.data;
        State.setView('profile', { username: profile.username });

        if (feedHeaderBar) feedHeaderBar.style.display = 'none';
        if (postComposer) postComposer.style.display = 'none';

        UI.renderProfileHero(profile, State.currentUser);

        // Fetch user's timeline posts
        const postsRes = await API.posts.getByUser(profile._id);
        if (postsRes.success) {
          State.setPosts(postsRes.data || []);
        }
      }
    } catch (err) {
      UI.showToast(err.message || 'Could not load profile', 'error');
    } finally {
      showLoader(false);
    }
  }

  // =========================================================================
  // Suggested Users
  // =========================================================================
  async function loadSuggestedUsers() {
    try {
      const res = await API.users.search('');
      if (res.success && res.data) {
        // Exclude current user from suggestions
        const filtered = State.currentUser
          ? res.data.filter((u) => String(u._id) !== String(State.currentUser._id)).slice(0, 5)
          : res.data.slice(0, 5);
        UI.renderSuggestedUsers(filtered, State.currentUser);
      }
    } catch (err) {
      console.warn('Could not load suggestions:', err.message);
    }
  }

  // =========================================================================
  // Event Listeners Setup
  // =========================================================================
  function setupEventListeners() {
    // Navigation tab clicks
    tabHomeFeed?.addEventListener('click', () => {
      State.setFeedType('home');
      loadFeed('home');
    });

    tabExploreFeed?.addEventListener('click', () => {
      State.setFeedType('explore');
      loadFeed('explore');
    });

    refreshFeedBtn?.addEventListener('click', () => {
      if (State.currentView === 'profile' && State.activeProfileUsername) {
        loadUserProfile(State.activeProfileUsername);
      } else {
        loadFeed();
      }
    });

    navHomeBtn?.addEventListener('click', () => {
      State.setView('feed');
      State.setFeedType('home');
      loadFeed('home');
    });

    navExploreBtn?.addEventListener('click', () => {
      State.setView('feed');
      State.setFeedType('explore');
      loadFeed('explore');
    });

    navProfileBtn?.addEventListener('click', () => {
      if (State.currentUser) {
        loadUserProfile(State.currentUser.username);
      }
    });

    brandHomeLink?.addEventListener('click', (e) => {
      e.preventDefault();
      State.setView('feed');
      loadFeed(State.currentUser ? 'home' : 'explore');
    });

    // Character counter for post composer
    composerTextarea?.addEventListener('input', () => {
      const remaining = 500 - composerTextarea.value.length;
      charCounter.textContent = remaining;
      charCounter.className = 'char-count';
      if (remaining <= 50) charCounter.classList.add('warning');
      if (remaining <= 0) charCounter.classList.add('danger');
    });

    // Publish post
    publishPostBtn?.addEventListener('click', async () => {
      const content = composerTextarea.value.trim();
      if (!content) {
        UI.showToast('Please type something to post', 'error');
        return;
      }

      publishPostBtn.disabled = true;
      try {
        const response = await API.posts.create({ content });
        if (response.success && response.data?.post) {
          State.addPost(response.data.post);
          composerTextarea.value = '';
          charCounter.textContent = '500';
          charCounter.className = 'char-count';
          UI.showToast('Your BLEM post has been published!', 'success');
        }
      } catch (err) {
        UI.showToast(err.message || 'Failed to publish post', 'error');
      } finally {
        publishPostBtn.disabled = false;
      }
    });

    // Global Post & Comment Interactions delegation
    postsStream?.addEventListener('click', async (e) => {
      const target = e.target;

      // Click on author profile
      const authorLink = target.closest('.post-author-link');
      if (authorLink) {
        const username = authorLink.dataset.username;
        if (username) loadUserProfile(username);
        return;
      }

      // Like / Unlike Toggle
      const likeBtn = target.closest('[data-action="toggle-like"]');
      if (likeBtn) {
        if (!State.currentUser) {
          openAuthModal('login');
          return;
        }

        const postId = likeBtn.dataset.postId;
        try {
          const res = await API.posts.toggleLike(postId);
          if (res.success && res.data) {
            State.updatePost(postId, {
              hasLiked: res.data.liked,
              likesCount: res.data.likesCount
            });
          }
        } catch (err) {
          UI.showToast(err.message || 'Error toggling like', 'error');
        }
        return;
      }

      // Toggle Comments Tray
      const commentBtn = target.closest('[data-action="toggle-comments"]');
      if (commentBtn) {
        const postId = commentBtn.dataset.postId;
        const section = document.getElementById(`comments-section-${postId}`);
        if (!section) return;

        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'flex' : 'none';

        if (isHidden) {
          // Load comments
          const listContainer = document.getElementById(`comment-list-${postId}`);
          try {
            const res = await API.comments.getByPost(postId);
            if (res.success) {
              UI.renderCommentsList(listContainer, res.data || [], State.currentUser);
            }
          } catch (err) {
            listContainer.innerHTML = `<div style="color:var(--accent-rose);font-size:0.8rem;">Error loading comments</div>`;
          }
        }
        return;
      }

      // Submit Comment
      const submitCommentBtn = target.closest('[data-action="submit-comment"]');
      if (submitCommentBtn) {
        if (!State.currentUser) {
          openAuthModal('login');
          return;
        }

        const postId = submitCommentBtn.dataset.postId;
        const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        const content = input ? input.value.trim() : '';

        if (!content) return;

        submitCommentBtn.disabled = true;
        try {
          const res = await API.comments.create(postId, { content });
          if (res.success && res.data?.comment) {
            input.value = '';
            // Refresh comments list
            const listContainer = document.getElementById(`comment-list-${postId}`);
            const commentsRes = await API.comments.getByPost(postId);
            if (commentsRes.success) {
              UI.renderCommentsList(listContainer, commentsRes.data || [], State.currentUser);
            }

            // Update comments count in post
            const currentPost = State.posts.find((p) => p._id === postId);
            if (currentPost) {
              State.updatePost(postId, { commentsCount: (currentPost.commentsCount || 0) + 1 });
            }
            UI.showToast('Comment added!', 'success');
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to post comment', 'error');
        } finally {
          submitCommentBtn.disabled = false;
        }
        return;
      }

      // Delete Comment
      const deleteCommentBtn = target.closest('[data-action="delete-comment"]');
      if (deleteCommentBtn) {
        const commentId = deleteCommentBtn.dataset.commentId;
        const postId = deleteCommentBtn.dataset.postId;

        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
          const res = await API.comments.delete(commentId);
          if (res.success) {
            document.getElementById(`comment-${commentId}`)?.remove();
            const currentPost = State.posts.find((p) => p._id === postId);
            if (currentPost) {
              State.updatePost(postId, { commentsCount: Math.max((currentPost.commentsCount || 1) - 1, 0) });
            }
            UI.showToast('Comment removed', 'info');
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to delete comment', 'error');
        }
        return;
      }

      // Delete Post
      const deletePostBtn = target.closest('[data-action="delete-post"]');
      if (deletePostBtn) {
        const postId = deletePostBtn.dataset.postId;
        if (!confirm('Delete this post permanently?')) return;

        try {
          const res = await API.posts.delete(postId);
          if (res.success) {
            State.removePost(postId);
            UI.showToast('Post deleted', 'info');
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to delete post', 'error');
        }
        return;
      }
    });

    // Profile View Interactions
    profileHeroContainer?.addEventListener('click', async (e) => {
      // Toggle follow from profile header
      const followBtn = e.target.closest('#profile-follow-toggle-btn');
      if (followBtn) {
        const userId = followBtn.dataset.userId;
        const isFollowing = followBtn.dataset.following === 'true';

        followBtn.disabled = true;
        try {
          const res = isFollowing ? await API.users.unfollow(userId) : await API.users.follow(userId);
          if (res.success && res.data) {
            followBtn.dataset.following = String(res.data.isFollowing);
            followBtn.textContent = res.data.isFollowing ? 'Following' : 'Follow';
            followBtn.className = `btn btn-sm ${res.data.isFollowing ? 'btn-following' : 'btn-follow'}`;

            const followersEl = document.getElementById('profile-followers-count');
            if (followersEl) followersEl.textContent = res.data.followersCount;

            // Refresh current user stats
            const meRes = await API.auth.getMe();
            if (meRes.success) State.setCurrentUser(meRes.data.user);
            loadSuggestedUsers();
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to update follow status', 'error');
        } finally {
          followBtn.disabled = false;
        }
        return;
      }

      // Open Edit Profile Modal
      if (e.target.closest('#edit-profile-open-btn')) {
        openEditProfileModal();
      }
    });

    // Suggested users widget clicks
    document.getElementById('suggested-users-widget')?.addEventListener('click', async (e) => {
      const userItem = e.target.closest('.suggested-user-info');
      if (userItem) {
        const username = userItem.dataset.username;
        if (username) loadUserProfile(username);
        return;
      }

      const followBtn = e.target.closest('[data-action="toggle-follow-user"]');
      if (followBtn) {
        if (!State.currentUser) {
          openAuthModal('login');
          return;
        }

        const userId = followBtn.dataset.userId;
        const isFollowing = followBtn.dataset.following === 'true';

        followBtn.disabled = true;
        try {
          const res = isFollowing ? await API.users.unfollow(userId) : await API.users.follow(userId);
          if (res.success && res.data) {
            followBtn.dataset.following = String(res.data.isFollowing);
            followBtn.textContent = res.data.isFollowing ? 'Following' : 'Follow';
            followBtn.className = `btn ${res.data.isFollowing ? 'btn-following' : 'btn-follow'}`;

            const meRes = await API.auth.getMe();
            if (meRes.success) State.setCurrentUser(meRes.data.user);
          }
        } catch (err) {
          UI.showToast(err.message || 'Failed to update follow', 'error');
        } finally {
          followBtn.disabled = false;
        }
      }
    });

    // Navbar / Sidebar Auth button clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('#open-auth-btn') || e.target.closest('#sidebar-auth-btn')) {
        openAuthModal('login');
      }

      if (e.target.closest('#logout-btn')) {
        API.setToken(null);
        State.setCurrentUser(null);
        UI.showToast('You have been logged out.', 'info');
        loadFeed('explore');
      }

      if (e.target.closest('[data-action="view-my-profile"]')) {
        if (State.currentUser) {
          loadUserProfile(State.currentUser.username);
        }
      }
    });

    // Search Input interactions
    let searchDebounce;
    globalSearchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (searchClearBtn) searchClearBtn.style.display = q ? 'block' : 'none';

      clearTimeout(searchDebounce);
      if (!q) {
        if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
        return;
      }

      searchDebounce = setTimeout(async () => {
        try {
          const res = await API.users.search(q);
          if (res.success) {
            UI.renderSearchResults(res.data);
          }
        } catch (err) {
          console.warn('Search failed:', err);
        }
      }, 250);
    });

    searchClearBtn?.addEventListener('click', () => {
      globalSearchInput.value = '';
      searchClearBtn.style.display = 'none';
      if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
    });

    searchResultsDropdown?.addEventListener('click', (e) => {
      const item = e.target.closest('.search-item');
      if (item) {
        const username = item.dataset.username;
        if (username) {
          loadUserProfile(username);
          searchResultsDropdown.style.display = 'none';
          globalSearchInput.value = '';
          searchClearBtn.style.display = 'none';
        }
      }
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-search')) {
        if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
      }
    });

    // Auth Modal handling
    document.getElementById('auth-modal-close')?.addEventListener('click', () => {
      authDialog?.close();
    });

    authDialog?.addEventListener('click', (e) => {
      if (e.target === authDialog) authDialog.close();
    });

    tabLoginBtn?.addEventListener('click', () => switchAuthTab('login'));
    tabRegisterBtn?.addEventListener('click', () => switchAuthTab('register'));

    // Login Form Submit
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginErrorMsg.style.display = 'none';

      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const res = await API.auth.login({ identifier, password });
        if (res.success && res.data) {
          API.setToken(res.data.token);
          State.setCurrentUser(res.data.user);
          authDialog.close();
          loginForm.reset();
          UI.showToast(`Welcome back, ${res.data.user.name}!`, 'success');
          loadFeed('home');
        }
      } catch (err) {
        loginErrorMsg.textContent = err.message || 'Login failed';
        loginErrorMsg.style.display = 'block';
      }
    });

    // Register Form Submit
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      registerErrorMsg.style.display = 'none';

      const name = document.getElementById('reg-name').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const bio = document.getElementById('reg-bio').value.trim();

      try {
        const res = await API.auth.register({ name, username, email, password, bio });
        if (res.success && res.data) {
          API.setToken(res.data.token);
          State.setCurrentUser(res.data.user);
          authDialog.close();
          registerForm.reset();
          UI.showToast(`Account created! Welcome to BLEM, ${res.data.user.name}!`, 'success');
          loadFeed('home');
        }
      } catch (err) {
        const msg = err.details ? err.details.join('. ') : err.message;
        registerErrorMsg.textContent = msg || 'Registration failed';
        registerErrorMsg.style.display = 'block';
      }
    });

    // Demo User 1-click Login
    document.getElementById('demo-login-btn')?.addEventListener('click', async () => {
      // Attempt login with demo user credentials, or register if not existing yet
      const demoEmail = 'alex@blem.social';
      const demoPass = 'blemPass123';
      try {
        let res;
        try {
          res = await API.auth.login({ identifier: demoEmail, password: demoPass });
        } catch {
          // If demo user does not exist yet, register them
          res = await API.auth.register({
            name: 'Alex Rivera',
            username: 'alexrivera',
            email: demoEmail,
            password: demoPass,
            bio: 'BLEM Pioneer & Tech Explorer 🚀'
          });
        }

        if (res.success && res.data) {
          API.setToken(res.data.token);
          State.setCurrentUser(res.data.user);
          authDialog.close();
          UI.showToast(`Logged in as demo user @${res.data.user.username}!`, 'success');
          loadFeed('home');
        }
      } catch (err) {
        UI.showToast('Demo login error: ' + err.message, 'error');
      }
    });

    // Edit Profile Modal
    document.getElementById('edit-profile-close')?.addEventListener('click', () => {
      editProfileDialog?.close();
    });

    document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();
      const avatar = document.getElementById('edit-avatar').value.trim();
      const errorBanner = document.getElementById('edit-profile-error');
      if (errorBanner) errorBanner.style.display = 'none';

      try {
        const res = await API.users.updateProfile({ name, bio, avatar });
        if (res.success && res.data?.user) {
          State.setCurrentUser(res.data.user);
          editProfileDialog.close();
          UI.showToast('Profile updated!', 'success');
          loadUserProfile(res.data.user.username);
        }
      } catch (err) {
        if (errorBanner) {
          errorBanner.textContent = err.message || 'Failed to update profile';
          errorBanner.style.display = 'block';
        }
      }
    });
  }

  function openAuthModal(initialTab = 'login') {
    switchAuthTab(initialTab);
    authDialog?.showModal();
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      tabLoginBtn?.classList.add('active');
      tabRegisterBtn?.classList.remove('active');
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      if (authModalTitle) authModalTitle.textContent = 'Welcome back to BLEM';
    } else {
      tabLoginBtn?.classList.remove('active');
      tabRegisterBtn?.classList.add('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      if (authModalTitle) authModalTitle.textContent = 'Join the BLEM Network';
    }
    if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    if (registerErrorMsg) registerErrorMsg.style.display = 'none';
  }

  function openEditProfileModal() {
    if (!State.currentUser) return;
    const nameInput = document.getElementById('edit-name');
    const bioInput = document.getElementById('edit-bio');
    const avatarInput = document.getElementById('edit-avatar');

    if (nameInput) nameInput.value = State.currentUser.name || '';
    if (bioInput) bioInput.value = State.currentUser.bio || '';
    if (avatarInput) avatarInput.value = State.currentUser.avatar || '';

    editProfileDialog?.showModal();
  }

  // Kickoff app
  init();
});
