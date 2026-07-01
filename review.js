let currentProducts = [];
let selectedProductName = '';

const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');

window.addEventListener('DOMContentLoaded', async () => {
  if (!slug) {
    alert('رابط المطعم غير صحيح');
    return;
  }

  initStarRatings();
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
    window.currentBranches = data.branches || [];
    renderBranchesSelector();

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
    const card = document.createElement('div');
    card.className = 'prod-card';

    card.innerHTML = `
      <img
        src="${product.image_url || 'https://via.placeholder.com/300x200?text=Food'}"
        alt="${product.name}"
      >

      <h3>${product.name}</h3>

      <div class="price">
        ${product.price || ''} د.ل
      </div>

      <button class="btn" onclick="openReviewModal('${product.id}')">
        قيّم
      </button>
    `;

    grid.appendChild(card);
  });
}

function renderBranchesSelector() {
  const container = document.getElementById('branchSelectorContainer');
  const select = document.getElementById('branchSelect');

  if (!container || !select) return;

  select.innerHTML = '';

  if (!window.currentBranches || window.currentBranches.length <= 1) {
    container.style.display = 'none';
    select.required = false;
    select.disabled = true;
    return;
  }

  container.style.display = 'block';
  select.required = true;
  select.disabled = false;

  select.innerHTML = `
    <option value="">اختر الفرع</option>
  `;

  window.currentBranches.forEach(branch => {
    select.innerHTML += `
      <option value="${branch.id}">
        ${branch.name}
      </option>
    `;
  });
}

function initStarRatings() {
  document.querySelectorAll('.star-rating').forEach(container => {
    const targetId = container.dataset.target;
    const input = document.getElementById(targetId);

    container.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.innerHTML = '★';
      star.dataset.value = i;

      star.addEventListener('click', () => {
        input.value = i;
        updateStars(container, i);
      });

      container.appendChild(star);
    }

    updateStars(container, Number(input.value || 5));
  });
}

function updateStars(container, value) {
  container.querySelectorAll('span').forEach(star => {
    star.classList.toggle(
      'active',
      Number(star.dataset.value) <= value
    );
  });
}

function openReviewModal(productId) {
  const product = currentProducts.find(p => p.id === productId);
  selectedProductName = product ? product.name : '';

  document.getElementById('reviewProdId').value = productId;

  document.getElementById('tasteRating').value = 5;
  document.getElementById('presentationRating').value = 5;
  document.getElementById('priceRating').value = 5;

  document.querySelectorAll('.star-rating').forEach(container => {
    updateStars(container, 5);
  });

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
    branch_id: document.getElementById('branchSelect')?.value || null,
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

    document.getElementById('reviewForm').reset();
    closeReviewModal();

    document.getElementById('thankYouModal').style.display = 'flex';
    setTimeout(() => {
      document.getElementById('thankYouModal').classList.add('show');
    }, 10);

    await loadPublicRestaurant();

  } catch (error) {
    console.error(error);
    alert('حدث خطأ أثناء إرسال التقييم');
  }
});

function closeThankYouModal() {
  document.getElementById('thankYouModal').classList.remove('show');
  setTimeout(() => {
    document.getElementById('thankYouModal').style.display = 'none';
  }, 300);
}