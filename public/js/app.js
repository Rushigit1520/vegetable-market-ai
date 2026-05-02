/* ===================================================
   Vegetable Market AI Premium — Application Logic
   =================================================== */

const API = "";

const app = {
  state: {
    currentPage: "home",
    products: [],
    deals: [],
    categories: [],
    cart: { items: [], total: 0, itemCount: 0 },
    wishlist: [],
    orders: [],
    activeCategory: "All",
    sortBy: "popularity",
    authToken: localStorage.getItem("token") || "",
    currentUser: JSON.parse(localStorage.getItem("user") || "null"),
    appliedCoupon: null,
    discountAmount: 0,
  },

  // -------- Initialization --------
  init() {
    this.updateAuthUI();
    this.setupEventListeners();
    this.loadInitialData();
    this.startFlashCountdown();

    if (this.state.authToken) {
      this.fetchCart();
      this.fetchWishlist();
    }
  },

  setupEventListeners() {
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
      searchInput.addEventListener("input", this.debounce((e) => this.handleSearch(e.target.value), 300));
    }
    
    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      const userMenu = document.getElementById("user-menu-container");
      if (userMenu && !userMenu.contains(e.target)) {
        document.getElementById("user-dropdown").classList.remove("open");
      }
      
      const searchWrap = document.querySelector(".search-wrapper");
      if (searchWrap && !searchWrap.contains(e.target)) {
        document.getElementById("search-dropdown").style.display = "none";
      }
    });
  },

  // -------- API Wrapper --------
  async api(path, options = {}) {
    const headers = { "Content-Type": "application/json" };
    if (this.state.authToken) headers["Authorization"] = `Bearer ${this.state.authToken}`;
    
    try {
      const res = await fetch(`${API}${path}`, { headers, ...options });
      if (res.status === 401) this.logout(false);
      return await res.json();
    } catch (err) {
      console.error(`API Error (${path}):`, err);
      return { success: false, message: "Network error." };
    }
  },

  // -------- Auth --------
  updateAuthUI() {
    const { authToken, currentUser } = this.state;
    const loginBtn = document.getElementById("btn-login-header");
    const userMenu = document.getElementById("user-menu-container");
    
    if (authToken && currentUser) {
      if (loginBtn) loginBtn.style.display = "none";
      if (userMenu) {
        userMenu.style.display = "block";
        document.getElementById("user-avatar-initial").textContent = currentUser.name.charAt(0).toUpperCase();
        document.getElementById("dropdown-user-name").textContent = currentUser.name;
        document.getElementById("dropdown-user-email").textContent = currentUser.email;
        
        if (currentUser.role === "admin" || currentUser.role === "employee") {
          document.getElementById("admin-link").style.display = "flex";
        }
      }
      document.getElementById("nav-orders-btn").style.display = "flex";
      document.getElementById("nav-wishlist-btn").style.display = "flex";
    } else {
      if (loginBtn) loginBtn.style.display = "inline-flex";
      if (userMenu) userMenu.style.display = "none";
      document.getElementById("nav-orders-btn").style.display = "none";
      document.getElementById("nav-wishlist-btn").style.display = "none";
    }
  },

  logout(showMsg = true) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.state.authToken = "";
    this.state.currentUser = null;
    this.state.cart = { items: [], total: 0, itemCount: 0 };
    this.state.wishlist = [];
    this.updateAuthUI();
    this.updateCartUI();
    this.switchTab("home");
    if (showMsg) this.showToast("👋", "Logged out successfully");
  },

  // -------- Navigation --------
  switchTab(page) {
    if ((page === "orders" || page === "wishlist") && !this.state.authToken) {
      window.location.href = "/login.html";
      return;
    }

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
      if (item.innerText.toLowerCase().includes(page.toLowerCase())) {
        item.classList.add("active");
      }
    });

    this.state.currentPage = page;
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "home") this.loadInitialData();
    if (page === "orders") this.fetchOrders();
    if (page === "wishlist") this.renderWishlistPage();
    if (page === "categories") this.renderAllCategoriesPage();
    if (page === "deals") this.renderDealsPage();
    if (page === "checkout") this.renderCheckoutPage();

    // Close user dropdown if open
    document.getElementById("user-dropdown").classList.remove("open");
  },

  // -------- Data Loading --------
  async loadInitialData() {
    this.loadProducts();
    this.loadDeals();
    this.loadCategories();
  },

  async loadProducts() {
    const { activeCategory, sortBy } = this.state;
    const catQuery = activeCategory !== "All" ? `&category=${encodeURIComponent(activeCategory)}` : "";
    
    try {
      const res = await this.api(`/api/products?sortBy=${sortBy}${catQuery}`);
      if (res.success) {
        this.state.products = res.data;
        this.renderProducts();
      }
    } catch (e) {
      console.error(e);
    }
  },

  async loadDeals() {
    try {
      const res = await this.api("/api/products/deals");
      if (res.success) {
        this.state.deals = res.data;
        this.renderFlashDeals();
      }
    } catch (e) {
      console.error(e);
    }
  },

  async loadCategories() {
    try {
      const res = await this.api("/api/products/categories");
      if (res.success) {
        this.state.categories = res.data;
        this.renderCategoryChips();
        this.renderVisualCategories();
      }
    } catch (e) {
      console.error(e);
    }
  },

  // -------- Rendering --------
  formatPrice(price) {
    return "₹" + parseFloat(price).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  },

  renderCategoryChips() {
    const container = document.getElementById("category-filter");
    if (!container) return;
    
    let html = `<button class="cat-chip ${this.state.activeCategory === 'All' ? 'active' : ''}" onclick="app.filterCategory('All')">All Items</button>`;
    this.state.categories.forEach(cat => {
      html += `<button class="cat-chip ${this.state.activeCategory === cat ? 'active' : ''}" onclick="app.filterCategory('${cat}')">${cat}</button>`;
    });
    container.innerHTML = html;
  },

  renderVisualCategories() {
    const container = document.getElementById("visual-categories");
    if (!container) return;

    const icons = {
      'Fruits': '🍎', 'Vegetables': '🥦', 'Dairy': '🥛', 'Bakery': '🥐',
      'Meat & Seafood': '🍗', 'Pantry': '🍚', 'Beverages': '🥤', 'Snacks': '🍫'
    };

    container.innerHTML = this.state.categories.slice(0, 6).map(cat => `
      <div class="cat-visual-card" onclick="app.switchTab('home'); app.filterCategory('${cat}')">
        <div class="cat-icon-container">${icons[cat] || '🥬'}</div>
        <div class="cat-name">${cat}</div>
      </div>
    `).join("");
    
    // Add "More" card
    container.innerHTML += `
      <div class="cat-visual-card" onclick="app.switchTab('categories')">
        <div class="cat-icon-container">➜</div>
        <div class="cat-name">View All</div>
      </div>
    `;
  },

  renderAllCategoriesPage() {
    const container = document.getElementById("all-categories-grid");
    if (!container) return;
    
    const icons = {
      'Fruits': '🍎', 'Vegetables': '🥦', 'Dairy': '🥛', 'Bakery': '🥐',
      'Meat & Seafood': '🍗', 'Pantry': '🍚', 'Beverages': '🥤', 'Snacks': '🍫'
    };

    container.innerHTML = this.state.categories.map(cat => `
      <div class="cat-visual-card" onclick="app.switchTab('home'); app.filterCategory('${cat}')">
        <div class="cat-icon-container">${icons[cat] || '🥬'}</div>
        <div class="cat-name">${cat}</div>
      </div>
    `).join("");
  },

  generateProductCard(p) {
    const isOutOfStock = p.stock <= 0;
    const inWishlist = this.state.wishlist.some(w => w.product_id === p.id);
    
    const imageHtml = p.image && p.image.startsWith("/")
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="${isOutOfStock ? 'opacity:0.3; filter:grayscale(100%)' : ''}">`
      : `<div style="font-size:80px; ${isOutOfStock ? 'opacity:0.3' : ''}">${p.image || '🥬'}</div>`;

    let badgesHtml = '<div class="card-badges">';
    if (p.is_deal) badgesHtml += `<span class="badge-deal">Deal</span>`;
    if (p.is_featured) badgesHtml += `<span class="badge-featured">Featured</span>`;
    if (!isOutOfStock && p.stock <= 10) badgesHtml += `<span class="badge-stock">Only ${p.stock} left</span>`;
    if (isOutOfStock) badgesHtml += `<span class="badge-deal" style="background:#475569">Out of Stock</span>`;
    badgesHtml += '</div>';

    let priceHtml = '';
    if (p.original_price && p.original_price > p.price) {
      priceHtml = `
        <div class="price-original">${this.formatPrice(p.original_price)}</div>
        <div class="price-current">${this.formatPrice(p.price)}</div>
      `;
    } else {
      priceHtml = `<div class="price-current">${this.formatPrice(p.price)}</div>`;
    }

    // Check if in cart to show qty controls instead of add button
    const cartItem = this.state.cart.items.find(i => i.productId === p.id);
    let actionHtml = '';
    
    if (isOutOfStock) {
      actionHtml = `<button class="btn-quick-add" style="background:var(--bg-glass); cursor:not-allowed;" disabled><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg></button>`;
    } else if (cartItem) {
      actionHtml = `
        <div class="qty-control-inline">
          <button class="qty-btn" onclick="app.updateCartQty(${p.id}, ${cartItem.quantity - 1})">−</button>
          <span class="qty-val">${cartItem.quantity}</span>
          <button class="qty-btn" onclick="app.updateCartQty(${p.id}, ${cartItem.quantity + 1})">+</button>
        </div>
      `;
    } else {
      actionHtml = `<button class="btn-quick-add" onclick="app.addToCart(${p.id}, 1, event)"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></button>`;
    }

    return `
      <div class="product-card" data-tilt>
        ${badgesHtml}
        <button class="btn-wishlist ${inWishlist ? 'active' : ''}" onclick="app.toggleWishlist(${p.id}, event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
        <div class="product-card-image" onclick="app.openProductModal(${p.id})">
          ${imageHtml}
        </div>
        <div class="product-card-body">
          <div class="product-meta">
            <span class="product-category">${p.category}</span>
            <span class="product-time"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 10 MINS</span>
          </div>
          <div class="product-name" onclick="app.openProductModal(${p.id})">${p.name}</div>
          <div class="product-rating-row">
            <span class="stars">★★★★★</span>
            <span class="rating-count">(${p.reviews || Math.floor(Math.random()*200)+20})</span>
          </div>
          <div class="card-footer">
            <div class="price-block">
              ${priceHtml}
              <span class="product-unit">/ ${p.unit}</span>
            </div>
            <div class="action-area">
              ${actionHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderProducts() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    if (this.state.products.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;">No products found.</div>`;
      return;
    }

    grid.innerHTML = this.state.products.map(p => this.generateProductCard(p)).join("");
    
    // Init tilt effect if available
    if (window.VanillaTilt) {
      VanillaTilt.init(document.querySelectorAll("[data-tilt]"), { max: 5, speed: 400, glare: true, "max-glare": 0.2 });
    }
  },

  renderFlashDeals() {
    const container = document.getElementById("flash-deals-container");
    if (!container) return;
    container.innerHTML = this.state.deals.map(p => this.generateProductCard(p)).join("");
  },

  renderDealsPage() {
    const grid = document.getElementById("deals-grid");
    if (!grid) return;
    grid.innerHTML = this.state.deals.map(p => this.generateProductCard(p)).join("");
  },

  filterCategory(cat) {
    this.state.activeCategory = cat;
    this.renderCategoryChips();
    
    const sortSelect = document.getElementById("sort-select");
    this.state.sortBy = sortSelect ? sortSelect.value : "popularity";
    
    this.loadProducts();
  },

  // -------- Search --------
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  async handleSearch(query) {
    const dropdown = document.getElementById("search-dropdown");
    if (!query || query.length < 2) {
      dropdown.style.display = "none";
      return;
    }

    try {
      const res = await this.api(`/api/products?search=${encodeURIComponent(query)}`);
      if (res.success && res.data.length > 0) {
        dropdown.innerHTML = res.data.slice(0, 5).map(p => `
          <div class="search-item" onclick="app.openProductModal(${p.id}); document.getElementById('search-dropdown').style.display='none'">
            <div style="width:40px;height:40px;background:rgba(255,255,255,0.05);border-radius:8px;display:flex;align-items:center;justify-content:center;">
              ${p.image.startsWith('/') ? `<img src="${p.image}" style="width:80%;height:80%;object-fit:contain">` : p.image}
            </div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700">${p.name}</div>
              <div style="font-size:12px;color:var(--text-muted)">${this.formatPrice(p.price)}</div>
            </div>
          </div>
        `).join("");
        dropdown.style.display = "block";
      } else {
        dropdown.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted)">No results found</div>`;
        dropdown.style.display = "block";
      }
    } catch (e) {
      console.error(e);
    }
  },

  // -------- Cart --------
  toggleCart() {
    if (!this.state.authToken) {
      window.location.href = "/login.html";
      return;
    }
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    drawer.classList.toggle("open");
    overlay.classList.toggle("open");
    if (drawer.classList.contains("open")) {
      this.fetchCart();
    }
  },

  async fetchCart() {
    try {
      const res = await this.api("/api/cart");
      if (res.success) {
        this.state.cart = res.data;
        this.updateCartUI();
        this.renderCartDrawer();
      }
    } catch (e) {
      console.error(e);
    }
  },

  updateCartUI() {
    const badge = document.getElementById("cart-badge");
    const headerTotal = document.getElementById("header-cart-total");
    
    if (badge) {
      badge.textContent = this.state.cart.itemCount;
      if (this.state.cart.itemCount > 0) {
        badge.classList.remove("bump");
        void badge.offsetWidth; // trigger reflow
        badge.classList.add("bump");
      }
    }
    if (headerTotal) {
      headerTotal.textContent = this.formatPrice(this.state.cart.total);
    }

    // Re-render products to update add/qty buttons
    if (this.state.currentPage === "home") this.renderProducts();
  },

  async addToCart(productId, quantity, event) {
    if (event) event.stopPropagation();
    if (!this.state.authToken) {
      window.location.href = "/login.html";
      return;
    }

    try {
      const res = await this.api("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity })
      });
      if (res.success) {
        this.showToast("🛒", "Added to cart");
        await this.fetchCart();
        
        // Confetti pop from button
        if (event && window.confetti) {
          const rect = event.target.getBoundingClientRect();
          confetti({
            particleCount: 30, spread: 50,
            origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight },
            colors: ['#00ff88', '#ffffff']
          });
        }
      } else {
        this.showToast("❌", res.message);
      }
    } catch (e) {
      console.error(e);
    }
  },

  async updateCartQty(productId, quantity) {
    try {
      const res = await this.api(`/api/cart/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity })
      });
      if (res.success) {
        await this.fetchCart();
      } else {
        this.showToast("❌", res.message);
      }
    } catch (e) {
      console.error(e);
    }
  },

  async removeFromCart(productId) {
    try {
      const res = await this.api(`/api/cart/${productId}`, { method: "DELETE" });
      if (res.success) {
        await this.fetchCart();
      }
    } catch (e) {
      console.error(e);
    }
  },

  renderCartDrawer() {
    const body = document.getElementById("cart-drawer-body");
    const subtotalEl = document.getElementById("drawer-subtotal");
    const totalEl = document.getElementById("drawer-total");
    const discountRow = document.getElementById("drawer-discount-row");
    const discountEl = document.getElementById("drawer-discount");
    
    if (this.state.cart.items.length === 0) {
      body.innerHTML = `
        <div class="empty-cart-msg">
          <div class="empty-cart-icon">🛒</div>
          <h4>Your cart is empty</h4>
          <p style="font-size:13px; margin-top:8px">Looks like you haven't added anything yet.</p>
        </div>
      `;
      document.querySelector(".cart-drawer-footer").style.display = "none";
      return;
    }

    document.querySelector(".cart-drawer-footer").style.display = "block";

    body.innerHTML = this.state.cart.items.map(item => `
      <div class="drawer-item">
        <button class="btn-remove-item" onclick="app.removeFromCart(${item.productId})"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        <div class="drawer-item-img">
          ${item.product.image.startsWith('/') ? `<img src="${item.product.image}">` : `<div style="font-size:32px">${item.product.image}</div>`}
        </div>
        <div class="drawer-item-info">
          <div class="drawer-item-name">${item.product.name}</div>
          <div class="drawer-item-unit">${item.product.unit}</div>
          <div class="drawer-item-bottom">
            <div class="drawer-item-price">${this.formatPrice(item.product.price)}</div>
            <div class="qty-small">
              <button onclick="app.updateCartQty(${item.productId}, ${item.quantity - 1})">−</button>
              <span>${item.quantity}</span>
              <button onclick="app.updateCartQty(${item.productId}, ${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    const subtotal = this.state.cart.total;
    subtotalEl.textContent = this.formatPrice(subtotal);
    
    // Recalculate discount if coupon applied
    if (this.state.appliedCoupon) {
      this.calculateDiscount(subtotal);
      discountRow.style.display = "flex";
      discountEl.textContent = `-${this.formatPrice(this.state.discountAmount)}`;
    } else {
      discountRow.style.display = "none";
      this.state.discountAmount = 0;
    }

    const total = subtotal - this.state.discountAmount;
    totalEl.textContent = this.formatPrice(Math.max(0, total));
    document.getElementById("btn-checkout-amt").textContent = this.formatPrice(Math.max(0, total));
  },

  // -------- Coupons --------
  async applyCoupon() {
    const code = document.getElementById("coupon-code").value.trim();
    const msgEl = document.getElementById("coupon-message");
    
    if (!code) return;

    try {
      const res = await this.api(`/api/coupons/validate/${code}`);
      if (res.success) {
        const coupon = res.data;
        if (this.state.cart.total < coupon.min_order) {
          msgEl.className = "coupon-message error";
          msgEl.textContent = `Minimum order of ${this.formatPrice(coupon.min_order)} required.`;
          return;
        }

        this.state.appliedCoupon = coupon;
        msgEl.className = "coupon-message success";
        msgEl.textContent = `Coupon ${coupon.code} applied successfully!`;
        document.getElementById("drawer-coupon-tag").textContent = coupon.code;
        this.renderCartDrawer();
        this.showToast("🎟️", "Coupon applied!");
      } else {
        msgEl.className = "coupon-message error";
        msgEl.textContent = res.message || "Invalid coupon code";
      }
    } catch (e) {
      console.error(e);
    }
  },

  calculateDiscount(subtotal) {
    const coupon = this.state.appliedCoupon;
    if (!coupon) return;

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }
    this.state.discountAmount = discount;
  },

  proceedToCheckout() {
    this.toggleCart();
    this.switchTab("checkout");
  },

  // -------- Checkout --------
  renderCheckoutPage() {
    const list = document.getElementById("checkout-items-list");
    list.innerHTML = this.state.cart.items.map(item => `
      <div class="summary-row" style="color:var(--text-main); font-weight:600;">
        <span>${item.quantity}x ${item.product.name}</span>
        <span>${this.formatPrice(item.product.price * item.quantity)}</span>
      </div>
    `).join("");

    document.getElementById("chk-subtotal").textContent = this.formatPrice(this.state.cart.total);
    
    if (this.state.appliedCoupon) {
      document.getElementById("chk-discount-row").style.display = "flex";
      document.getElementById("chk-discount").textContent = `-${this.formatPrice(this.state.discountAmount)}`;
    } else {
      document.getElementById("chk-discount-row").style.display = "none";
    }

    const total = this.state.cart.total - this.state.discountAmount;
    document.getElementById("chk-total").textContent = this.formatPrice(Math.max(0, total));
  },

  async placeOrder(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-place-order");
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> Processing...`;

    const payload = {
      address: document.getElementById("chk-address").value,
      phone: document.getElementById("chk-phone").value,
      coupon_code: this.state.appliedCoupon ? this.state.appliedCoupon.code : null
    };

    try {
      const res = await this.api("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.success) {
        // Confetti celebration!
        if (window.confetti) {
          const duration = 3000;
          const end = Date.now() + duration;
          (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00ff88', '#bf00ff'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00ff88', '#bf00ff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
          }());
        }

        // Show confirmation UI replacing checkout form
        document.querySelector(".checkout-layout").innerHTML = `
          <div class="confirmation-card" style="grid-column: 1/-1;">
            <div class="confirm-icon">🎉</div>
            <h3 class="confirm-title">Order Confirmed!</h3>
            <p class="confirm-subtitle">Your groceries are being packed by our dark store wizards.</p>
            <div class="confirm-order-id">Order ID: <strong>${res.data.order_number}</strong></div>
            <br>
            <button class="btn-primary" onclick="app.switchTab('orders')">Track Order</button>
          </div>
        `;
        
        // Reset state
        this.state.cart = { items: [], total: 0, itemCount: 0 };
        this.state.appliedCoupon = null;
        this.state.discountAmount = 0;
        this.updateCartUI();
      } else {
        this.showToast("❌", res.message);
        btn.disabled = false;
        btn.innerHTML = "Place Order Securely";
      }
    } catch (e) {
      console.error(e);
      this.showToast("❌", "Network error");
      btn.disabled = false;
      btn.innerHTML = "Place Order Securely";
    }
  },

  // -------- Orders --------
  async fetchOrders() {
    try {
      const res = await this.api("/api/orders");
      if (res.success) {
        this.state.orders = res.data;
        this.renderOrdersPage();
      }
    } catch (e) {
      console.error(e);
    }
  },

  renderOrdersPage() {
    const container = document.getElementById("orders-container");
    if (!container) return;

    if (this.state.orders.length === 0) {
      container.innerHTML = `
        <div class="orders-empty">
          <div class="empty-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet. Start shopping!</p>
          <button class="btn-primary" onclick="app.switchTab('home')">Browse Products</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="orders-list">` + this.state.orders.map(o => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <span class="order-number">${o.order_number}</span>
            <span class="order-date">${new Date(o.created_at).toLocaleDateString()}</span>
          </div>
          <span class="order-status order-status-${o.status}">${o.status.replace('_', ' ')}</span>
        </div>
        <div class="order-card-items">
          ${o.items.map(i => `
            <div class="order-item-row">
              <span>${i.quantity}x ${i.product_name}</span>
              <span>${this.formatPrice(i.subtotal)}</span>
            </div>
          `).join("")}
        </div>
        <div class="order-card-footer">
          <strong>Total: ${this.formatPrice(o.total)}</strong>
        </div>
      </div>
    `).join("") + `</div>`;
  },

  // -------- Wishlist --------
  async fetchWishlist() {
    try {
      const res = await this.api("/api/wishlist");
      if (res.success) {
        this.state.wishlist = res.data;
      }
    } catch (e) {
      console.error(e);
    }
  },

  async toggleWishlist(productId, event) {
    if (event) event.stopPropagation();
    if (!this.state.authToken) {
      window.location.href = "/login.html";
      return;
    }

    const btn = event.currentTarget;
    const isAdded = btn.classList.contains("active");

    try {
      if (isAdded) {
        await this.api(`/api/wishlist/${productId}`, { method: "DELETE" });
        btn.classList.remove("active");
        this.showToast("🤍", "Removed from wishlist");
      } else {
        await this.api("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
        btn.classList.add("active");
        this.showToast("❤️", "Added to wishlist");
        
        // Micro animation
        gsap.from(btn, { scale: 1.5, duration: 0.3, ease: "back.out(2)" });
      }
      this.fetchWishlist();
    } catch (e) {
      console.error(e);
    }
  },

  renderWishlistPage() {
    const container = document.getElementById("wishlist-container");
    if (!container) return;

    if (this.state.wishlist.length === 0) {
      container.innerHTML = `
        <div class="orders-empty">
          <div class="empty-icon">❤️</div>
          <h3>Wishlist is Empty</h3>
          <p>Save your favorite items here to buy them later.</p>
          <button class="btn-primary" onclick="app.switchTab('home')">Browse Products</button>
        </div>
      `;
      return;
    }

    const productsHtml = this.state.wishlist.map(w => {
      // Map wishlist item to product structure for generateProductCard
      const p = {
        id: w.product_id, name: w.name, category: w.category, price: w.price,
        original_price: w.original_price, unit: w.unit, image: w.image,
        stock: w.stock, rating: w.rating, reviews: w.reviews
      };
      return this.generateProductCard(p);
    }).join("");

    container.innerHTML = `<div class="product-grid">${productsHtml}</div>`;
  },

  // -------- Modals & UI --------
  async openProductModal(id) {
    const modal = document.getElementById("product-modal");
    const content = document.getElementById("modal-product-details");
    
    // Find product in existing data or fetch it
    let p = this.state.products.find(x => x.id === id) || this.state.deals.find(x => x.id === id);
    if (!p) {
      const res = await this.api(`/api/products/${id}`);
      if (res.success) p = res.data;
      else return;
    }

    const imageHtml = p.image && p.image.startsWith("/")
      ? `<img src="${p.image}" alt="${p.name}">`
      : `<div style="font-size:120px">${p.image || '🥬'}</div>`;
      
    let priceHtml = p.original_price && p.original_price > p.price
      ? `<span class="price-original" style="font-size:16px">${this.formatPrice(p.original_price)}</span> <span class="price-current" style="font-size:32px">${this.formatPrice(p.price)}</span>`
      : `<span class="price-current" style="font-size:32px">${this.formatPrice(p.price)}</span>`;

    content.innerHTML = `
      <div class="modal-image-col">${imageHtml}</div>
      <div class="modal-info-col">
        <div class="product-category" style="margin-bottom:12px">${p.category}</div>
        <h2 style="font-size:32px; font-weight:800; margin-bottom:16px; line-height:1.2;">${p.name}</h2>
        <div class="product-rating-row" style="margin-bottom:24px;">
          <span class="stars">★★★★★</span>
          <span class="rating-count" style="font-size:14px">(${p.reviews || 120} reviews)</span>
        </div>
        <p style="color:var(--text-muted); line-height:1.6; margin-bottom:32px; font-size:15px;">${p.description || 'Fresh and premium quality.'}</p>
        
        <div style="display:flex; align-items:flex-end; gap:8px; margin-bottom:32px;">
          ${priceHtml}
          <span style="color:var(--text-dim); font-weight:600; margin-bottom:4px">/ ${p.unit}</span>
        </div>
        
        <div style="display:flex; gap:16px;">
          ${p.stock > 0 
            ? `<button class="btn-primary" style="flex:1" onclick="app.addToCart(${p.id}, 1, event); app.closeProductModal()">Add to Cart</button>`
            : `<button class="btn-primary" style="flex:1; background:var(--bg-glass); cursor:not-allowed" disabled>Out of Stock</button>`
          }
        </div>
      </div>
    `;

    modal.classList.add("open");
  },

  closeProductModal(e) {
    if (e) e.stopPropagation();
    document.getElementById("product-modal").classList.remove("open");
  },

  showToast(icon, message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // -------- Utilities --------
  startFlashCountdown() {
    const el = document.getElementById("flash-countdown");
    if (!el) return;
    
    // Set to 2h 45m from now
    let time = 2 * 3600 + 45 * 60;
    setInterval(() => {
      if (time <= 0) return;
      time--;
      const h = Math.floor(time / 3600).toString().padStart(2, "0");
      const m = Math.floor((time % 3600) / 60).toString().padStart(2, "0");
      const s = Math.floor(time % 60).toString().padStart(2, "0");
      el.textContent = `${h}h : ${m}m : ${s}s`;
    }, 1000);
  }
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.initUXEffects === "function") window.initUXEffects();
  app.init();
});
