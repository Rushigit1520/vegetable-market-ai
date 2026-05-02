/* ===================================================
   Vegetable Market AI Premium — Admin Logic
   =================================================== */

const API = "";
let authToken = localStorage.getItem("token") || "";
let adminUser = JSON.parse(localStorage.getItem("user") || "null");

document.addEventListener("DOMContentLoaded", () => {
  if (!authToken || !adminUser || (adminUser.role !== "admin" && adminUser.role !== "employee")) {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("admin-name").textContent = adminUser.name;
  document.querySelector(".admin-role").textContent = adminUser.role.toUpperCase();
  document.querySelector(".admin-avatar").textContent = adminUser.name.charAt(0).toUpperCase();

  if (adminUser.role === "admin") {
    document.getElementById("nav-employees").style.display = "flex";
  }

  loadDashboard();
});

// -------- Core --------
async function api(path, options = {}) {
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API}${path}`, { headers, ...options });
  if (res.status === 401) adminLogout();
  return res.json();
}

function adminLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

function switchAdminTab(tabName, el) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  if (el) el.classList.add("active");
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`tab-${tabName}`).classList.add("active");

  if (window.innerWidth <= 1024) toggleSidebar();

  if (tabName === "dashboard") loadDashboard();
  if (tabName === "products") loadProducts();
  if (tabName === "orders") loadOrders();
  if (tabName === "coupons") loadCoupons();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function formatPrice(price) {
  return "₹" + parseFloat(price).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function showToast(icon, msg) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// -------- Dashboard --------
async function loadDashboard() {
  try {
    const productsRes = await api("/api/products");
    const ordersRes = await api("/api/orders/admin/all");

    if (productsRes.success) {
      document.getElementById("stat-products").textContent = productsRes.data.length;
    }

    if (ordersRes.success) {
      const orders = ordersRes.data;
      document.getElementById("stat-orders").textContent = orders.length;
      
      const revenue = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + parseFloat(o.total), 0);
      document.getElementById("stat-revenue").textContent = formatPrice(revenue);
      
      // Distinct customers count estimation from orders
      const users = new Set(orders.map(o => o.user_id));
      document.getElementById("stat-customers").textContent = users.size;

      renderRecentOrders(orders.slice(0, 5));
    }
  } catch (e) {
    console.error(e);
  }
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recent-orders-table");
  if (orders.length === 0) {
    container.innerHTML = "<p class='empty-state'>No recent orders</p>";
    return;
  }

  container.innerHTML = `
    <table>
      <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td><strong>#${o.order_number}</strong></td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td>User #${o.user_id}</td>
            <td>${formatPrice(o.total)}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// -------- Products --------
let editingProductId = null;

async function loadProducts() {
  try {
    const res = await api("/api/products");
    if (res.success) {
      const container = document.getElementById("products-table");
      if (res.data.length === 0) {
        container.innerHTML = "<p class='empty-state'>No products found</p>";
        return;
      }

      container.innerHTML = `
        <table>
          <thead>
            <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Deals</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${res.data.map(p => {
              const imgHtml = p.image.startsWith("/") 
                ? `<img src="${p.image}" style="width:40px; height:40px; object-fit:contain; border-radius:8px; background:rgba(255,255,255,0.05)">`
                : `<div style="font-size:24px">${p.image}</div>`;
              
              const badges = [];
              if (p.is_deal) badges.push('<span class="status-badge status-pending" style="font-size:10px">Deal</span>');
              if (p.is_featured) badges.push('<span class="status-badge status-confirmed" style="font-size:10px">Featured</span>');

              return `
              <tr>
                <td>${imgHtml}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>
                  ${p.original_price ? `<strike style="color:var(--text-muted);font-size:12px">${formatPrice(p.original_price)}</strike><br>` : ''}
                  ${formatPrice(p.price)}/${p.unit}
                </td>
                <td>${p.stock}</td>
                <td>${badges.join(' ')}</td>
                <td>
                  <button class="action-btn" onclick="editProduct(${p.id})">✏️</button>
                  <button class="action-btn delete" onclick="deleteProduct(${p.id})">🗑️</button>
                </td>
              </tr>
            `}).join("")}
          </tbody>
        </table>
      `;
    }
  } catch (e) {
    console.error(e);
  }
}

function openProductModal() {
  editingProductId = null;
  document.getElementById("modal-title").textContent = "Add Product";
  document.getElementById("product-form").reset();
  document.getElementById("image-upload-preview").style.display = "none";
  document.getElementById("product-modal").classList.add("active");
}

function closeProductModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("product-modal").classList.remove("active");
}

