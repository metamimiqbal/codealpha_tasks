/**
 * AURA STORE — CLIENT APPLICATION
 * Modern Vanilla JavaScript Architecture
 */

(function () {
  'use strict';

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const state = {
    products: [],
    categories: [],
    activeCategory: 'All',
    searchKeyword: '',
    sort: 'newest',
    cart: JSON.parse(localStorage.getItem('aura_cart') || '[]'),
    user: JSON.parse(localStorage.getItem('aura_user') || 'null'),
    token: localStorage.getItem('aura_token') || null,
    selectedProduct: null,
    modalQty: 1
  };

  // =========================================================================
  // DOM ELEMENT SELECTORS
  // =========================================================================
  const DOM = {
    // Navigation & Header
    searchInput: document.getElementById('searchInput'),
    authContainer: document.getElementById('authContainer'),
    openAuthBtn: document.getElementById('openAuthBtn'),
    myOrdersBtn: document.getElementById('myOrdersBtn'),
    openCartBtn: document.getElementById('openCartBtn'),
    cartBadge: document.getElementById('cartBadge'),
    brandLogo: document.getElementById('brandLogo'),

    // Catalog & Controls
    categoryPills: document.getElementById('categoryPills'),
    sortSelect: document.getElementById('sortSelect'),
    catalogHeaderTitle: document.getElementById('catalogHeaderTitle'),
    productCountTag: document.getElementById('productCountTag'),
    productsGrid: document.getElementById('productsGrid'),

    // Product Details Modal
    productDetailsModal: document.getElementById('productDetailsModal'),
    closeDetailModalBtn: document.getElementById('closeDetailModalBtn'),
    productDetailContent: document.getElementById('productDetailContent'),

    // Cart Modal
    cartModal: document.getElementById('cartModal'),
    closeCartModalBtn: document.getElementById('closeCartModalBtn'),
    cartItemsContainer: document.getElementById('cartItemsContainer'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartTax: document.getElementById('cartTax'),
    cartShipping: document.getElementById('cartShipping'),
    cartTotal: document.getElementById('cartTotal'),
    proceedCheckoutBtn: document.getElementById('proceedCheckoutBtn'),

    // Checkout Modal
    checkoutModal: document.getElementById('checkoutModal'),
    closeCheckoutModalBtn: document.getElementById('closeCheckoutModalBtn'),
    checkoutFormContainer: document.getElementById('checkoutFormContainer'),
    orderForm: document.getElementById('orderForm'),
    shippingFullName: document.getElementById('shippingFullName'),
    checkoutOrderTotal: document.getElementById('checkoutOrderTotal'),
    paymentOptionsGroup: document.getElementById('paymentOptionsGroup'),
    orderSuccessContainer: document.getElementById('orderSuccessContainer'),
    successOrderId: document.getElementById('successOrderId'),
    successOrderTotal: document.getElementById('successOrderTotal'),
    closeSuccessBtn: document.getElementById('closeSuccessBtn'),
    viewMyOrdersFromSuccessBtn: document.getElementById('viewMyOrdersFromSuccessBtn'),

    // Auth Modal
    authModal: document.getElementById('authModal'),
    closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
    tabSignIn: document.getElementById('tabSignIn'),
    tabRegister: document.getElementById('tabRegister'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    regName: document.getElementById('regName'),
    regEmail: document.getElementById('regEmail'),
    regPassword: document.getElementById('regPassword'),
    fillCustomerDemo: document.getElementById('fillCustomerDemo'),
    fillAdminDemo: document.getElementById('fillAdminDemo'),

    // Orders Modal
    ordersModal: document.getElementById('ordersModal'),
    closeOrdersModalBtn: document.getElementById('closeOrdersModalBtn'),
    ordersListContainer: document.getElementById('ordersListContainer'),

    // Toast Notification Container
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // API CLIENT HELPERS
  // =========================================================================
  const API = {
    async request(url, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
      }

      try {
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Request failed with status ${response.status}`);
        }
        return data;
      } catch (err) {
        console.error(`API Error [${url}]:`, err);
        throw err;
      }
    },

    getProducts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return API.request(`/api/products?${query}`);
    },

    getCategories() {
      return API.request('/api/products/categories/list');
    },

    getProductById(id) {
      return API.request(`/api/products/${id}`);
    },

    login(credentials) {
      return API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },

    register(data) {
      return API.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    syncCart(items) {
      return API.request('/api/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
    },

    createOrder(orderData) {
      return API.request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },

    getMyOrders() {
      return API.request('/api/orders/myorders');
    }
  };

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // =========================================================================
  // CATALOG & PRODUCTS RENDERING
  // =========================================================================
  async function loadCategories() {
    try {
      const categories = await API.getCategories();
      state.categories = categories;
      renderCategoryPills();
    } catch (err) {
      console.warn('Failed loading categories:', err);
    }
  }

  function renderCategoryPills() {
    const pills = ['All', ...state.categories];
    DOM.categoryPills.innerHTML = pills.map(cat => `
      <button type="button" class="category-pill ${state.activeCategory === cat ? 'active' : ''}" data-category="${cat}">
        ${cat === 'All' ? 'All Items' : cat}
      </button>
    `).join('');

    // Attach click handlers
    DOM.categoryPills.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        renderCategoryPills();
        loadProducts();
      });
    });
  }

  async function loadProducts() {
    DOM.productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
        <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="margin-top: 14px;">Loading collection...</p>
      </div>
    `;

    try {
      const params = {
        sort: state.sort
      };

      if (state.activeCategory && state.activeCategory !== 'All') {
        params.category = state.activeCategory;
      }

      if (state.searchKeyword.trim() !== '') {
        params.keyword = state.searchKeyword.trim();
      }

      const res = await API.getProducts(params);
      state.products = res.products || [];

      DOM.catalogHeaderTitle.textContent = state.activeCategory === 'All' ? 'All Products' : `${state.activeCategory} Collection`;
      DOM.productCountTag.textContent = `Showing ${state.products.length} of ${res.total} products`;

      renderProductsGrid();
    } catch (err) {
      DOM.productsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>Failed to load products. Please check connection.</p>
        </div>
      `;
    }
  }

  function renderProductsGrid() {
    if (state.products.length === 0) {
      DOM.productsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3 style="margin-bottom: 8px;">No products match your criteria</h3>
          <p>Try refining your search keyword or clearing category filters.</p>
        </div>
      `;
      return;
    }

    DOM.productsGrid.innerHTML = state.products.map(product => `
      <article class="product-card" data-product-id="${product._id}">
        ${product.featured ? `<span class="product-card-badge">Featured</span>` : ''}
        <div class="product-image-container">
          <img src="${product.imageUrl}" alt="${product.name}" class="product-img" loading="lazy">
        </div>
        <div class="product-card-body">
          <div class="product-card-meta">
            <span class="product-category">${product.category}</span>
            <div class="product-rating">
              <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${product.rating.toFixed(1)}</span>
            </div>
          </div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${product.description}</p>
          <div class="product-card-footer">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button type="button" class="add-btn-quick" data-add-id="${product._id}" title="Add to Cart">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Add</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Attach card click handlers for details modal & quick add
    DOM.productsGrid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const quickAddBtn = e.target.closest('[data-add-id]');
        if (quickAddBtn) {
          e.stopPropagation();
          const pId = quickAddBtn.dataset.addId;
          const target = state.products.find(p => p._id === pId);
          if (target) {
            addToCart(target, 1);
            showToast(`Added "${target.name}" to cart!`, 'success');
          }
          return;
        }

        const id = card.dataset.productId;
        openProductDetails(id);
      });
    });
  }

  // =========================================================================
  // PRODUCT DETAILS MODAL
  // =========================================================================
  async function openProductDetails(productId) {
    try {
      const product = await API.getProductById(productId);
      state.selectedProduct = product;
      state.modalQty = 1;

      const inStock = product.countInStock > 0;

      DOM.productDetailContent.innerHTML = `
        <div class="detail-img-box">
          <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="detail-info">
          <div class="detail-badges">
            <span class="detail-category-tag">${product.category}</span>
            <span class="detail-stock-badge ${inStock ? 'stock-in' : 'stock-out'}">
              ${inStock ? `In Stock (${product.countInStock} available)` : 'Out of Stock'}
            </span>
          </div>
          <h2 class="detail-title">${product.name}</h2>
          <div class="detail-rating-row">
            <span style="color: var(--accent-amber); font-weight: 700; display: flex; align-items: center; gap: 4px;">
              ★ ${product.rating.toFixed(1)}
            </span>
            <span>•</span>
            <span>${product.numReviews} verified customer reviews</span>
            <span>•</span>
            <span>Brand: <strong>${product.brand}</strong></span>
          </div>
          <div class="detail-price">$${product.price.toFixed(2)}</div>
          <p class="detail-desc">${product.description}</p>
          
          ${inStock ? `
            <div class="quantity-picker">
              <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-muted);">Quantity:</span>
              <div class="qty-control">
                <button type="button" class="qty-btn" id="modalQtyMinus">-</button>
                <span class="qty-display" id="modalQtyDisplay">1</span>
                <button type="button" class="qty-btn" id="modalQtyPlus">+</button>
              </div>
            </div>
            <button type="button" id="modalAddToCartBtn" class="btn btn-primary" style="width: 100%; padding: 14px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span>Add to Cart — $${product.price.toFixed(2)}</span>
            </button>
          ` : `
            <button type="button" class="btn btn-secondary" disabled style="width: 100%;">Out of Stock</button>
          `}
        </div>
      `;

      // Setup quantity listeners
      const qtyMinus = document.getElementById('modalQtyMinus');
      const qtyPlus = document.getElementById('modalQtyPlus');
      const qtyDisplay = document.getElementById('modalQtyDisplay');
      const addBtn = document.getElementById('modalAddToCartBtn');

      if (qtyMinus && qtyPlus) {
        qtyMinus.addEventListener('click', () => {
          if (state.modalQty > 1) {
            state.modalQty--;
            qtyDisplay.textContent = state.modalQty;
            addBtn.querySelector('span').textContent = `Add to Cart — $${(product.price * state.modalQty).toFixed(2)}`;
          }
        });

        qtyPlus.addEventListener('click', () => {
          if (state.modalQty < product.countInStock) {
            state.modalQty++;
            qtyDisplay.textContent = state.modalQty;
            addBtn.querySelector('span').textContent = `Add to Cart — $${(product.price * state.modalQty).toFixed(2)}`;
          } else {
            showToast(`Maximum available stock reached (${product.countInStock})`, 'info');
          }
        });

        addBtn.addEventListener('click', () => {
          addToCart(product, state.modalQty);
          showToast(`Added ${state.modalQty} × "${product.name}" to cart!`, 'success');
          DOM.productDetailsModal.close();
        });
      }

      DOM.productDetailsModal.showModal();
    } catch (err) {
      showToast('Could not load product details.', 'error');
    }
  }

  // =========================================================================
  // CART OPERATIONS & MODAL
  // =========================================================================
  function addToCart(product, qty = 1) {
    const existingIndex = state.cart.findIndex(item => item.product._id === product._id);

    if (existingIndex > -1) {
      state.cart[existingIndex].qty += qty;
    } else {
      state.cart.push({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          countInStock: product.countInStock
        },
        qty
      });
    }

    saveCart();
  }

  function updateCartQuantity(productId, delta) {
    const item = state.cart.find(i => i.product._id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      state.cart = state.cart.filter(i => i.product._id !== productId);
    }

    saveCart();
    renderCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(i => i.product._id !== productId);
    saveCart();
    renderCart();
    showToast('Item removed from cart.', 'info');
  }

  function clearCart() {
    state.cart = [];
    saveCart();
    renderCart();
  }

  function saveCart() {
    localStorage.setItem('aura_cart', JSON.stringify(state.cart));
    updateCartBadge();

    // If logged in, sync with server
    if (state.token) {
      API.syncCart(state.cart.map(i => ({ productId: i.product._id, qty: i.qty }))).catch(e => {
        console.warn('Failed background cart sync:', e);
      });
    }
  }

  function updateCartBadge() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    DOM.cartBadge.textContent = totalItems;
  }

  function calculateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const shipping = subtotal >= 100 || subtotal === 0 ? 0.0 : 9.99;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      shipping,
      tax,
      total
    };
  }

  function renderCart() {
    const totals = calculateCartTotals();

    DOM.cartSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
    DOM.cartTax.textContent = `$${totals.tax.toFixed(2)}`;
    DOM.cartShipping.textContent = totals.shipping === 0 ? 'Free' : `$${totals.shipping.toFixed(2)}`;
    DOM.cartTotal.textContent = `$${totals.total.toFixed(2)}`;

    if (state.cart.length === 0) {
      DOM.cartItemsContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h3 style="margin-bottom: 6px;">Your cart is empty</h3>
          <p style="margin-bottom: 18px;">Looks like you haven't added any gear yet.</p>
          <button type="button" class="btn btn-secondary" id="emptyCartBrowseBtn">Explore Catalog</button>
        </div>
      `;

      DOM.proceedCheckoutBtn.disabled = true;

      const exploreBtn = document.getElementById('emptyCartBrowseBtn');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
          DOM.cartModal.close();
        });
      }
      return;
    }

    DOM.proceedCheckoutBtn.disabled = false;

    DOM.cartItemsContainer.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img src="${item.product.imageUrl}" alt="${item.product.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.product.name}</div>
          <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-control" style="transform: scale(0.85); transform-origin: right center;">
            <button type="button" class="qty-btn" data-minus-id="${item.product._id}">-</button>
            <span class="qty-display">${item.qty}</span>
            <button type="button" class="qty-btn" data-plus-id="${item.product._id}">+</button>
          </div>
          <button type="button" class="remove-cart-item-btn" data-remove-id="${item.product._id}" title="Remove item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Attach listeners
    DOM.cartItemsContainer.querySelectorAll('[data-minus-id]').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.minusId, -1));
    });
    DOM.cartItemsContainer.querySelectorAll('[data-plus-id]').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.plusId, 1));
    });
    DOM.cartItemsContainer.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.removeId));
    });
  }

  // =========================================================================
  // CHECKOUT & ORDER PROCESSING
  // =========================================================================
  function openCheckout() {
    if (state.cart.length === 0) {
      showToast('Your cart is empty.', 'info');
      return;
    }

    if (!state.token) {
      showToast('Please sign in to complete your order.', 'info');
      DOM.cartModal.close();
      openAuthModal('signin');
      return;
    }

    const totals = calculateCartTotals();
    DOM.checkoutOrderTotal.textContent = `$${totals.total.toFixed(2)}`;

    // Reset forms
    DOM.checkoutFormContainer.style.display = 'block';
    DOM.orderSuccessContainer.style.display = 'none';

    if (state.user && state.user.name) {
      DOM.shippingFullName.value = state.user.name;
    }

    DOM.cartModal.close();
    DOM.checkoutModal.showModal();
  }

  async function handleOrderSubmit(e) {
    e.preventDefault();

    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Card';

    const orderPayload = {
      orderItems: state.cart.map(item => ({
        product: item.product._id,
        name: item.product.name,
        qty: item.qty,
        price: item.product.price,
        imageUrl: item.product.imageUrl
      })),
      shippingAddress: {
        fullName: document.getElementById('shippingFullName').value.trim(),
        address: document.getElementById('shippingAddress').value.trim(),
        city: document.getElementById('shippingCity').value.trim(),
        postalCode: document.getElementById('shippingPostal').value.trim(),
        country: document.getElementById('shippingCountry').value.trim()
      },
      paymentMethod: selectedPayment
    };

    const submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing Order...</span>';

    try {
      const createdOrder = await API.createOrder(orderPayload);

      // Order created successfully
      state.cart = [];
      saveCart();
      renderCart();

      // Display Success Confirmation
      DOM.checkoutFormContainer.style.display = 'none';
      DOM.orderSuccessContainer.style.display = 'block';
      DOM.successOrderId.textContent = `#${createdOrder._id}`;
      DOM.successOrderTotal.textContent = `$${createdOrder.totalPrice.toFixed(2)}`;

      showToast('Order confirmed and processed successfully!', 'success');
      loadProducts(); // refresh stock numbers
    } catch (err) {
      showToast(err.message || 'Failed to process order.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Place Order &amp; Pay Now</span>';
    }
  }

  // =========================================================================
  // USER AUTHENTICATION (SIGN IN & REGISTER)
  // =========================================================================
  function openAuthModal(initialTab = 'signin') {
    switchAuthTab(initialTab);
    DOM.authModal.showModal();
  }

  function switchAuthTab(tab) {
    if (tab === 'signin') {
      DOM.tabSignIn.classList.add('active');
      DOM.tabRegister.classList.remove('active');
      DOM.loginForm.style.display = 'block';
      DOM.registerForm.style.display = 'none';
    } else {
      DOM.tabRegister.classList.add('active');
      DOM.tabSignIn.classList.remove('active');
      DOM.registerForm.style.display = 'block';
      DOM.loginForm.style.display = 'none';
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;

    try {
      const res = await API.login({ email, password });
      setAuthSession(res.user, res.token);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      DOM.authModal.close();

      // Sync guest cart items to user account
      if (state.cart.length > 0) {
        await API.syncCart(state.cart.map(i => ({ productId: i.product._id, qty: i.qty })));
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name = DOM.regName.value.trim();
    const email = DOM.regEmail.value.trim();
    const password = DOM.regPassword.value;

    try {
      const res = await API.register({ name, email, password });
      setAuthSession(res.user, res.token);
      showToast(`Account created! Welcome, ${res.user.name}.`, 'success');
      DOM.authModal.close();
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    }
  }

  function setAuthSession(user, token) {
    state.user = user;
    state.token = token;
    localStorage.setItem('aura_user', JSON.stringify(user));
    localStorage.setItem('aura_token', token);
    renderAuthUI();
  }

  function logout() {
    state.user = null;
    state.token = null;
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_token');
    renderAuthUI();
    showToast('Signed out successfully.', 'info');
  }

  function renderAuthUI() {
    if (state.user && state.token) {
      const initial = (state.user.name || 'U').charAt(0).toUpperCase();
      DOM.authContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="user-menu-btn" id="userMenuBtn" title="${state.user.email}">
            <div class="user-avatar">${initial}</div>
            <span>${state.user.name.split(' ')[0]}</span>
          </div>
          <button type="button" id="logoutBtn" class="btn btn-ghost" title="Sign Out" style="padding: 6px 10px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      `;

      DOM.myOrdersBtn.style.display = 'inline-flex';

      document.getElementById('logoutBtn')?.addEventListener('click', logout);
    } else {
      DOM.authContainer.innerHTML = `
        <button type="button" id="openAuthBtn" class="btn btn-secondary">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Sign In</span>
        </button>
      `;

      DOM.myOrdersBtn.style.display = 'none';

      document.getElementById('openAuthBtn')?.addEventListener('click', () => openAuthModal('signin'));
    }
  }

  // =========================================================================
  // ORDERS HISTORY MODAL
  // =========================================================================
  async function openOrdersModal() {
    if (!state.token) {
      openAuthModal('signin');
      return;
    }

    DOM.ordersListContainer.innerHTML = `
      <div style="text-align: center; padding: 32px; color: var(--text-muted);">
        Loading orders...
      </div>
    `;

    DOM.ordersModal.showModal();

    try {
      const orders = await API.getMyOrders();
      if (orders.length === 0) {
        DOM.ordersListContainer.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <h3 style="margin-bottom: 6px;">No orders found</h3>
            <p>You haven't placed any orders yet.</p>
          </div>
        `;
        return;
      }

      DOM.ordersListContainer.innerHTML = orders.map(order => {
        const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        return `
          <div class="order-history-card">
            <div class="order-history-header">
              <div>
                <strong style="color: var(--accent-primary-light);">Order #${order._id.slice(-8).toUpperCase()}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</div>
              </div>
              <span class="order-status-badge status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <div style="margin-bottom: 12px;">
              ${order.orderItems.map(item => `
                <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 4px;">
                  <span>${item.qty} × ${item.name}</span>
                  <span style="color: var(--text-muted);">$${(item.price * item.qty).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Shipped to: ${order.shippingAddress.city}, ${order.shippingAddress.country}</span>
              <strong style="font-size: 1rem; color: var(--text-main);">$${order.totalPrice.toFixed(2)}</strong>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      DOM.ordersListContainer.innerHTML = `
        <div class="empty-state">
          <p>Failed to load orders.</p>
        </div>
      `;
    }
  }

  // =========================================================================
  // EVENT LISTENERS & INITIALIZATION
  // =========================================================================
  function initEventListeners() {
    // Search with debounce
    let searchDebounceTimer;
    DOM.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.searchKeyword = e.target.value;
        loadProducts();
      }, 300);
    });

    // Sorting
    DOM.sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      loadProducts();
    });

    // Cart Modal Controls
    DOM.openCartBtn.addEventListener('click', () => {
      renderCart();
      DOM.cartModal.showModal();
    });
    DOM.closeCartModalBtn.addEventListener('click', () => DOM.cartModal.close());
    DOM.proceedCheckoutBtn.addEventListener('click', openCheckout);

    // Product Details Modal Close
    DOM.closeDetailModalBtn.addEventListener('click', () => DOM.productDetailsModal.close());

    // Checkout Modal Controls
    DOM.closeCheckoutModalBtn.addEventListener('click', () => DOM.checkoutModal.close());
    DOM.orderForm.addEventListener('submit', handleOrderSubmit);
    DOM.closeSuccessBtn.addEventListener('click', () => DOM.checkoutModal.close());
    DOM.viewMyOrdersFromSuccessBtn.addEventListener('click', () => {
      DOM.checkoutModal.close();
      openOrdersModal();
    });

    // Payment Option selector highlight
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input');
        if (radio) radio.checked = true;
      });
    });

    // Auth Modal Controls
    DOM.tabSignIn.addEventListener('click', () => switchAuthTab('signin'));
    DOM.tabRegister.addEventListener('click', () => switchAuthTab('register'));
    DOM.closeAuthModalBtn.addEventListener('click', () => DOM.authModal.close());
    DOM.loginForm.addEventListener('submit', handleLogin);
    DOM.registerForm.addEventListener('submit', handleRegister);

    // Demo Fill Buttons
    DOM.fillCustomerDemo.addEventListener('click', () => {
      switchAuthTab('signin');
      DOM.loginEmail.value = 'customer@aurashop.com';
      DOM.loginPassword.value = 'password123';
    });

    DOM.fillAdminDemo.addEventListener('click', () => {
      switchAuthTab('signin');
      DOM.loginEmail.value = 'admin@aurashop.com';
      DOM.loginPassword.value = 'password123';
    });

    // Orders Modal Controls
    DOM.myOrdersBtn.addEventListener('click', openOrdersModal);
    DOM.closeOrdersModalBtn.addEventListener('click', () => DOM.ordersModal.close());

    // Close modals on clicking backdrop
    [DOM.productDetailsModal, DOM.cartModal, DOM.checkoutModal, DOM.authModal, DOM.ordersModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.close();
        }
      });
    });

    // Footer category links
    document.querySelectorAll('.footer-cat-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.category;
        state.activeCategory = cat;
        renderCategoryPills();
        loadProducts();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
    });
  }

  // Initialize Application
  function init() {
    renderAuthUI();
    updateCartBadge();
    initEventListeners();
    loadCategories();
    loadProducts();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
