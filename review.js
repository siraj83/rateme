let currentProducts = [];

const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');

window.addEventListener('DOMContentLoaded', async () => {
  if (!slug) {
    alert('رابط المطعم غير صحيح');
    return;
  }

  await loadPublicRestaurant();
});

async function loadPublicRestaurant() {
  try {
    const res = await fetch(`/api/public/restaurant/${slug}`);
    const data = await res.json();

    if (!data.success) {
      alert('لم يتم العثور على المطعم');
      return;
    }

    const restaurant = data.restaurant;
    currentProducts = data.products;

    document.getElementById('restaurantInfo').style.display = 'block';
    document.getElementById('restaurantName').innerText = restaurant.name || '';
    document.getElementById('restaurantDesc').innerText = restaurant.description || '';

    const logo = document.getElementById('restaurantLogo');
    if (restaurant.logo_url) {
      logo.src = restaurant.logo_url;
      logo.style.display = 'inline-block';
    } else {
      logo.style.display = 'none';
    }

    renderProducts();

  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء تحميل بيانات المطعم');
  }
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  if (!currentProducts.length) {
    grid.innerHTML = `
      <div class="card" style="text-align:center;">
        لا توجد منتجات حالياً
      </div>
    `;
    return;
  }

  currentProducts.forEach(product => {
    const avg = product.avg_rating ? Number(product.avg_rating).toFixed(1) : '0.0';
    const total = product.total_reviews || 0;

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '15px';

    card.innerHTML = `
      <div style="display:flex; gap:15px; align-items:center;">
        <img
          src="${product.image_url || 'https://via.placeholder.com/80'}"
          alt="${product.name}"
          style="width:80px; height:80px; border-radius:12px; object-fit:cover;"
        >

        <div style="flex:1;">
          <h3 style="margin:0 0 5px;">${product.name}</h3>
          <p style="margin:0 0 5px; color:var(--text-muted);">${product.ingredients || ''}</p>
          <p style="margin:0; font-weight:bold;">${product.price || ''} LYD</p>
          <small>⭐ ${avg} — ${total} تقييم</small>
        </div>

        <button class="btn" onclick="openReviewModal('${product.id}')">
          قيّم
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function openReviewModal(productId) {
  document.getElementById('reviewProdId').value = productId;
  document.getElementById('reviewModal').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('reviewModal').classList.add('show');
  }, 10);
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('show');
  setTimeout(() => {
    document.getElementById('reviewModal').style.display = 'none';
  }, 300);
}

document.getElementById('closeReview').addEventListener('click', closeReviewModal);

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('reviewProdId').value;

  const payload = {
    customer_name: document.getElementById('reviewerName').value,
    taste_rating: Number(document.getElementById('tasteRating').value),
    presentation_rating: Number(document.getElementById('presentationRating').value),
    price_rating: Number(document.getElementById('priceRating').value),
    comment: document.getElementById('reviewComment').value,
    visit_date: new Date().toISOString().slice(0, 10)
  };

  try {
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      alert('فشل إرسال التقييم');
      return;
    }

    alert('شكراً لك، تم إرسال تقييمك بنجاح');

    document.getElementById('reviewForm').reset();
    closeReviewModal();

    await loadPublicRestaurant();

  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء إرسال التقييم');
  }
});