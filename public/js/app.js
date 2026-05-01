/* ===================================================
   Vegetable Market AI — Application Logic (God Mode)
   Currency: INR (₹)
   =================================================== */

const API = "";

// -------- State --------
let currentPage = "home";
let products = [];
let categories = [];
let activeCategory = "All";
let authToken = localStorage.getItem("token") || "";
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

// -------- Init --------
document.addEventListener("DOMContentLoaded", () => {
  // Start UX effects (loading screen, cursor glow)
  if (typeof window.initUXEffects === "function") window.initUXEffects();

  updateAuthUI();
  loadProducts();
  if (authToken) loadCart();
  setupSearch();
  setupScroll();
  setupPaymentToggle();
  setupFooterDate();
  setupDropdownClose();
});

// -------- Auth State --------
function updateAuthUI() {
  const loginBtn = document.getElementById("btn-login-header");
  const userMenu = document.getElementById("user-menu");
  const sidebarUser = document.getElementById("user-profile-mini");
  
  if (authToken && currentUser) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "flex";
    if (sidebarUser) {
      sidebarUser.style.display = "flex";
      document.getElementById("user-avatar-sidebar").textContent = currentUser.name.charAt(0).toUpperCase();
      document.getElementById("sidebar-user-name").textContent = currentUser.name;
    }
  } else {
    if (loginBtn) loginBtn.style.display = "flex";
    if (userMenu) userMenu.style.display = "none";
    if (sidebarUser) sidebarUser.style.display = "none";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  authToken = "";
  currentUser = null;
  updateAuthUI();
  navigateTo("home");
  showToast("👋", "Logged out successfully");
  const badge = document.getElementById("cart-badge");
  if (badge) badge.textContent = "0";
}

// -------- API Helpers --------
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    authToken = "";
    currentUser = null;
    updateAuthUI();
  }

  return res.json();
}

// -------- Navigation --------
function navigateTo(page) {
  const fromEl = document.querySelector(".page.active");
  const toEl = document.getElementById(`page-${page}`);
  
  // Update sidebar active state
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
    if (item.innerText.toLowerCase().includes(page.toLowerCase()) || (page === 'home' && item.innerText.toLowerCase().includes('categories'))) {
      item.classList.add("active");
    }
  });

  // Try smooth transition, fallback to instant
  if (typeof window.smoothTransition === "function" && window.smoothTransition(fromEl, toEl)) {
    // smoothTransition handled it
  } else {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    if (toEl) toEl.classList.add("active");
  }

  currentPage = page;
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "home") loadProducts();
  if (page === "cart") renderCart();
  if (page === "checkout") renderCheckoutSummary();
  if (page === "orders") renderOrderHistory();
}

// -------- Currency Formatter --------
function formatPrice(price) {
  return "₹" + parseFloat(price).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// -------- Products --------
async function loadProducts() {
  try {
    const res = await api("/api/products");
    products = res.data;

    const catRes = await api("/api/products/categories");
    categories = catRes.data;

    renderCategories();
    renderProducts(products);
  } catch (err) {
    console.error("Failed to load products", err);
  }
}

function renderCategories() {
  const container = document.getElementById("category-filter");
  if (!container) return;
  container.innerHTML = `<button class="cat-chip active" data-category="All" onclick="filterCategory('All', this)">All</button>`;
  categories.forEach((cat) => {
    container.innerHTML += `<button class="cat-chip" data-category="${cat}" onclick="filterCategory('${cat}', this)">${cat}</button>`;
  });
}

function filterCategory(category, el) {
  activeCategory = category;
  document.querySelectorAll(".cat-chip").forEach((c) => c.classList.remove("active"));
  if (el) el.classList.add("active");

  const filtered = category === "All" ? products : products.filter((p) => p.category === category);
  renderProducts(filtered);
}

function renderProducts(list) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:12px">🔍</div>
      <p>No products found</p>
    </div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (p) => {
        const isOutOfStock = p.stock <= 0;
        const imageHtml = p.image && p.image.startsWith("/")
          ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="width:80%; height:80%; object-fit:contain; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); ${isOutOfStock ? 'opacity:0.3; grayscale(100%)' : ''}">`
          : `<div style="font-size:80px; ${isOutOfStock ? 'opacity:0.3' : ''}">${p.image || '🥬'}</div>`;
          
        const outOfStockOverlay = isOutOfStock 
          ? `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(239,68,68,0.9); color:white; padding:8px 16px; border-radius:8px; font-weight:bold; z-index:2; text-align:center; box-shadow:0 0 20px rgba(239,68,68,0.5);">
               <div style="font-size:24px; margin-bottom:4px;">❌</div>
               OUT OF STOCK
             </div>` 
          : '';
          
        return `
    <div class="product-card glass-card ${isOutOfStock ? 'disabled-card' : ''}" id="card-${p.id}" style="position:relative;">
      <div class="product-card-image" onclick="${isOutOfStock ? '' : `openProductDetail('${p.id}')`}">
        ${outOfStockOverlay}
        ${imageHtml}
      </div>
      <div class="product-card-body">
        <div class="product-category">${p.category}</div>
        <div class="product-name" style="${isOutOfStock ? 'color:var(--text-muted)' : ''}">${p.name}</div>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          <span class="product-unit">/ ${p.unit}</span>
        </div>
        <div class="card-actions">
          <div class="qty-selector" style="${isOutOfStock ? 'opacity:0.5; pointer-events:none;' : ''}">
            <button class="qty-btn" onclick="changeCardQty('${p.id}', -1)">−</button>
            <span class="qty-val" id="qty-val-${p.id}">1</span>
            <button class="qty-btn" onclick="changeCardQty('${p.id}', 1)">+</button>
          </div>
          <button class="btn-add-to-cart" id="add-btn-${p.id}" onclick="addToCart('${p.id}')" ${isOutOfStock ? 'disabled style="background:var(--bg-surface); color:var(--text-muted); border-color:var(--border-glass); cursor:not-allowed;"' : ''}>
            ${isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;
      }
    )
    .join("");

  // Trigger GSAP scroll animations for new cards
  if (typeof window.refreshScrollAnimations === "function") {
    window.refreshScrollAnimations();
  }
}