async function editProduct(id) {
  try {
    const res = await api(`/api/products/${id}`);
    if (res.success) {
      const p = res.data;
      editingProductId = p.id;
      document.getElementById("modal-title").textContent = "Edit Product";
      document.getElementById("prod-name").value = p.name;
      document.getElementById("prod-category").value = p.category;
      document.getElementById("prod-price").value = p.price;
      document.getElementById("prod-original-price").value = p.original_price || "";
      document.getElementById("prod-unit").value = p.unit;
      document.getElementById("prod-stock").value = p.stock;
      document.getElementById("prod-image").value = p.image;
      document.getElementById("prod-is-deal").checked = p.is_deal;
      document.getElementById("prod-is-featured").checked = p.is_featured;
      
      const preview = document.getElementById("image-upload-preview");
      if (p.image.startsWith("/")) {
        preview.innerHTML = `<img src="${p.image}" style="width:100px; border-radius:8px;">`;
        preview.style.display = "block";
      } else {
        preview.style.display = "none";
      }

      document.getElementById("product-modal").classList.add("active");
    }
  } catch (e) {
    console.error(e);
  }
}

// Upload Image Handler
document.getElementById("prod-image-upload").addEventListener("change", async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const btn = document.getElementById("btn-save-product");
    btn.disabled = true;
    btn.textContent = "Uploading...";

    const res = await api("/api/uploads/product-image", {
      method: "POST",
      body: formData
    });

    if (res.success) {
      document.getElementById("prod-image").value = res.url;
      const preview = document.getElementById("image-upload-preview");
      preview.innerHTML = `<img src="${res.url}" style="width:100px; border-radius:8px; border:1px solid var(--border)">`;
      preview.style.display = "block";
      showToast("✅", "Image uploaded!");
    } else {
      showToast("❌", res.message || "Upload failed");
    }
  } catch (err) {
    console.error(err);
    showToast("❌", "Upload error");
  } finally {
    const btn = document.getElementById("btn-save-product");
    btn.disabled = false;
    btn.textContent = "Save Product";
  }
});

