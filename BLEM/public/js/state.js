/**
 * BLEM Client State Store
 * Simple, predictable reactive state container with subscriber dispatch
 */

const State = {
  currentUser: null,
  activeFeedType: 'home', // 'home' | 'explore'
  currentView: 'feed', // 'feed' | 'profile'
  activeProfileUsername: null,
  posts: [],
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  },

  setCurrentUser(user) {
    this.currentUser = user;
    this.emit('userChanged', user);
  },

  setFeedType(type) {
    this.activeFeedType = type;
    this.emit('feedTypeChanged', type);
  },

  setView(view, extra = {}) {
    this.currentView = view;
    if (view === 'profile') {
      this.activeProfileUsername = extra.username || null;
    }
    this.emit('viewChanged', { view, ...extra });
  },

  setPosts(posts) {
    this.posts = posts;
    this.emit('postsUpdated', posts);
  },

  addPost(post) {
    this.posts = [post, ...this.posts];
    this.emit('postsUpdated', this.posts);
  },

  updatePost(postId, updates) {
    this.posts = this.posts.map((p) => (p._id === postId ? { ...p, ...updates } : p));
    this.emit('postUpdated', { postId, updates });
  },

  removePost(postId) {
    this.posts = this.posts.filter((p) => p._id !== postId);
    this.emit('postsUpdated', this.posts);
  }
};

window.State = State;