// Logic for card quantity selector
window.changeCardQty = function(productId, delta) {
  const el = document.getElementById(`qty-val-${productId}`);
  if (!el) return;
  
  const p = products.find(prod => prod.id == productId);
  const maxStock = p ? p.stock : 20;
  
  let val = parseInt(el.textContent);
  val += delta;
  
  if (val < 1) val = 1;
  if (val > maxStock) {
    val = maxStock;
    if (delta > 0) showToast("⚠️", `Only ${maxStock} items available in stock.`);
  }
  
  el.textContent = val;
};

// -------- Cart --------
async function addToCart(productId) {
  if (!authToken) {
    showToast("🔐", "Please login to add items to cart");
    setTimeout(() => { window.location.href = "/login.html"; }, 1000);
    return;
  }

  const qtyEl = document.getElementById(`qty-val-${productId}`);
  const quantity = qtyEl ? parseInt(qtyEl.textContent) : 1;

  try {
    const res = await api("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId: parseInt(productId), quantity }),
    });

    if (!res.success) {
      showToast("❌", res.message || "Failed to add item to cart");
      return;
    }

    // Animation feedback
    const btn = document.getElementById(`add-btn-${productId}`);
    if (btn) {
      const originalText = btn.textContent;
      btn.style.background = "var(--accent-blue)";
      btn.textContent = "Added! ✓";
      setTimeout(() => {
        btn.style.background = "";
        btn.textContent = originalText;
        if (qtyEl) qtyEl.textContent = "1";
      }, 1500);
    }

    await loadCart();
    showToast("✅", `Added to cart!`);
  } catch (err) {
    showToast("❌", "Failed to add item");
  }
}

async function loadCart() {
  if (!authToken) return;
  try {
    const res = await api("/api/cart");
    const { itemCount } = res.data;
    const badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent = itemCount;
      badge.classList.add("bump");
      setTimeout(() => badge.classList.remove("bump"), 400);
    }
  } catch (err) {
    console.error("Failed to load cart", err);
  }
}

