/* ===================================================
   FreshCart — Application Logic
   =================================================== */

const API = "";

// -------- State --------
let currentPage = "home";
let products = [];
let categories = [];
let activeCategory = "All";

// -------- Init --------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCart();
  setupSearch();
  setupScroll();
  setupPaymentToggle();
  setupFooterDate();
});

// -------- API Helpers --------
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// -------- Navigation --------
function navigateTo(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add("active");
    currentPage = page;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Refresh page data
  if (page === "cart") renderCart();
  if (page === "checkout") renderCheckoutSummary();
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
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-secondary)">
      <div style="font-size:48px;margin-bottom:12px">🔍</div>
      <p>No products found</p>
    </div>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (p) => `
    <div class="product-card" id="card-${p.id}">
      <div class="product-card-image">${p.image}</div>
      <div class="product-card-body">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-description">${p.description}</div>
        <div class="product-rating">
          <span class="stars">${getStars(p.rating)}</span>
          <span class="rating-text">${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div>
            <span class="product-price">$${p.price.toFixed(2)}</span>
            <span class="product-unit">/${p.unit}</span>
          </div>
          <button class="btn-add-cart" id="add-btn-${p.id}" onclick="addToCart('${p.id}')" aria-label="Add ${p.name} to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - half);
}

// -------- Cart --------
async function addToCart(productId) {
  try {
    await api("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    // Button animation
    const btn = document.getElementById(`add-btn-${productId}`);
    if (btn) {
      btn.classList.add("added");
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
      }, 1200);
    }

    await loadCart();
    showToast("✅", `Added to cart!`);
  } catch (err) {
    showToast("❌", "Failed to add item");
  }
}

async function loadCart() {
  try {
    const res = await api("/api/cart");
    const { itemCount } = res.data;
    const badge = document.getElementById("cart-badge");
    badge.textContent = itemCount;
    badge.classList.add("bump");
    setTimeout(() => badge.classList.remove("bump"), 400);
  } catch (err) {
    console.error("Failed to load cart", err);
  }
}

async function renderCart() {
  try {
    const res = await api("/api/cart");
    const { items, total, itemCount } = res.data;

    const cartEmpty = document.getElementById("cart-empty");
    const cartItems = document.getElementById("cart-items");
    const cartSummary = document.getElementById("cart-summary");

    if (!items.length) {
      cartEmpty.style.display = "block";
      cartItems.style.display = "none";
      cartSummary.style.display = "none";
      return;
    }

    cartEmpty.style.display = "none";
    cartItems.style.display = "block";
    cartSummary.style.display = "block";

    cartItems.innerHTML = items
      .map(
        (item) => `
      <div class="cart-item">
        <div class="cart-item-image">${item.product.image}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product.name}</div>
          <div class="cart-item-price">$${item.product.price.toFixed(2)} / ${item.product.unit}</div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateQty('${item.productId}', ${item.quantity - 1})">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty('${item.productId}', ${item.quantity + 1})">+</button>
          </div>
          <div class="cart-item-subtotal">$${(item.product.price * item.quantity).toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="btn-remove" onclick="removeFromCart('${item.productId}')" aria-label="Remove item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    const delivery = total > 35 ? 0 : 4.99;
    const finalTotal = total + delivery;

    cartSummary.innerHTML = `
      <h3 class="summary-title">Order Summary</h3>
      <div class="summary-row">
        <span>Subtotal (${itemCount} items)</span>
        <span>$${total.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Delivery</span>
        <span class="${delivery === 0 ? "free" : ""}">${delivery === 0 ? "FREE" : "$" + delivery.toFixed(2)}</span>
      </div>
      ${delivery > 0 ? `<div style="font-size:12px;color:var(--green-600);margin-top:4px">Free delivery on orders over $35</div>` : ""}
      <div class="summary-row total">
        <span>Total</span>
        <span>$${finalTotal.toFixed(2)}</span>
      </div>
      <button class="btn btn-primary btn-lg btn-full" style="margin-top:24px" onclick="navigateTo('checkout')">
        Proceed to Checkout
      </button>
    `;
  } catch (err) {
    console.error("Failed to render cart", err);
  }
}

