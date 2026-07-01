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
  await loadSubscriptionInfo();
  await loadProducts();
  await loadDashboardStats();
  await loadBranchStats();
  await loadBranches();

});

async function loadSubscriptionInfo() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/subscription', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    const container = document.getElementById('subscriptionInfo');
    if (!container) return;

    if (!data.success) {
      container.innerHTML = data.message || 'تعذر تحميل بيانات الاشتراك';
      return;
    }

    const sub = data.subscription;

    const productsLimit =
      sub.max_products === null
        ? 'غير محدود'
        : `${sub.products_count} / ${sub.max_products}`;

    const branchesLimit =
      sub.max_branches === null
        ? 'غير محدود'
        : `${sub.branches_count} / ${sub.max_branches}`;

    container.innerHTML = `
      <div class="subscription-box">
        <div><strong>📦 الباقة:</strong> ${sub.plan_name}</div>
        <div><strong>🍽 المنتجات:</strong> ${productsLimit}</div>
        <div><strong>📍 الفروع:</strong> ${branchesLimit}</div>
        <div><strong>الحالة:</strong> ${sub.status}</div>
      </div>
    `;

  } catch (error) {
    console.error(error);
  }
}

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
      image: p.image_url,
      avg_rating: p.avg_rating,
      avg_taste: p.avg_taste,
      avg_presentation: p.avg_presentation,
      avg_price: p.avg_price,
      total_reviews: p.total_reviews,
      is_visible: p.is_visible
    }));

    renderTable();

    console.log(data.products);

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

    const logoPreview = document.getElementById('restaurantLogoPreview');

    if (logoPreview) {
      if (restaurant.logo_url) {
        logoPreview.src = restaurant.logo_url;
        logoPreview.style.display = 'block';
      } else {
        logoPreview.style.display = 'none';
      }
    }

    generateRestaurantQR(restaurant.slug);

  } catch (error) {
    console.error(error);
    showToast('خطأ في تحميل بيانات المطعم', 'error');
  }
}

// loadDashboardStats

async function loadDashboardStats() {

  try {

    const token =
      localStorage.getItem('token');

    const res = await fetch(
      '/api/dashboard/stats',
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const data =
      await res.json();

    if (!data.success) return;

    document.getElementById(
      'totalProducts'
    ).innerText =
      data.stats.total_products || 0;

    document.getElementById(
      'totalReviews'
    ).innerText =
      data.stats.total_reviews || 0;

    document.getElementById(
      'avgRating'
    ).innerText =
      data.stats.avg_rating || 0;

    document.getElementById(
      'bestProduct'
    ).innerText =
      data.bestProduct
        ? data.bestProduct.name
        : '-';

  } catch (error) {

    console.error(error);

  }
}

let ratingsChart = null;

async function loadDashboardStats() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) return;

    const stats = data.stats;

    document.getElementById('totalProducts').innerText =
      stats.total_products || 0;

    document.getElementById('totalReviews').innerText =
      stats.total_reviews || 0;

    document.getElementById('avgRating').innerText =
      stats.avg_rating ? `${stats.avg_rating} ⭐` : '0';

    document.getElementById('bestProduct').innerText =
      data.bestProduct
        ? `${data.bestProduct.name}`
        : '-';

    renderRatingsChart({
      taste: Number(stats.avg_taste || 0),
      presentation: Number(stats.avg_presentation || 0),
      price: Number(stats.avg_price || 0),
      overall: Number(stats.avg_rating || 0)
    });

  } catch (error) {
    console.error(error);
  }
}

