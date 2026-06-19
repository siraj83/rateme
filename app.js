// --- 1. INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {

  const userData =
    localStorage.getItem('user');

  if (!userData) {

    window.location.href =
      '/login.html';

    return;
  }

  const user =
    JSON.parse(userData);

  console.log(
    'Logged User:',
    user
  );

  document.getElementById('welcomeMsg').innerText =
    `مرحبًا بك، ${user.restaurant_name} 👋`;

  await loadRestaurant();
  await loadProducts();

});

// --- 4. PRODUCTS LOGIC ---
let allProducts = [];
let editingProductId = null;

async function loadProducts() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/products', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showToast('فشل تحميل المنتجات', 'error');
      return;
    }

    allProducts = data.products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      ingredients: p.ingredients,
      image: p.image_url,
      reviews: []
    }));

    renderTable();

  } catch (error) {
    console.error(error);
    showToast('خطأ في تحميل المنتجات', 'error');
  }
}

async function loadRestaurant() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/restaurant/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showToast('فشل تحميل بيانات المطعم', 'error');
      return;
    }

    const restaurant = data.restaurant;

    if (document.getElementById('restaurantName')) {
      document.getElementById('restaurantName').value = restaurant.name || '';
    }

    if (document.getElementById('restaurantDesc')) {
      document.getElementById('restaurantDesc').value = restaurant.description || '';
    }

    if (document.getElementById('restaurantLocation')) {
      document.getElementById('restaurantLocation').value = restaurant.address || '';
    }

    if (document.getElementById('restaurantGoogleMapsUrl')) {
      document.getElementById('restaurantGoogleMapsUrl').value =
        restaurant.google_maps_url || '';
    }

    if (document.getElementById('restaurantLogo')) {
      document.getElementById('restaurantLogo').value = restaurant.logo_url || '';
    }

    if (document.getElementById('welcomeMsg')) {
      document.getElementById('welcomeMsg').innerText =
        `مرحبًا بك، ${restaurant.name} 👋`;
    }

  } catch (error) {
    console.error(error);
    showToast('خطأ في تحميل بيانات المطعم', 'error');
  }
}

