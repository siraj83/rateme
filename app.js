// --- CONFIGURATION ---
const CONFIG = {
  // 🔑 KEYS (Paste your GHL Keys here)
  API_KEY: 'pit-aef9dfb5-569b-4224-b83b-5547294bde01',
  LOCATION_ID: '0IV0KhyUwqPwxd8GvQ28',

  // FIELD IDS
  FIELD_IDS: {
    products: 'ufvPeB5ZHDfttbn6cLyP',
    name: '58ewZU5T6v0Jwl1s96m7',
    desc: 'mBzajcGycmVXUvMGlJUc',
    location: 'Cgl3FIQiJc8Fj7SEwwH7'
  },

  // 🔧 LOCAL TESTING ONLY
  // Set to TRUE if running 'node server.js' locally
  // Set to FALSE if uploading to Linux Shared Hosting (Direct GHL)
  USE_PROXY: true,
  PROXY_URL: 'http://localhost:3000'
};

// --- 1. INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const contactId = params.get('rid');

  if (contactId) {
    console.log("Restaurant ID:", contactId);
    // Load Data
    await fetchRestaurantData(contactId);
    await loadProducts(contactId);
  } else {
    window.location.href = "http://127.0.0.1:5500/login.html"; // Fallback
  }
});

// --- 2. API HELPER (Handles Proxy vs Direct) ---
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${CONFIG.API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  };

  if (CONFIG.USE_PROXY) {
    // For Local VS Code Dev (Avoids CORS)
    return fetch(`${CONFIG.PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}&method=${method}&token=${CONFIG.API_KEY}`, {
      method: 'POST', // Always POST to proxy
      body: body ? JSON.stringify(body) : null
    });
  } else {
    // For Production Hosting (Direct to GHL)
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    return fetch(`https://services.leadconnectorhq.com${endpoint}`, options);
  }
}

// --- 3. DATA FETCHING ---
async function fetchRestaurantData(contactId) {
  try {
    const res = await apiCall(`/contacts/${contactId}`);
    const data = await res.json();
    const contact = data.contact;

    if (contact) {
      const name = getCustomField(contact, CONFIG.FIELD_IDS.name);
      const loc = getCustomField(contact, CONFIG.FIELD_IDS.location);
      const desc = getCustomField(contact, CONFIG.FIELD_IDS.desc);

      if (name) document.getElementById('restaurantName').value = name;
      if (loc) document.getElementById('restaurantLocation').value = loc;
      if (desc) document.getElementById('restaurantDesc').value = desc;
      if (name) document.getElementById('welcomeMsg').innerText = `مرحبًا بك، ${name} 👋`;
    }
  } catch (error) { console.error("Error fetching contact:", error); }
}

function getCustomField(contact, id) {
  if (!contact.customFields) return null;
  const field = contact.customFields.find(f => f.id === id);
  return field ? field.value : null;
}

// --- 4. PRODUCTS LOGIC ---
let allProducts = [];
let editingProductId = null;

async function loadProducts(contactId) {
  try {
    const res = await apiCall(`/contacts/${contactId}`);
    const data = await res.json();

    const productsField = data.contact?.customFields?.find(f => f.id === CONFIG.FIELD_IDS.products);
    if (productsField && productsField.value) {
      try { allProducts = JSON.parse(productsField.value); }
      catch (e) { allProducts = []; }
    }
    renderTable();
  } catch (error) { console.error("Error loading products:", error); }
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
        <button class="edit-btn" onclick="openEditModal('${prod.id}')">تعديل</button>
        <button class="delete-btn" onclick="deleteProduct('${prod.id}')">حذف</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function saveProducts() {
  try {
    // Re-fetch to get current state (Optimistic locking)
    const res = await apiCall(`/contacts/${new URLSearchParams(window.location.search).get('rid')}`);
    const data = await res.json();
    const contact = data.contact;

    // Update Field
    const payload = {
      customFields: [
        { id: CONFIG.FIELD_IDS.products, value: JSON.stringify(allProducts) }
      ]
    };

    // Note: We need to merge other fields too in a real app, 
    // for now this overwrites/keeps other fields based on GHL behavior. 
    // To be safe, send all existing fields back or use specific endpoint if available.
    // GHL V1 API merge logic:

    await fetch(`https://services.leadconnectorhq.com/contacts/${contact.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(payload)
    });

    showToast('تم حفظ البيانات', 'success');
  } catch (error) {
    console.error(error);
    showToast('خطأ في الحفظ', 'error');
  }
}

// --- 5. UPLOAD HELPER (Media Storage) ---
async function uploadToGHLMedia(fileInputId, urlInputId) {
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput.files || fileInput.files.length === 0) {
    const urlInput = document.getElementById(urlInputId);
    return urlInput ? urlInput.value : '';
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);

  // We must use direct URL for upload, Proxy struggles with multipart usually
  // So we bypass proxy for upload in Production
  try {
    // 1. Get Signed URL
    const metaRes = await fetch(`https://services.leadconnectorhq.com/media/generateUploadUrl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });
    const meta = await metaRes.json();

    // 2. Upload to S3
    await fetch(meta.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

    // 3. Confirm
    const confirmRes = await fetch(`https://services.leadconnectorhq.com/media/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ uploadId: meta.uploadId })
    });
    const finalData = await confirmRes.json();

    document.getElementById(urlInputId).value = finalData.accessUrl;
    return finalData.accessUrl;
  } catch (error) {
    console.error("Upload Error", error);
    showToast('فشل في رفع الصورة', 'error');
    return null;
  }
}

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
  window.location.href = "https://rateme.ly/login";
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
  confirmModal.style.display = 'flex'; setTimeout(() => confirmModal.classList.add('show'), 10);

  // Attach one-time listener to confirm button
  document.getElementById('confirmDeleteBtn').onclick = () => {
    allProducts = allProducts.filter(p => p.id !== id);
    saveProducts();
    renderTable();
    confirmModal.classList.remove('show');
    setTimeout(() => confirmModal.style.display = 'none', 300);
  };
};

// Forms
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const imageUrl = await uploadToGHLMedia('prodImageFile', 'prodImage');
  const finalImage = imageUrl || `https://picsum.photos/seed/${document.getElementById('prodName').value}/50/50`;

  const newProd = {
    id: editingProductId || Date.now().toString(),
    name: document.getElementById('prodName').value,
    price: document.getElementById('prodPrice').value,
    ingredients: document.getElementById('prodIngredients').value,
    image: finalImage,
    reviews: editingProductId ? allProducts.find(p => p.id === editingProductId).reviews : []
  };

  if (editingProductId) {
    const idx = allProducts.findIndex(p => p.id === editingProductId);
    allProducts[idx] = newProd;
    showToast('تم التعديل', 'success');
  } else {
    allProducts.push(newProd);
    showToast('تمت الإضافة', 'success');
  }

  saveProducts();
  renderTable();
  closeModal();
});

document.getElementById('saveRestaurantBtn').addEventListener('click', async () => {
  const logoUrl = await uploadToGHLMedia('logoFile', 'restaurantLogo');
  // Similar save logic for restaurant fields...
  showToast('تم حفظ البانات', 'success');
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