function renderRatingsChart(values) {
  const canvas = document.getElementById('ratingsChart');

  if (!canvas) return;

  if (ratingsChart) {
    ratingsChart.destroy();
  }

  ratingsChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['الطعم', 'الشكل', 'السعر', 'المتوسط العام'],
      datasets: [{
        label: 'متوسط التقييم',
        data: [
          values.taste,
          values.presentation,
          values.price,
          values.overall
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 5
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// QR
function generateRestaurantQR(slug) {
  const link = `${window.location.origin}/review.html?slug=${slug}`;

  window.currentReviewLink = link;

  const linkInput = document.getElementById('publicReviewLink');
  if (linkInput) {
    linkInput.value = link;
  }

  const qrCanvas = document.getElementById('qrCanvas');
  if (qrCanvas && typeof QRCode !== 'undefined') {
    QRCode.toCanvas(qrCanvas, link, {
      width: 220
    });
  }
}

document.getElementById('copyReviewLinkBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(window.currentReviewLink);

  showToast('تم نسخ الرابط', 'success');
});

document.getElementById('downloadQrBtn').addEventListener('click', () => {
  const canvas = document.getElementById('qrCanvas');
  const link = document.createElement('a');

  link.download = 'rateme-qr.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function renderTable() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';

  allProducts.forEach(prod => {
    const row = document.createElement('tr');
    let performanceBadge = '';

    if ((prod.total_reviews || 0) === 0) {
      performanceBadge = '<span class="badge neutral">لا توجد تقييمات</span>';
    } else if (Number(prod.avg_rating) >= 4.5) {
      performanceBadge = '<span class="badge good">🏆 ممتاز</span>';
    } else if (Number(prod.avg_rating) >= 3.5) {
      performanceBadge = '<span class="badge ok">جيد</span>';
    } else {
      performanceBadge = '<span class="badge bad">⚠ يحتاج تحسين</span>';
    }
    row.innerHTML = `
      <td><img src="${prod.image || 'https://via.placeholder.com/50'}" alt="طبق"></td>
      <td>${prod.name}<br>${performanceBadge}</td>
      <td>${prod.price} د.ل</td>
      <td>
        ⭐ ${prod.avg_rating || '0.0'}
        <br>
        <small>${prod.total_reviews || 0} تقييم</small>
      </td>
      <td>
        🍽 ${prod.avg_taste || '-'} |
        🎨 ${prod.avg_presentation || '-'} |
        💰 ${prod.avg_price || '-'}
      </td>
      <td>
             ${prod.is_visible
        ? '<span class="status-badge visible">🟢 ظاهر</span>'
        : '<span class="status-badge hidden">⚫ مخفي</span>'
      }</td>
      <td class="actions">
        <button class="edit-btn" onclick="openEditModal('${prod.id}')">تعديل</button>
        <button class="delete-btn" onclick="deleteProduct('${prod.id}')">حذف</button>
        <button class="btn" onclick="showReviews('${prod.id}')" style="margin-top:5px;">التقييمات</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  renderProductsMobile();
}

function renderProductsMobile() {
  const container = document.getElementById('productsMobileList');
  if (!container) return;

  container.innerHTML = '';

  if (!allProducts.length) {
    container.innerHTML = `
      <div class="mobile-product-card">
        لا توجد منتجات حالياً
      </div>
    `;
    return;
  }

  allProducts.forEach(prod => {
    let performanceBadge = '';

    if ((prod.total_reviews || 0) === 0) {
      performanceBadge = '<span class="badge neutral">لا توجد تقييمات</span>';
    } else if (Number(prod.avg_rating) >= 4.5) {
      performanceBadge = '<span class="badge good">🏆 ممتاز</span>';
    } else if (Number(prod.avg_rating) >= 3.5) {
      performanceBadge = '<span class="badge ok">جيد</span>';
    } else {
      performanceBadge = '<span class="badge bad">⚠ يحتاج تحسين</span>';
    }

    const card = document.createElement('div');
    card.className = 'mobile-product-card';

    card.innerHTML = `
      <div class="mobile-product-top">
        <img
          src="${prod.image || 'https://via.placeholder.com/80'}"
          alt="${prod.name}"
        >

        <div class="mobile-product-info">
          <h3>${prod.name}</h3>
            ${prod.is_visible
        ? '<span class="status-badge visible">ظاهر</span>'
        : '<span class="status-badge hidden">مخفي</span>'
      }
          <p>${prod.price || 0} د.ل</p>
          ${performanceBadge}
        </div>
      </div>

      <div class="mobile-product-rating">
        <div>⭐ ${prod.avg_rating || '0.0'}</div>
        <div>${prod.total_reviews || 0} تقييم</div>
        <small>
          🍽 ${prod.avg_taste || '-'} |
          🎨 ${prod.avg_presentation || '-'} |
          💰 ${prod.avg_price || '-'}
        </small>
      </div>

      <div class="mobile-product-actions">
        <button class="edit-btn" onclick="openEditModal('${prod.id}')">تعديل</button>
        <button class="delete-btn" onclick="deleteProduct('${prod.id}')">حذف</button>
        <button class="btn" onclick="showReviews('${prod.id}')">التقييمات</button>
      </div>
    `;

    container.appendChild(card);
  });
}

window.showReviews = async (productId) => {
  currentReviewsProductId = productId;
  try {
    const token = localStorage.getItem('token');

    const period = document.getElementById('reviewsPeriodFilter')?.value || 'all';
    const sort = document.getElementById('reviewsSortFilter')?.value || 'newest';

    const res = await fetch(
      `/api/products/${productId}/reviews?period=${period}&sort=${sort}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    console.log('Reviews status:', res.status);
    console.log('Reviews data:', data);
    console.log('Reviews filters:', { period, sort });

    if (!res.ok || !data.success) {
      alert(data.error || data.message || 'فشل تحميل التقييمات');
      return;
    }

    const container = document.getElementById('reviewsContainer');
    const modal = document.getElementById('reviewsModal');

    if (!container) {
      alert('reviewsContainer غير موجود في index.html');
      return;
    }

    if (!modal) {
      alert('reviewsModal غير موجود في index.html');
      return;
    }

    container.innerHTML = '';

    if (!data.reviews || data.reviews.length === 0) {
      container.innerHTML = '<p style="text-align:center">لا توجد تقييمات</p>';
    } else {
      data.reviews.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '10px';

        card.innerHTML = `
          <strong>${r.customer_name || 'مستخدم'}</strong>
          ${r.branch_name ? `<div style="margin-top:6px;">📍 الفرع: ${r.branch_name}</div>` : ''}
          <div style="margin-top:5px;">🍽 الطعم: ${r.taste_rating ?? '-'}/5</div>
          <div>🎨 الشكل: ${r.presentation_rating ?? '-'}/5</div>
          <div>💰 السعر: ${r.price_rating ?? '-'}/5</div>
          <p style="margin-top:10px;">${r.comment || ''}</p>
          <small>${r.created_at ? new Date(r.created_at).toLocaleString() : ''}</small>
        `;

        container.appendChild(card);
      });
    }

    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.zIndex = '9999';
    modal.classList.add('show');

  } catch (error) {
    console.error('showReviews error:', error);
    alert(error.message);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const periodFilter = document.getElementById('reviewsPeriodFilter');
  const sortFilter = document.getElementById('reviewsSortFilter');

  if (periodFilter) {
    periodFilter.addEventListener('change', () => {
      if (currentReviewsProductId) {
        showReviews(currentReviewsProductId);
      }
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      if (currentReviewsProductId) {
        showReviews(currentReviewsProductId);
      }
    });
  }
});

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
  document.getElementById('prodImage').value = prod.image;
  document.getElementById('productVisible').checked =
    prod.is_visible !== false;
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
  const uploadedImageUrl = await uploadImage('prodImageFile');

  const newProd = {
    name: document.getElementById('prodName').value,
    price: document.getElementById('prodPrice').value,
    image_url: uploadedImageUrl || document.getElementById('prodImage').value || null,
    is_visible: document.getElementById('productVisible').checked
  };

  try {
    if (editingProductId) {
      const response = await fetch(`/api/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProd)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Update product error:', data);
        showToast(data.error || data.message || 'فشل تعديل المنتج', 'error');
        return;
      }

      showToast('تم تعديل المنتج', 'success');
    } else {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProd)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Add product error:', data);
        showToast(data.error || data.message || 'فشل إضافة المنتج', 'error');
        return;
      }

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
    const uploadedLogoUrl = await uploadImage('restaurantLogoFile');

    const payload = {
      name: document.getElementById('restaurantName').value,
      description: document.getElementById('restaurantDesc').value,
      address: document.getElementById('restaurantLocation').value,
      google_maps_url: document.getElementById('restaurantGoogleMapsUrl').value || null,
      logo_url: uploadedLogoUrl || document.getElementById('restaurantLogo').value || null,
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

// Upload Image
async function uploadImage(fileInputId) {
  const fileInput = document.getElementById(fileInputId);

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return null;
  }

  const token = localStorage.getItem('token');
  const formData = new FormData();

  formData.append('image', fileInput.files[0]);

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'فشل رفع الصورة');
  }

  return data.url;
}

// showSection

function showSection(sectionId) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active-section');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  const selectedSection = document.getElementById(sectionId);

  if (selectedSection) {
    selectedSection.classList.add('active-section');
  }

  const activeLink = document.querySelector(
    `.nav-link[data-section="${sectionId}"]`
  );

  if (activeLink) {
    activeLink.classList.add('active');
  }
}

document.querySelectorAll('.nav-link[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    const sectionId = link.dataset.section;

    showSection(sectionId);

    if (sidebar && sidebar.classList.contains('active')) {
      toggleSidebar();
    }
  });
});

// loadBranches

async function loadBranches() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/branches', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showToast('فشل تحميل الفروع', 'error');
      return;
    }

    renderBranches(data.branches);

  } catch (error) {
    console.error(error);
    showToast('خطأ في تحميل الفروع', 'error');
  }
}

function renderBranches(branches) {
  const container = document.getElementById('branchesList');
  if (!container) return;

  if (!branches.length) {
    container.innerHTML = '<p style="color:var(--text-muted);">لا توجد فروع مضافة حالياً</p>';
    return;
  }

  container.innerHTML = branches.map(branch => `
    <div class="branch-card">
      <div>
        <strong>${branch.name}</strong>
        <p>${branch.address || ''}</p>
        ${branch.google_maps_url ? `<a href="${branch.google_maps_url}" target="_blank">فتح الموقع</a>` : ''}
      </div>

      <button
        class="branch-delete-btn"
        onclick="deleteBranch('${branch.id}')"
        title="حذف الفرع"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

async function loadBranchStats() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch('/api/dashboard/branch-stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) return;

    const container = document.getElementById('branchStatsContainer');
    if (!container) return;

    if (!data.branches.length) {
      container.innerHTML = '<p style="color:var(--text-muted);">لا توجد فروع حالياً</p>';
      return;
    }

    container.innerHTML = data.branches.map(branch => `
      <div class="branch-stat-card">
        <strong>${branch.name}</strong>
        <div>⭐ ${branch.avg_rating || '0.0'} متوسط التقييم</div>
        <div>${branch.total_reviews || 0} تقييم</div>
        <small>
          🍽 ${branch.avg_taste || '-'} |
          🎨 ${branch.avg_presentation || '-'} |
          💰 ${branch.avg_price || '-'}
        </small>
      </div>
    `).join('');

  } catch (error) {
    console.error(error);
  }
}

document.getElementById('branchForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem('token');

    const payload = {
      name: document.getElementById('branchName').value,
      address: document.getElementById('branchAddress').value || null,
      google_maps_url: document.getElementById('branchGoogleMapsUrl').value || null
    };

    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(
        data.message || data.error || 'فشل إضافة الفرع',
        'error'
      );
      return;
    }

    document.getElementById('branchForm').reset();
    await loadBranches();
    await loadBranchStats();

    showToast('تمت إضافة الفرع', 'success');

  } catch (error) {
    console.error(error);
    showToast('خطأ في إضافة الفرع', 'error');
  }
});

window.deleteBranch = async function (id) {
  if (!confirm('هل تريد حذف هذا الفرع؟')) return;

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`/api/branches/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!data.success) {
      showToast(data.error || 'فشل حذف الفرع', 'error');
      return;
    }

    await loadBranches();
    await loadBranchStats();

    showToast('تم حذف الفرع', 'success');

  } catch (error) {
    console.error(error);
    showToast('خطأ في حذف الفرع', 'error');
  }
};

// Toasts
function showToast(msg, type) {

  const container =
    document.getElementById('toast-container');

  const toast =
    document.createElement('div');

  toast.className = `toast ${type}`;

  toast.innerHTML =
    `<span>${type === 'success' ? '✔' : 'ℹ'} ${msg}</span>`;

  container.appendChild(toast);

  setTimeout(() => {

    toast.style.opacity = '0';

    setTimeout(() => {
      toast.remove();
    }, 500);

  }, 3000);
}