async function renderCart() {
  const cartEmpty = document.getElementById("cart-empty");
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const cartPrompt = document.getElementById("cart-login-prompt");

  if (!authToken) {
    if (cartPrompt) cartPrompt.style.display = "block";
    if (cartItems) cartItems.style.display = "none";
    if (cartSummary) cartSummary.style.display = "none";
    if (cartEmpty) cartEmpty.style.display = "none";
    return;
  }
  if (cartPrompt) cartPrompt.style.display = "none";

  try {
    const res = await api("/api/cart");
    const { items, total, itemCount } = res.data;

    if (!items.length) {
      if (cartEmpty) cartEmpty.style.display = "block";
      if (cartItems) cartItems.style.display = "none";
      if (cartSummary) cartSummary.style.display = "none";
      return;
    }

    if (cartEmpty) cartEmpty.style.display = "none";
    if (cartItems) cartItems.style.display = "block";
    if (cartSummary) cartSummary.style.display = "block";

    cartItems.innerHTML = items
      .map(
        (item) => {
          // Render image properly
          const imgHtml = item.product.image && item.product.image.startsWith("/")
            ? `<img src="${item.product.image}" alt="${item.product.name}" style="width:100%;height:100%;object-fit:contain;">`
            : `<span style="font-size:42px">${item.product.image || '🥬'}</span>`;

          return `
      <div class="cart-item glass-card">
        <div class="cart-item-image">${imgHtml}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product.name}</div>
          <div class="cart-item-price">${formatPrice(item.product.price)} / ${item.product.unit}</div>
          <div class="qty-selector">
            <button class="qty-btn" onclick="updateQty('${item.productId}', ${item.quantity - 1})">−</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty('${item.productId}', ${item.quantity + 1})">+</button>
          </div>
          <div class="cart-item-subtotal">${formatPrice(item.product.price * item.quantity)}</div>
        </div>
        <button class="btn-remove" onclick="removeFromCart('${item.productId}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;
        }
      )
      .join("");

    const delivery = total > 500 ? 0 : 49;
    const finalTotal = total + delivery;

    cartSummary.innerHTML = `
      <h3 class="summary-title">Order Summary</h3>
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(total)}</span></div>
      <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? "FREE" : formatPrice(delivery)}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(finalTotal)}</span></div>
      <button class="btn btn-primary btn-lg btn-full" style="margin-top:24px" onclick="navigateTo('checkout')">Checkout</button>
    `;
  } catch (err) {
    console.error("Failed to render cart", err);
  }
}

async function updateQty(productId, qty) {
  if (qty < 1) return removeFromCart(productId);
  try {
    const res = await api(`/api/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: qty }),
    });
    
    if (!res.success) {
      showToast("❌", res.message || "Failed to update item");
      return;
    }
    
    await loadCart();
    renderCart();
  } catch (err) {
    showToast("❌", "Failed to update item");
  }
}

async function removeFromCart(productId) {
  try {
    await api(`/api/cart/${productId}`, { method: "DELETE" });
    await loadCart();
    renderCart();
    showToast("🗑️", "Item removed");
  } catch (err) {
    showToast("❌", "Failed to remove item");
  }
}

// -------- Checkout --------
async function renderCheckoutSummary() {
  if (!authToken) return;
  try {
    const res = await api("/api/cart");
    const { items, total } = res.data;
    const delivery = total > 500 ? 0 : 49;
    const finalTotal = total + delivery;

    const container = document.getElementById("checkout-summary");
    container.innerHTML = `
      <h3 class="summary-title">Your Order</h3>
      ${items.map(item => `<div class="summary-row"><span>${item.product.name} × ${item.quantity}</span><span>${formatPrice(item.product.price * item.quantity)}</span></div>`).join("")}
      <div class="summary-row total"><span>Total</span><span>${formatPrice(finalTotal)}</span></div>
      <button class="btn btn-primary btn-lg btn-full" style="margin-top:24px; background: var(--grad-green);" onclick="document.getElementById('place-order-btn').click()">Confirm Order</button>
    `;
  } catch (err) {
    console.error("Failed to render checkout summary", err);
  }
}

async function placeOrder(e) {
  e.preventDefault();
  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.textContent = "Confirming Order...";

  const address = document.getElementById("customer-address").value;
  const phone = document.getElementById("customer-phone").value;

  try {
    const res = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({ address, phone }),
    });

    if (res.success) {
      await loadCart();
      renderConfirmation(res.data);
      navigateTo("confirmation");
    } else {
      showToast("❌", res.message || "Failed to confirm order");
    }
  } catch (err) {
    showToast("❌", "Something went wrong");
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirm Order";
  }
}

function renderConfirmation(order) {
  const card = document.getElementById("confirmation-card");
  
  // order might not have items if backend doesn't send it back in the confirmation response,
  // but we can at least show the total and ID securely.
  card.innerHTML = `
    <div style="font-size:60px;margin-bottom:20px;">✅</div>
    <h2 class="confirm-title">Order Confirmed!</h2>
    <p class="confirm-subtitle">Your fresh groceries are on the way.</p>
    
    <div class="glass-card" style="margin: 24px 0; padding: 20px; text-align: left;">
      <h4 style="margin-bottom: 12px; color: var(--accent-green);">Order Details</h4>
      <div class="summary-row">
        <span>Order ID:</span>
        <strong>${order.order_number}</strong>
      </div>
      <div class="summary-row">
        <span>Total Amount:</span>
        <strong>${formatPrice(order.total || 0)}</strong>
      </div>
      <div class="summary-row">
        <span>Status:</span>
        <span class="badge badge-pending">Pending</span>
      </div>
    </div>
    
    <button class="btn btn-primary btn-full" style="margin-top:10px;" onclick="navigateTo('orders')">Track Order</button>
    <button class="btn btn-outline btn-full" style="margin-top:10px;" onclick="navigateTo('home')">Return to Market</button>
  `;
}