async function updateQty(productId, qty) {
  try {
    await api(`/api/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: qty }),
    });
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
    showToast("🗑️", "Item removed from cart");
  } catch (err) {
    showToast("❌", "Failed to remove item");
  }
}

// -------- Checkout --------
async function renderCheckoutSummary() {
  try {
    const res = await api("/api/cart");
    const { items, total, itemCount } = res.data;
    const delivery = total > 35 ? 0 : 4.99;
    const finalTotal = total + delivery;

    const container = document.getElementById("checkout-summary");
    container.innerHTML = `
      <h3 class="summary-title">Your Order</h3>
      ${items
        .map(
          (item) => `
        <div class="summary-row">
          <span>${item.product.image} ${item.product.name} × ${item.quantity}</span>
          <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
        </div>
      `
        )
        .join("")}
      <div class="summary-row" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)">
        <span>Subtotal</span>
        <span>$${total.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Delivery</span>
        <span class="${delivery === 0 ? "free" : ""}">${delivery === 0 ? "FREE" : "$" + delivery.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span>$${finalTotal.toFixed(2)}</span>
      </div>
    `;
  } catch (err) {
    console.error("Failed to render checkout summary", err);
  }
}

async function placeOrder(e) {
  e.preventDefault();

  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Placing Order...`;

  const customer = {
    name: document.getElementById("customer-name").value,
    email: document.getElementById("customer-email").value,
    phone: document.getElementById("customer-phone").value,
    address: document.getElementById("customer-address").value,
  };

  try {
    const res = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({ customer }),
    });

    if (!res.success) {
      showToast("❌", res.message || "Failed to place order");
      btn.disabled = false;
      btn.innerHTML = `Place Order`;
      return;
    }

    const order = res.data;
    await loadCart();
    renderConfirmation(order);
    navigateTo("confirmation");

    // Reset form
    document.getElementById("checkout-form").reset();
  } catch (err) {
    showToast("❌", "Something went wrong");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Place Order`;
  }
}

function renderConfirmation(order) {
  const card = document.getElementById("confirmation-card");
  card.innerHTML = `
    <div class="confirm-icon">✅</div>
    <h2 class="confirm-title">Order Placed!</h2>
    <p class="confirm-subtitle">Thank you, ${order.customer.name}! Your groceries are on the way.</p>
    <div class="confirm-order-id">
      📦 Order: <strong>${order.orderNumber}</strong>
    </div>
    <div class="confirm-items">
      <h4>Items Ordered</h4>
      ${order.items
        .map(
          (item) => `
        <div class="confirm-item-row">
          <span>${item.name} × ${item.quantity}</span>
          <span>$${item.subtotal.toFixed(2)}</span>
        </div>
      `
        )
        .join("")}
      <div class="confirm-total">
        <span>Total Paid</span>
        <span>$${order.total.toFixed(2)}</span>
      </div>
    </div>
    <button class="btn btn-primary btn-lg" onclick="navigateTo('home')">Continue Shopping</button>
  `;
}

// -------- Search --------
function setupSearch() {
  const input = document.getElementById("search-input");
  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) {
        filterCategory(activeCategory, document.querySelector(`.cat-chip[data-category="${activeCategory}"]`));
        return;
      }
      try {
        const res = await api(`/api/products?search=${encodeURIComponent(q)}`);
        renderProducts(res.data);

        // Make sure we're on home page
        if (currentPage !== "home") navigateTo("home");
        document.getElementById("products-section").scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        console.error("Search failed", err);
      }
    }, 300);
  });
}

// -------- Scroll Effects --------
function setupScroll() {
  window.addEventListener("scroll", () => {
    const header = document.getElementById("main-header");
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

// -------- Payment Toggle --------
function setupPaymentToggle() {
  document.addEventListener("change", (e) => {
    if (e.target.name === "payment") {
      document.querySelectorAll(".payment-option").forEach((opt) => opt.classList.remove("selected"));
      e.target.closest(".payment-option").classList.add("selected");
    }
  });
}

// -------- Toast Notifications --------
function showToast(icon, message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// -------- Footer Date --------
function setupFooterDate() {
  const el = document.getElementById("date-time");
  if (!el) return;
  const update = () => {
    el.textContent = new Date().toLocaleString();
  };
  update();
  setInterval(update, 1000);
}