function renderTable() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';

  allProducts.forEach(prod => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${prod.image || 'https://via.placeholder.com/50'}" alt="طبق"></td>
      <td>${prod.name}</td>
      <td>${prod.price}$</td>
      <td>${prod.ingredients}</td>
      <td class="actions">
      <button class="edit-btn" onclick="openEditModal('${prod.id}')">
        تعديل
      </button>

      <button class="delete-btn" onclick="deleteProduct('${prod.id}')">
        حذف
      </button>

      <button
        class="btn"
        onclick="showReviews('${prod.id}')"
        style="margin-top:5px;"
      >
        التقييمات
      </button>
    </td>`;
    tbody.appendChild(row);
  });
}

window.showReviews = async (productId) => {

  try {

    const token =
      localStorage.getItem('token');

    const res = await fetch(
      `/api/products/${productId}/reviews`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const data =
      await res.json();

    if (!data.success) {

      showToast(
        'فشل تحميل التقييمات',
        'error'
      );

      return;
    }

    const container =
      document.getElementById(
        'reviewsContainer'
      );

    if (
      data.reviews.length === 0
    ) {

      container.innerHTML = `
                <p style="text-align:center">
                    لا توجد تقييمات
                </p>
            `;

    } else {

      container.innerHTML =
        data.reviews.map(r => `
                    <div
                        class="card"
                        style="margin-bottom:10px;"
                    >

                        <strong>
                            ${r.customer_name || 'مستخدم'}
                        </strong>

                        <div style="margin-top:5px;">
                            🍽 الطعم:
                            ${r.taste_rating}/5
                        </div>

                        <div>
                            🎨 الشكل:
                            ${r.presentation_rating}/5
                        </div>

                        <div>
                            💰 السعر:
                            ${r.price_rating}/5
                        </div>

                        <p style="margin-top:10px;">
                            ${r.comment || ''}
                        </p>

                        <small>
                            ${new Date(r.created_at)
            .toLocaleString()}
                        </small>

                    </div>
                `).join('');
    }

    const modal = document.getElementById('reviewsModal');

    modal.style.display = 'flex';

    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

  } catch (error) {

    console.error(error);

    showToast(
      'خطأ في تحميل التقييمات',
      'error'
    );
  }
};

window.closeReviewsModal = function () {
  const modal = document.getElementById('reviewsModal');

  modal.classList.remove('show');

  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
};

// --- 6. EVENT LISTENERS (UI) ---

// Sidebar
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const menuToggle = document.getElementById('menuToggle');

function toggleSidebar() {
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

menuToggle.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = '/login.html';
});

// Modals
const modal = document.getElementById('productModal');
const closeBtn = document.getElementById('closeModal');

function openModal() { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('show'), 10); }
function closeModal() { modal.classList.remove('show'); setTimeout(() => modal.style.display = 'none', 300); }

document.getElementById('addProductBtn').addEventListener('click', () => {
  document.getElementById('productForm').reset();
  editingProductId = null;
  document.getElementById('modalTitle').innerText = 'إضافة منتج جديد';
  openModal();
});

closeBtn.addEventListener('click', closeModal);

window.openEditModal = (id) => {
  const prod = allProducts.find(p => p.id === id);
  if (!prod) return;
  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodPrice').value = prod.price;
  document.getElementById('prodIngredients').value = prod.ingredients;
  document.getElementById('prodImage').value = prod.image;
  editingProductId = id;
  document.getElementById('modalTitle').innerText = 'تعديل المنتج';
  openModal();
};

// Delete Confirmation
const confirmModal = document.getElementById('confirmModal');
document.getElementById('cancelDelete').addEventListener('click', () => {
  confirmModal.classList.remove('show'); setTimeout(() => confirmModal.style.display = 'none', 300);
});
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  // Logic handled in window.deleteProduct
});

window.deleteProduct = (id) => {
  confirmModal.style.display = 'flex';
  setTimeout(() => confirmModal.classList.add('show'), 10);

  document.getElementById('confirmDeleteBtn').onclick = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        showToast('فشل حذف المنتج', 'error');
        return;
      }

      await loadProducts();
      showToast('تم حذف المنتج', 'success');

    } catch (error) {
      console.error(error);
      showToast('خطأ في حذف المنتج', 'error');
    }

    confirmModal.classList.remove('show');
    setTimeout(() => confirmModal.style.display = 'none', 300);
  };
};

// Forms
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');

  const newProd = {
    name: document.getElementById('prodName').value,
    price: document.getElementById('prodPrice').value,
    ingredients: document.getElementById('prodIngredients').value,
    image_url: document.getElementById('prodImage').value || null
  };

  try {
    if (editingProductId) {
      await fetch(`/api/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProd)
      });

      showToast('تم تعديل المنتج', 'success');
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProd)
      });

      showToast('تمت إضافة المنتج', 'success');
    }

    await loadProducts();
    closeModal();

  } catch (error) {
    console.error(error);
    showToast('خطأ في حفظ المنتج', 'error');
  }
});

document.getElementById('saveRestaurantBtn').addEventListener('click', async () => {
  try {
    const token = localStorage.getItem('token');

    const payload = {
      name: document.getElementById('restaurantName').value,
      description: document.getElementById('restaurantDesc').value,
      address: document.getElementById('restaurantLocation').value,
      google_maps_url: document.getElementById('restaurantGoogleMapsUrl').value || null,
      logo_url: document.getElementById('restaurantLogo').value || null,
      phone: null
    };

    payload.slug = payload.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

    const res = await fetch('/api/restaurant/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      showToast('فشل حفظ بيانات المطعم', 'error');
      return;
    }

    localStorage.setItem('user', JSON.stringify({
      ...JSON.parse(localStorage.getItem('user')),
      restaurant_name: data.restaurant.name,
      slug: data.restaurant.slug,
      logo_url: data.restaurant.logo_url
    }));

    document.getElementById('welcomeMsg').innerText =
      `مرحبًا بك، ${data.restaurant.name} 👋`;

    showToast('تم حفظ بيانات المطعم', 'success');

  } catch (error) {
    console.error(error);
    showToast('خطأ في حفظ بيانات المطعم', 'error');
  }
});

// Toasts
function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✔' : 'ℹ'} ${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.addEventListener('transitionend', () => toast.remove()); }, 3000);
}