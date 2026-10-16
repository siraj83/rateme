let currentProducts = [];
let selectedProductName = '';

const params = new URLSearchParams(window.location.search);

const reviewParams = new URLSearchParams(window.location.search);

const restaurantSlug =
  reviewParams.get('slug');

const requestedBranchSlug =
  reviewParams.get('branch');

let selectedBranchFromLink = null;

window.addEventListener('DOMContentLoaded', async () => {
  if (!restaurantSlug) {
    showToast(
      Locale.REVIEWS.WRONG_LINK,
      'warning'
    );
    return;
  }

  initStarRatings();
  await loadPublicRestaurant();
});

async function loadPublicRestaurant() {
  try {
    const publicRestaurantUrl =
      `/api/public/restaurant/${encodeURIComponent(restaurantSlug)}` +
      (
        requestedBranchSlug
          ? `?branch=${encodeURIComponent(requestedBranchSlug)}`
          : ''
      );

    const res = await fetch(publicRestaurantUrl);
    const data = await res.json();
    selectedBranchFromLink =
      data.selected_branch || null;

    if (!data.success) {
      showToast(
        Locale.REVIEWS.NOT_FOUND,
        'warning'
      );
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
    showToast(
      Locale.REVIEWS.LOAD_RES_ERROR,
      'warning'
    );
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
  const branchSelectGroup =
    document.getElementById('branchSelectGroup');

  const select =
    document.getElementById('branchSelect');

  const branchTitle =
    document.getElementById('selectedBranchTitle');

  if (!select) return;

  const branches =
    window.currentBranches || [];

  // إعادة بناء قائمة الفروع
  select.innerHTML = `
    <option value="">اختر الفرع</option>
  `;

  branches.forEach(branch => {
    const option = document.createElement('option');

    option.value = branch.id;
    option.textContent = branch.name;

    select.appendChild(option);
  });

  // رابط خاص بفرع محدد
  if (selectedBranchFromLink) {
    select.value = selectedBranchFromLink.id;
    select.disabled = true;
    select.required = false;

    branchSelectGroup?.classList.add('hidden');

    if (branchTitle) {
      branchTitle.textContent =
        `فرع ${selectedBranchFromLink.name}`;

      branchTitle.classList.remove('hidden');
    }

    return;
  }

  // رابط عام للمطعم
  select.value = '';
  select.disabled = false;
  select.required = true;

  branchSelectGroup?.classList.remove('hidden');
  branchTitle?.classList.add('hidden');

  // حالة عدم وجود فروع
  if (branches.length === 0) {
    branchSelectGroup?.classList.add('hidden');
    select.disabled = true;
    select.required = false;
  }

  if (branches.length === 0) {
    branchSelectGroup?.classList.add('hidden');
    select.disabled = true;
    select.required = false;
    return;
  }

  if (branches.length === 1) {
    select.value = branches[0].id;
  }

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

  const selectedBranchId =
    selectedBranchFromLink?.id ||
    document.getElementById('branchSelect')?.value;

  if (!selectedBranchId) {
    showToast(
      Locale.REVIEWS.CHOISE_BRANCH,
      'warning'
    );
    return;
  }

  const payload = {

    customer_name:
      document.getElementById('reviewerName').value,

    branch_id: selectedBranchId,

    taste_rating:
      Number(document.getElementById('tasteRating').value),

    presentation_rating:
      Number(document.getElementById('presentationRating').value),

    price_rating:
      Number(document.getElementById('priceRating').value),

    comment:
      document.getElementById('reviewComment').value,

    visit_date:
      new Date().toISOString().slice(0, 10)

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
      showToast(
        Locale.REVIEWS.SEND_ERROR,
        'error'
      );
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
    showToast(
        Locale.REVIEWS.SEND_ERROR,
        'error'
      );
  }
});

function closeThankYouModal() {
  document.getElementById('thankYouModal').classList.remove('show');
  setTimeout(() => {
    document.getElementById('thankYouModal').style.display = 'none';
  }, 300);
}