// -------- Order History --------
async function renderOrderHistory() {
  const listEl = document.getElementById("orders-list");
  const emptyEl = document.getElementById("orders-empty");

  try {
    const res = await api("/api/orders");
    const orders = res.data || [];

    if (!orders.length) {
      listEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    listEl.style.display = "block";

    listEl.innerHTML = orders
      .map(
        (order) => `
      <div class="order-card glass-card">
        <div class="summary-row"><strong>${order.order_number}</strong><span class="badge badge-${order.status}">${order.status}</span></div>
        <div class="summary-row"><span>Total: ${formatPrice(order.total)}</span></div>
        ${order.status === 'pending' ? `<button class="btn btn-primary btn-sm" style="margin-top:12px; width:100%" onclick="showToast('💳', 'Redirecting to Payment Gateway...')">Checkout / Pay Now</button>` : ''}
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load orders", err);
  }
}

// -------- Search --------
function setupSearch() {
  const input = document.getElementById("search-input");
  let debounce;
  if (!input) return;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) {
        filterCategory(activeCategory, null);
        return;
      }
      try {
        const res = await api(`/api/products?search=${encodeURIComponent(q)}`);
        renderProducts(res.data);
        if (currentPage !== "home") navigateTo("home");
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
  });
}

function setupScroll() {
  window.addEventListener("scroll", () => {
    const header = document.getElementById("main-header");
    if (window.scrollY > 10) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  });
}

function setupPaymentToggle() {
  document.addEventListener("change", (e) => {
    if (e.target.name === "payment") {
      document.querySelectorAll(".payment-option").forEach((opt) => opt.classList.remove("selected"));
      e.target.closest(".payment-option").classList.add("selected");
    }
  });
}

function showToast(icon, message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast glass-card";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function setupFooterDate() {
  const el = document.getElementById("date-time");
  if (!el) return;
  const update = () => { el.textContent = new Date().toLocaleString("en-IN"); };
  update();
  setInterval(update, 1000);
}

function setupDropdownClose() {}

// 3D Integration - Open Product Modal
window.openProductDetail = function(productId) {
  const p = products.find(prod => prod.id == productId);
  if (!p) return;
  
  const modal = document.getElementById("product-modal");
  const body = document.getElementById("product-modal-body");
  
  const imageHtml = p.image && p.image.startsWith("/")
    ? `<img src="${p.image}" alt="${p.name}" style="width:200px;height:200px;object-fit:contain;margin:0 auto 20px;display:block;filter:drop-shadow(0 0 20px rgba(0,255,136,0.3))">`
    : `<div style="font-size:80px;text-align:center;margin-bottom:20px;">${p.image}</div>`;

  body.innerHTML = `
    ${imageHtml}
    <h2>${p.name}</h2>
    <p style="margin: 20px 0; color: var(--text-muted);">${p.description}</p>
    <div class="summary-row"><strong>Price</strong><span>${formatPrice(p.price)} / ${p.unit}</span></div>
    <div class="summary-row"><strong>Stock</strong><span>${p.stock > 0 ? p.stock + ' available' : 'Out of stock'}</span></div>
    <button class="btn btn-primary btn-full" style="margin-top:20px" onclick="addToCart('${p.id}'); closeProductModal();">Add to Cart</button>
  `;
  modal.style.display = "flex";
};

window.openProductModal = function(data) {
  openProductDetail(data.id);
};

window.closeProductModal = function(e) {
  if (e && e.target.id !== "product-modal") return;
  document.getElementById("product-modal").style.display = "none";
};

// -------- AI Insights --------
async function loadAIInsights() {
  if (!authToken) {
    showToast("🔐", "Please login to see your personalized AI Smart Picks.");
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    return;
  }

  showToast("🧠", "Analyzing your preferences...");
  
  try {
    const res = await api("/api/recommendations");
    if (res.success) {
      const { message, products } = res.data;
      
      // Navigate to home if not already there to show the grid
      if (currentPage !== "home") navigateTo("home");
      
      // Update UI to show it's the AI Picks
      document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
      
      // Render special title
      const grid = document.getElementById("product-grid");
      const titleEl = document.querySelector(".produce-section .group-title");
      if (titleEl) {
        titleEl.innerHTML = `<span style="color:var(--accent-purple)">✨ AI Smart Picks</span><br><span style="font-size:14px;color:var(--text-muted);font-weight:normal;">${message}</span>`;
      }
      
      // Render the recommended products
      renderProducts(products);
      
      // Highlight the AI Insights button
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      document.querySelectorAll(".nav-item")[2].classList.add("active");
    }
  } catch (err) {
    console.error("Failed to load AI Insights", err);
    showToast("❌", "Failed to generate insights.");
  }
}
