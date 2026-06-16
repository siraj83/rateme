// --- CONFIGURATION ---
const CONFIG = {
  API_KEY: 'pit-aef9dfb5-569b-4224-b83b-5547294bde01',
  LOCATION_ID: '0IV0KhyUwqPwxd8GvQ28',
  FIELD_ID_PRODUCTS: 'ufvPeB5ZHDfttbn6cLyP',
  FIELD_IDS: {
    name: '58ewZU5T6v0Jwl1s96m7',
    desc: 'mBzajcGycmVXUvMGlJUc'
  },
  USE_PROXY: true,
  PROXY_URL: 'http://localhost:3000'
};

// --- STATE ---
let allProducts = [];

// --- HELPER ---
async function apiCall(endpoint, method = 'GET', body = null) {
  // (Same apiCall function as login.js)
  const headers = { 'Authorization': `Bearer ${CONFIG.API_KEY}`, 'Content-Type': 'application/json', 'Version': '2021-07-28' };
  if (CONFIG.USE_PROXY) {
    return fetch(`${CONFIG.PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}&method=${method}&token=${CONFIG.API_KEY}`, { method: 'POST', body: body ? JSON.stringify(body) : null });
  } else {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    return fetch(`https://services.leadconnectorhq.com${endpoint}`, options);
  }
}

function getCustomField(contact, id) {
  if (!contact.customFields) return null;
  return contact.customFields.find(f => f.id === id)?.value;
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const rid = params.get('rid');

  if (!rid) {
    document.body.innerHTML = '<h1 style="text-align:center; margin-top:50px;">خطأ: لم يتم تحديد المطعم.</h1>';
    return;
  }

  // 1. Fetch Restaurant Info
  const res = await apiCall(`/contacts/${rid}`, 'GET');
  const data = await res.json();
  const contact = data.contact;

  if (contact) {
    const name = getCustomField(contact, CONFIG.FIELD_IDS.name);
    const desc = getCustomField(contact, CONFIG.FIELD_IDS.desc);
    // Note: You might need a logo field ID, but using placeholder for now
    const logo = getCustomField(contact, 'YOUR_LOGO_FIELD_ID') || 'https://via.placeholder.com/100';

    document.getElementById('restaurantName').innerText = name || 'مطعم';
    document.getElementById('restaurantDesc').innerText = desc || '';
    document.getElementById('restaurantLogo').src = logo;
    document.getElementById('restaurantInfo').style.display = 'block';

    // 2. Fetch Products
    const productsField = contact.customFields?.find(f => f.id === CONFIG.FIELD_ID_PRODUCTS);
    if (productsField && productsField.value) {
      allProducts = JSON.parse(productsField.value);
      renderProducts();
    }
  }
});

// --- RENDER ---
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  allProducts.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'prod-card';

    // Calculate Average Rating
    const avgRating = prod.reviews.length > 0
      ? (prod.reviews.reduce((a, b) => a + parseInt(b.rating), 0) / prod.reviews.length).toFixed(1)
      : '0.0';

    card.innerHTML = `
      <img src="${prod.image || 'https://via.placeholder.com/300x200'}" alt="${prod.name}">
      <h3>${prod.name}</h3>
      <div class="price">${prod.price}$</div>
      <div style="font-size:0.9rem; color:#666; margin-bottom:10px;">
        <i class="fas fa-star" style="color:gold;"></i> ${avgRating} (${prod.reviews.length} تقييمات)
      </div>
      <button class="btn" onclick="openReview('${prod.id}')">أضف تقييمك</button>
    `;
    grid.appendChild(card);
  });
}

// --- SUBMIT REVIEW ---
let currentProdId = null;

window.openReview = (id) => {
  currentProdId = id;
  const modal = document.getElementById('reviewModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);
};

document.getElementById('closeReview').addEventListener('click', () => {
  document.getElementById('reviewModal').classList.remove('show');
  setTimeout(() => document.getElementById('reviewModal').style.display = 'none', 300);
});

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reviewerName').value;
  const rating = document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value;

  // Find Product
  const index = allProducts.findIndex(p => p.id === currentProdId);
  if (index > -1) {
    allProducts[index].reviews.push({ user: name, rating: parseInt(rating), comment });

    // Save to GHL
    try {
      // We need to re-fetch to get latest version (or just merge)
      // Simplest is to just PUT the whole products array again
      await apiCall(`/contacts/${new URLSearchParams(window.location.search).get('rid')}`, 'PUT', {
        customFields: [{ id: CONFIG.FIELD_ID_PRODUCTS, value: JSON.stringify(allProducts) }]
      });
      alert('شكراً ل participationك!');
      document.getElementById('reviewModal').classList.remove('show');
      setTimeout(() => document.getElementById('reviewModal').style.display = 'none', 300);
      renderProducts(); // Re-render to update star count
    } catch (err) {
      alert('خطأ في إرسال التقييم');
    }
  }
});