async function saveProduct(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById("prod-name").value,
    category: document.getElementById("prod-category").value,
    price: parseFloat(document.getElementById("prod-price").value),
    original_price: document.getElementById("prod-original-price").value ? parseFloat(document.getElementById("prod-original-price").value) : null,
    unit: document.getElementById("prod-unit").value,
    stock: parseInt(document.getElementById("prod-stock").value),
    image: document.getElementById("prod-image").value || "📦",
    is_deal: document.getElementById("prod-is-deal").checked,
    is_featured: document.getElementById("prod-is-featured").checked
  };

  try {
    let res;
    if (editingProductId) {
      res = await api(`/api/products/${editingProductId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      res = await api("/api/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    if (res.success) {
      showToast("✅", editingProductId ? "Product updated" : "Product added");
      closeProductModal();
      loadProducts();
    } else {
      showToast("❌", res.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    const res = await api(`/api/products/${id}`, { method: "DELETE" });
    if (res.success) {
      showToast("✅", "Product deleted");
      loadProducts();
    }
  } catch (e) {
    console.error(e);
  }
}

// -------- Orders --------
let allOrders = [];

async function loadOrders() {
  try {
    const res = await api("/api/orders/admin/all");
    if (res.success) {
      allOrders = res.data;
      filterOrders();
    }
  } catch (e) {
    console.error(e);
  }
}

function filterOrders() {
  const status = document.getElementById("order-status-filter").value;
  const filtered = status === "all" ? allOrders : allOrders.filter(o => o.status === status);
  
  const container = document.getElementById("orders-table");
  if (filtered.length === 0) {
    container.innerHTML = "<p class='empty-state'>No orders found</p>";
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr><th>Order ID</th><th>Date</th><th>Customer Info</th><th>Total</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${filtered.map(o => `
          <tr>
            <td><strong>#${o.order_number}</strong></td>
            <td>${new Date(o.created_at).toLocaleString()}</td>
            <td>
              <div><strong>User #${o.user_id}</strong></div>
              <div style="font-size:12px;color:var(--text-muted)">${o.delivery_address.substring(0, 30)}...</div>
            </td>
            <td><strong>${formatPrice(o.total)}</strong></td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td>
              <select style="background:var(--bg-card);color:#fff;border:1px solid var(--border);border-radius:4px;padding:4px" 
                      onchange="updateOrderStatus(${o.id}, this.value)">
                <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function updateOrderStatus(id, status) {
  try {
    const res = await api(`/api/orders/admin/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    if (res.success) {
      showToast("✅", "Order status updated");
      loadOrders();
      loadDashboard();
    }
  } catch (e) {
    console.error(e);
  }
}

// -------- Coupons --------
async function loadCoupons() {
  try {
    const res = await api("/api/coupons/admin/all");
    if (res.success) {
      const container = document.getElementById("coupons-table");
      if (res.data.length === 0) {
        container.innerHTML = "<p class='empty-state'>No coupons found</p>";
        return;
      }

      container.innerHTML = `
        <table>
          <thead>
            <tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${res.data.map(c => `
              <tr>
                <td><strong style="color:var(--primary); background:rgba(0,255,136,0.1); padding:4px 8px; border-radius:4px; font-family:monospace">${c.code}</strong></td>
                <td>${c.discount_type === 'percentage' ? c.discount_value + '%' : formatPrice(c.discount_value)}</td>
                <td>${formatPrice(c.min_order)}</td>
                <td>
                  ${c.is_active ? '<span class="status-badge status-delivered">Active</span>' : '<span class="status-badge status-cancelled">Inactive</span>'}
                </td>
                <td>
                  <button class="action-btn delete" onclick="deleteCoupon(${c.id})">🗑️</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }
  } catch (e) {
    console.error(e);
  }
}

function openCouponModal() {
  document.getElementById("coupon-form").reset();
  document.getElementById("coupon-modal").classList.add("active");
}

function closeCouponModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("coupon-modal").classList.remove("active");
}

async function saveCoupon(e) {
  e.preventDefault();
  const payload = {
    code: document.getElementById("coup-code").value.toUpperCase(),
    description: document.getElementById("coup-desc").value,
    discount_type: document.getElementById("coup-type").value,
    discount_value: parseFloat(document.getElementById("coup-value").value),
    min_order: parseFloat(document.getElementById("coup-min").value || 0),
    max_discount: document.getElementById("coup-max").value ? parseFloat(document.getElementById("coup-max").value) : null
  };

  try {
    const res = await api("/api/coupons", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast("✅", "Coupon created!");
      closeCouponModal();
      loadCoupons();
    } else {
      showToast("❌", res.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function deleteCoupon(id) {
  if (!confirm("Delete this coupon?")) return;
  try {
    const res = await api(`/api/coupons/${id}`, { method: "DELETE" });
    if (res.success) {
      showToast("✅", "Coupon deleted");
      loadCoupons();
    }
  } catch (e) {
    console.error(e);
  }
}
