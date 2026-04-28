/* ===================================================
   Admin Dashboard — Logic
   =================================================== */

const API = "";
let adminToken = "";
let allProducts = [];
let allOrders = [];
let allEmployees = [];

// -------- Auth Check --------
(function checkAdminAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user || (user.role !== "admin" && user.role !== "employee")) {
    window.location.href = "/login.html";
    return;
  }

  adminToken = token;
  document.getElementById("admin-name").textContent = user.name;
  document.querySelector(".admin-avatar").textContent = user.name.charAt(0).toUpperCase();

  const roleText = document.querySelector(".admin-role");
  if (roleText) roleText.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  if (user.role === "admin") {
    document.getElementById("nav-employees").style.display = "flex";
  }

  // Load data
  loadDashboard();
})();

// -------- API Helper --------
async function adminApi(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    ...options,
  });
  return res.json();
}

// -------- Tab Switching --------
function switchAdminTab(tab, el) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));

  document.getElementById(`tab-${tab}`).classList.add("active");
  if (el) el.classList.add("active");

  // Load data for tab
  if (tab === "products") loadProducts();
  if (tab === "orders") loadOrders();
  if (tab === "dashboard") loadDashboard();
  if (tab === "employees") loadEmployees();

  // Close mobile sidebar
  document.getElementById("sidebar").classList.remove("open");
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// -------- Dashboard --------
async function loadDashboard() {
  try {
    const [prodRes, orderRes] = await Promise.all([
      adminApi("/api/products"),
      adminApi("/api/orders/admin/all"),
    ]);

    const products = prodRes.data || [];
    const orders = orderRes.data || [];

    document.getElementById("stat-products").textContent = products.length;
    document.getElementById("stat-orders").textContent = orders.length;

    // Unique customers
    const uniqueCustomers = new Set(orders.map((o) => o.user_id));
    document.getElementById("stat-customers").textContent = uniqueCustomers.size;

    // Revenue
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById("stat-revenue").textContent = `$${revenue.toFixed(2)}`;

    // Recent orders (last 5)
    renderRecentOrders(orders.slice(0, 5));
  } catch (err) {
    console.error("Failed to load dashboard:", err);
  }
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recent-orders-table");
  if (!orders.length) {
    container.innerHTML = `<p class="empty-state">No orders yet</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${orders
          .map(
            (o) => `
          <tr>
            <td><strong>${o.order_number}</strong></td>
            <td>${o.user_name || "N/A"}</td>
            <td>$${o.total.toFixed(2)}</td>
            <td><span class="badge badge-${o.status}">${o.status}</span></td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// -------- Products --------
async function loadProducts() {
  try {
    const res = await adminApi("/api/products");
    allProducts = res.data || [];
    renderProductsTable(allProducts);
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

function renderProductsTable(products) {
  const container = document.getElementById("products-table");
  if (!products.length) {
    container.innerHTML = `<p class="empty-state">No products found</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Price</th>
          <th>Unit</th>
          <th>Stock</th>
          <th>Rating</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td>
              <div class="product-cell">
                <div class="product-preview-admin">
                  ${
                    p.image && p.image.startsWith("/")
                      ? `<img src="${p.image}" alt="${p.name}" style="width: 28px; height: 28px; object-fit: contain; mix-blend-mode: screen; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2))">`
                      : p.image
                  }
                </div>
                <span class="product-cell-name">${p.name}</span>
              </div>
            </td>
            <td>${p.category}</td>
            <td>$${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.unit}</td>
            <td><span class="badge ${p.stock > 0 ? "badge-delivered" : "badge-cancelled"}">${p.stock} units</span></td>
            <td>⭐ ${p.rating || 0}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-sm btn-edit" onclick="editProduct(${p.id})">Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Delete</button>
              </div>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

// -------- Product Modal --------
function openProductModal(product = null) {
  const modal = document.getElementById("product-modal");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("product-form");

  form.reset();
  document.getElementById("prod-edit-id").value = "";

  if (product) {
    title.textContent = "Edit Product";
    document.getElementById("prod-edit-id").value = product.id;
    document.getElementById("prod-name").value = product.name;
    document.getElementById("prod-category").value = product.category;
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-unit").value = product.unit;
    document.getElementById("prod-image").value = product.image || "";
    document.getElementById("prod-stock").value = product.stock || 0;
    document.getElementById("prod-description").value = product.description || "";
  } else {
    title.textContent = "Add Product";
  }

  modal.classList.add("open");
}

function closeProductModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("product-modal").classList.remove("open");
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-save-product");
  btn.disabled = true;

  const editId = document.getElementById("prod-edit-id").value;
  const data = {
    name: document.getElementById("prod-name").value,
    category: document.getElementById("prod-category").value,
    price: parseFloat(document.getElementById("prod-price").value),
    unit: document.getElementById("prod-unit").value,
    image: document.getElementById("prod-image").value || "🥬",
    stock: parseInt(document.getElementById("prod-stock").value) || 0,
    description: document.getElementById("prod-description").value,
  };

  try {
    let res;
    if (editId) {
      res = await adminApi(`/api/products/${editId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } else {
      res = await adminApi("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    if (res.success) {
      showToast("✅", editId ? "Product updated!" : "Product added!");
      closeProductModal();
      loadProducts();
    } else {
      showToast("❌", res.message || "Failed to save product.");
    }
  } catch (err) {
    showToast("❌", "Network error.");
  } finally {
    btn.disabled = false;
  }
}

function editProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (product) openProductModal(product);
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

  try {
    const res = await adminApi(`/api/products/${id}`, { method: "DELETE" });
    if (res.success) {
      showToast("🗑️", "Product deleted!");
      loadProducts();
    } else {
      showToast("❌", res.message || "Failed to delete.");
    }
  } catch (err) {
    showToast("❌", "Network error.");
  }
}

// -------- Orders --------
async function loadOrders() {
  try {
    const res = await adminApi("/api/orders/admin/all");
    allOrders = res.data || [];
    renderOrdersTable(allOrders);
  } catch (err) {
    console.error("Failed to load orders:", err);
  }
}

function filterOrders() {
  const status = document.getElementById("order-status-filter").value;
  const filtered = status === "all" ? allOrders : allOrders.filter((o) => o.status === status);
  renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
  const container = document.getElementById("orders-table");
  if (!orders.length) {
    container.innerHTML = `<p class="empty-state">No orders found</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders
          .map(
            (o) => `
          <tr>
            <td><strong>${o.order_number}</strong></td>
            <td>
              <div>${o.user_name || "N/A"}</div>
              <div style="font-size:11px;color:var(--text-muted)">${o.user_email || ""}</div>
            </td>
            <td>${(o.items || []).length} items</td>
            <td>$${o.total.toFixed(2)}</td>
            <td><span class="badge badge-${o.status}">${o.status}</span></td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td>
              <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)" id="status-${o.id}">
                <option value="pending" ${o.status === "pending" ? "selected" : ""}>Pending</option>
                <option value="confirmed" ${o.status === "confirmed" ? "selected" : ""}>Confirmed</option>
                <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
                <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
              </select>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await adminApi(`/api/orders/admin/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      showToast("✅", `Order status updated to ${status}`);
      loadOrders();
    } else {
      showToast("❌", res.message || "Failed to update.");
    }
  } catch (err) {
    showToast("❌", "Network error.");
  }
}

// -------- Logout --------
function adminLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

// -------- Toast --------
function showToast(icon, message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// -------- Employees --------
async function loadEmployees() {
  try {
    const res = await adminApi("/api/auth/employees");
    allEmployees = res.data || [];
    renderEmployeesTable(allEmployees);
  } catch (err) {
    console.error("Failed to load employees:", err);
  }
}

function renderEmployeesTable(employees) {
  const container = document.getElementById("employees-table");
  if (!employees.length) {
    container.innerHTML = `<p class="empty-state">No employees found.</p>`;
    return;
  }
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email Address</th>
          <th>Role</th>
          <th>Hired Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${employees
          .map(
            (e) => `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="admin-avatar" style="width: 32px; height: 32px; font-size: 14px;">${e.name.charAt(0).toUpperCase()}</div>
                <strong>${e.name}</strong>
              </div>
            </td>
            <td>${e.email}</td>
            <td><span class="badge badge-success">${e.role}</span></td>
            <td>${new Date(e.created_at).toLocaleDateString()}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-sm btn-delete" onclick="terminateEmployee(${e.id}, '${e.name.replace(/'/g, "\\'")}')">Terminate</button>
              </div>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function terminateEmployee(id, name) {
  if (!confirm(`Are you sure you want to terminate "${name}"? This will revoke their access.`)) return;

  try {
    const res = await adminApi(`/api/auth/employee/${id}`, { method: "DELETE" });
    if (res.success) {
      showToast("🗑️", "Employee terminated.");
      loadEmployees();
    } else {
      showToast("❌", res.message || "Failed to terminate employee.");
    }
  } catch (err) {
    showToast("❌", "Network error.");
  }
}

function openEmployeeModal() {
  document.getElementById("employee-form").reset();
  document.getElementById("employee-modal").classList.add("open");
}

function closeEmployeeModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("employee-modal").classList.remove("open");
}

async function saveEmployee(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-save-employee");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `Registering...`;

  const name = document.getElementById("emp-name").value;
  const email = document.getElementById("emp-email").value;
  const password = document.getElementById("emp-password").value;

  try {
    const res = await fetch(`${API}/api/auth/register-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (data.success) {
      showToast("✅", "Employee successfully registered!");
      closeEmployeeModal();
      loadEmployees();
    } else {
      showToast("❌", data.message || "Failed to register employee.");
    }
  } catch (err) {
    showToast("❌", "Network error.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

