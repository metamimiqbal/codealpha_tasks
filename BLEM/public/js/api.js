/**
 * BLEM Client API Adapter
 * Standardized HTTP client handling authentication headers and RESTful routes
 */

const TOKEN_KEY = 'blem_auth_token';

const API = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: 'Non-JSON server response'
      }));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.details = data.details || data.errors;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} /api${endpoint}:`, err);
      throw err;
    }
  },

  // Auth Endpoints
  auth: {
    register: (userData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => API.request('/auth/me')
  },

  // User Endpoints
  users: {
    getProfile: (username) => API.request(`/users/profile/${encodeURIComponent(username)}`),
    updateProfile: (profileData) => API.request('/users/profile', { method: 'PATCH', body: JSON.stringify(profileData) }),
    follow: (userId) => API.request(`/users/${userId}/follow`, { method: 'POST' }),
    unfollow: (userId) => API.request(`/users/${userId}/follow`, { method: 'DELETE' }),
    search: (query) => API.request(`/users/search?q=${encodeURIComponent(query)}`)
  },

  // Post Endpoints
  posts: {
    getFeed: (type = 'home', page = 1) => API.request(`/posts/feed?type=${type}&page=${page}`),
    create: (postData) => API.request('/posts', { method: 'POST', body: JSON.stringify(postData) }),
    getById: (id) => API.request(`/posts/${id}`),
    getByUser: (userId, page = 1) => API.request(`/posts/user/${userId}?page=${page}`),
    delete: (id) => API.request(`/posts/${id}`, { method: 'DELETE' }),
    toggleLike: (id) => API.request(`/posts/${id}/like`, { method: 'POST' })
  },

  // Comment Endpoints
  comments: {
    getByPost: (postId) => API.request(`/comments/post/${postId}`),
    create: (postId, data) => API.request(`/comments/post/${postId}`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/comments/${id}`, { method: 'DELETE' })
  }
};

window.API = API;
