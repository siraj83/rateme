const adminToken = localStorage.getItem('adminToken');
let adminRestaurants = [];
let adminPlans = [];

if (!adminToken) {
    window.location.href = '/admin-login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    initAdminNavigation();
    initAdminProfileTabs();

    document.getElementById('welcomeMsg').innerText =
        'مرحبًا بك في لوحة مسؤول المنصة 👋';

    await loadAdminDashboard();
    await loadAdminRestaurants();
    await loadAdminPlans();


    document.getElementById('refreshAdminBtn')?.addEventListener('click', async () => {
        await loadAdminDashboard();
        await loadAdminRestaurants();
        await loadAdminPlans();
        showToast('تم تحديث البيانات', 'success');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin-login.html';
    });

    document.getElementById('closeSubscriptionModal')?.addEventListener('click', closeSubscriptionModal);
    document.getElementById('subscriptionForm')?.addEventListener('submit', saveSubscriptionChanges);
    document.getElementById('closePlanModal')?.addEventListener('click', closePlanModal);
    document.getElementById('planForm')?.addEventListener('submit', savePlanChanges);
});

window.openPlanEditor = function (planId) {
    const plan = adminPlans.find(p => p.id === planId);

    if (!plan) {
        showToast('لم يتم العثور على الباقة', 'error');
        return;
    }

    document.getElementById('planId').value = plan.id;
    document.getElementById('planName').value = plan.name;
    document.getElementById('planPrice').value = plan.price || 0;
    document.getElementById('planMaxProducts').value = plan.max_products ?? '';
    document.getElementById('planMaxBranches').value = plan.max_branches ?? '';
    document.getElementById('planMaxReviews').value = plan.max_reviews ?? '';
    document.getElementById('planIsActive').checked = plan.is_active === true;

    document.getElementById('featureQrCode').checked = plan.features?.qr_code === 'true';
    document.getElementById('featureBranches').checked = plan.features?.branches === 'true';
    document.getElementById('featureAdvancedStats').checked = plan.features?.advanced_stats === 'true';
    document.getElementById('featureAiAnalysis').checked = plan.features?.ai_analysis === 'true';
    document.getElementById('featureExportReports').checked = plan.features?.export_reports === 'true';

    const modal = document.getElementById('planModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
};

function closePlanModal() {
    const modal = document.getElementById('planModal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

async function savePlanChanges(e) {
    e.preventDefault();

    const planId = document.getElementById('planId').value;

    const payload = {
        name: document.getElementById('planName').value.trim(),
        price: Number(document.getElementById('planPrice').value),
        max_products: document.getElementById('planMaxProducts').value === ''
            ? null
            : Number(document.getElementById('planMaxProducts').value),
        max_branches: document.getElementById('planMaxBranches').value === ''
            ? null
            : Number(document.getElementById('planMaxBranches').value),
        max_reviews: document.getElementById('planMaxReviews').value === ''
            ? null
            : Number(document.getElementById('planMaxReviews').value),
        is_active: document.getElementById('planIsActive').checked,
        features: {
            qr_code: document.getElementById('featureQrCode').checked,
            branches: document.getElementById('featureBranches').checked,
            advanced_stats: document.getElementById('featureAdvancedStats').checked,
            ai_analysis: document.getElementById('featureAiAnalysis').checked,
            export_reports: document.getElementById('featureExportReports').checked
        }
    };

    const result = await adminFetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!result) return;

    const { res, data } = result;

    if (!res.ok || !data.success) {
        showToast(data.message || data.error || 'فشل تحديث الباقة', 'error');
        return;
    }

    showToast('تم تحديث الباقة بنجاح', 'success');

    closePlanModal();
    await loadAdminPlans();
}

function initAdminNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('active');
            });

            link.classList.add('active');

            const sectionId = link.dataset.section;

            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active-section');
            });

            document.getElementById(sectionId)?.classList.add('active-section');

            document.getElementById('sidebar')?.classList.remove('active');
            document.getElementById('sidebarOverlay')?.classList.remove('active');
        });
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');

    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

function initAdminProfileTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => {
                b.classList.remove('active');
            });

            document.querySelectorAll('.admin-tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab)?.classList.add('active');
        });
    });
}

async function adminFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${adminToken}`
        }
    });

    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login.html';
        return null;
    }

    return { res, data };
}

async function loadAdminDashboard() {
    try {
        const result = await adminFetch('/api/admin/dashboard');
        if (!result) return;

        const { data } = result;

        if (!data.success) {
            showToast(data.message || 'فشل تحميل الإحصائيات', 'error');
            return;
        }

        document.getElementById('totalProducts').innerText =
            data.stats.restaurants || 0;

        document.getElementById('totalReviews').innerText =
            data.stats.users || 0;

        document.getElementById('avgRating').innerText =
            data.stats.active_subscriptions || 0;

        document.getElementById('bestProduct').innerText =
            data.stats.pending_payments || 0;

    } catch (error) {
        console.error(error);
        showToast('خطأ في تحميل لوحة التحكم', 'error');
    }
}

async function loadAdminRestaurants() {
    try {
        const result = await adminFetch('/api/admin/restaurants');
        if (!result) return;

        const { data } = result;

        if (!data.success) {
            showToast(data.message || 'فشل تحميل المطاعم', 'error');
            return;
        }

        const tbody = document.getElementById('adminRestaurantsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        data.restaurants.forEach(r => {
            const row = document.createElement('tr');

            row.innerHTML = `
        <td>${r.restaurant_name || '-'}</td>
        <td>${r.user_phone || r.restaurant_phone || '-'}</td>
        <td>${r.plan_name || '-'}</td>
        <td>${formatPaymentStatus(r.payment_status)}</td>
        <td>${formatSubscriptionStatus(r.subscription_status)}</td>
        <td class="actions">
            <button class="edit-btn" onclick="openSubscriptionEditor('${r.subscription_id}')">
                إدارة
            </button>

            <button class="btn" onclick="downloadInvoice('${r.subscription_id}')">
                فاتورة
            </button>
        </td>
      `;

            tbody.appendChild(row);
        });

        renderSubscriptionsList(data.restaurants);
        adminRestaurants = data.restaurants;
        renderAdminRestaurantsMobile(data.restaurants);

    } catch (error) {
        console.error(error);
        showToast('خطأ في تحميل المطاعم', 'error');
    }
}

function renderAdminRestaurantsMobile(restaurants) {
    const container = document.getElementById('adminRestaurantsMobileList');
    if (!container) return;

    container.innerHTML = restaurants.map(r => `
    <div class="admin-mobile-card">
      <h3>${r.restaurant_name || '-'}</h3>

      <p>📞 ${r.user_phone || r.restaurant_phone || '-'}</p>
      <p>📦 ${r.plan_name || '-'}</p>
      <p>💳 ${formatPaymentStatus(r.payment_status)}</p>
      <p>✅ ${formatSubscriptionStatus(r.subscription_status)}</p>

      <button class="btn" onclick="openSubscriptionEditor('${r.subscription_id}')">
        إدارة الاشتراك
      </button>
      <button class="btn" onclick="downloadInvoice('${r.subscription_id}')">
        إصدار فاتورة
      </button>
    </div>
  `).join('');
}

async function loadAdminPlans() {
    try {
        const result = await adminFetch('/api/admin/plans');
        if (!result) return;

        const { data } = result;

        if (!data.success) return;

        adminPlans = data.plans;

        const container = document.getElementById('adminPlansContainer');
        if (!container) return;

        container.innerHTML = data.plans.map(plan => `
      <div class="admin-plan-card">
        <div class="admin-plan-header">
          <div>
            <h3>${formatPlanName(plan.name)}</h3>
            <p>${plan.price} د.ل / سنة</p>
          </div>

          <span class="status-badge ${plan.is_active ? 'visible' : 'hidden'}">
            ${plan.is_active ? 'مفعلة' : 'موقوفة'}
          </span>
        </div>

        <div class="admin-plan-limits">
          <div>🍽 المنتجات: ${plan.max_products === null ? 'غير محدود' : plan.max_products}</div>
          <div>📍 الفروع: ${plan.max_branches === null ? 'غير محدود' : plan.max_branches}</div>
          <div>⭐ التقييمات: ${plan.max_reviews === null ? 'غير محدود' : plan.max_reviews}</div>
        </div>

        <div class="admin-plan-features">
          ${renderPlanFeature('qr_code', plan.features?.qr_code)}
          ${renderPlanFeature('branches', plan.features?.branches)}
          ${renderPlanFeature('advanced_stats', plan.features?.advanced_stats)}
          ${renderPlanFeature('ai_analysis', plan.features?.ai_analysis)}
          ${renderPlanFeature('export_reports', plan.features?.export_reports)}
        </div>

        <button class="btn" onclick="openPlanEditor('${plan.id}')">
          تعديل الباقة
        </button>
      </div>
    `).join('');

    } catch (error) {
        console.error(error);
    }
}

function formatPlanName(name) {
    if (name === 'basic') return 'الباقة الأساسية';
    if (name === 'professional') return 'الباقة الاحترافية';
    if (name === 'restaurants') return 'باقة سلاسل المطاعم';
    return name;
}

function renderPlanFeature(key, value) {
    const labels = {
        qr_code: 'QR Code',
        branches: 'الفروع',
        advanced_stats: 'إحصائيات متقدمة',
        ai_analysis: 'تحليل AI',
        export_reports: 'تصدير التقارير'
    };

    const enabled = value === 'true' || value === true;

    return `
    <span class="feature-pill ${enabled ? 'enabled' : 'disabled'}">
      ${enabled ? '✓' : '×'} ${labels[key] || key}
    </span>
  `;
}

function renderSubscriptionsList(restaurants) {
    const container = document.getElementById('adminSubscriptionsContainer');
    if (!container) return;

    container.innerHTML = restaurants.map(r => `
    <div class="branch-card">
      <div>
        <strong>${r.restaurant_name || '-'}</strong>
        <p>📦 ${r.plan_name || '-'}</p>
        <p>💳 ${formatPaymentStatus(r.payment_status)}</p>
        <p>✅ ${formatSubscriptionStatus(r.subscription_status)}</p>
        <p>📅 ينتهي: ${r.ends_at ? new Date(r.ends_at).toLocaleDateString() : '-'}</p>
      </div>

      <button class="edit-btn" onclick="openSubscriptionEditor('${r.subscription_id}')">
        إدارة
      </button>
    </div>
  `).join('');
}

function formatPaymentStatus(status) {
    if (status === 'paid') return '<span class="badge good">مدفوع</span>';
    if (status === 'pending') return '<span class="badge ok">بانتظار الدفع</span>';
    if (status === 'failed') return '<span class="badge bad">فشل الدفع</span>';
    if (status === 'refunded') return '<span class="badge neutral">مسترجع</span>';

    return '<span class="badge neutral">غير محدد</span>';
}

function formatSubscriptionStatus(status) {
    if (status === 'active') return '<span class="badge good">نشط</span>';
    if (status === 'trial') return '<span class="badge ok">تجريبي</span>';
    if (status === 'expired') return '<span class="badge bad">منتهي</span>';
    if (status === 'suspended') return '<span class="badge neutral">موقوف</span>';

    return '<span class="badge neutral">غير محدد</span>';
}

window.openSubscriptionEditor = function (subscriptionId) {
    const restaurant = adminRestaurants.find(
        r => r.subscription_id === subscriptionId
    );

    if (!restaurant) {
        showToast('لم يتم العثور على الاشتراك', 'error');
        return;
    }

    document.getElementById('subscriptionId').value =
        restaurant.subscription_id;

    const reviewLink =
        `${window.location.origin}/review.html?slug=${restaurant.slug}`;

    document.getElementById('adminRestaurantSummary').innerHTML = `
        <h3>${restaurant.restaurant_name || '-'}</h3>

        <div>📞 الهاتف: ${restaurant.user_phone || restaurant.restaurant_phone || '-'}</div>
        <div>🌐 رابط التقييم: ${restaurant.slug || '-'}</div>
        <div>🍽 المنتجات: ${restaurant.products_count || 0}</div>
        <div>📍 الفروع: ${restaurant.branches_count || 0}</div>
        <div>⭐ التقييمات: ${restaurant.reviews_count || 0}</div>

        <div class="admin-quick-actions">
            <a
            href="${reviewLink}"
            target="_blank"
            class="primary"
            >
            فتح صفحة التقييم
            </a>

            <button
            type="button"
            onclick="copyAdminReviewLink('${reviewLink}')"
            >
            نسخ الرابط
            </button>
        </div>
        `;

    const planSelect = document.getElementById('subscriptionPlan');
    planSelect.innerHTML = adminPlans.map(plan => `
    <option value="${plan.id}">
      ${plan.name} - ${plan.price} د.ل
    </option>
  `).join('');

    planSelect.value = restaurant.plan_id || '';

    document.getElementById('paymentStatus').value =
        restaurant.payment_status || 'pending';

    document.getElementById('subscriptionStatus').value =
        restaurant.subscription_status || 'active';

    document.getElementById('paymentReference').value =
        restaurant.payment_reference || '';

    document.getElementById('subscriptionStartsAt').value =
        restaurant.starts_at
            ? restaurant.starts_at ? restaurant.starts_at.slice(0, 10) : ''
            : '';

    document.getElementById('subscriptionEndsAt').value =
        restaurant.ends_at
            ? restaurant.ends_at ? restaurant.ends_at.slice(0, 10) : ''
            : '';

    renderAdminTools(restaurant);
    loadRestaurantActivity(restaurant.restaurant_id);

    const modal = document.getElementById('subscriptionModal');
    modal.style.display = 'flex';

    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
};

window.copyAdminReviewLink = async function (link) {
    await navigator.clipboard.writeText(link);
    showToast('تم نسخ رابط التقييم', 'success');
};

function closeSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

async function saveSubscriptionChanges(e) {
    e.preventDefault();

    const subscriptionId = document.getElementById('subscriptionId').value;

    const payload = {
        plan_id: document.getElementById('subscriptionPlan').value,
        payment_status: document.getElementById('paymentStatus').value,
        status: document.getElementById('subscriptionStatus').value,
        payment_reference: document.getElementById('paymentReference').value || null,
        ends_at: document.getElementById('subscriptionEndsAt').value || null
    };

    try {
        const result = await adminFetch(`/api/admin/subscriptions/${subscriptionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!result) return;

        const { res, data } = result;

        if (!res.ok || !data.success) {
            showToast(data.message || data.error || 'فشل تحديث الاشتراك', 'error');
            return;
        }

        showToast('تم تحديث الاشتراك بنجاح', 'success');

        closeSubscriptionModal();

        await loadAdminDashboard();
        await loadAdminRestaurants();
        await loadAdminPlans();

    } catch (error) {
        console.error(error);
        showToast('خطأ في تحديث الاشتراك', 'error');
    }
}

function renderAdminTools(restaurant) {
    const container = document.getElementById('adminToolsContainer');
    if (!container) return;

    const reviewLink = `${window.location.origin}/review.html?slug=${restaurant.slug}`;
    const phone = restaurant.user_phone || restaurant.restaurant_phone || '';

    container.innerHTML = `
    <div class="admin-tools-grid">
      <a href="${reviewLink}" target="_blank" class="primary">🌍 فتح صفحة التقييم</a>
      <button type="button" onclick="copyAdminReviewLink('${reviewLink}')">📋 نسخ الرابط</button>
      <a href="tel:${phone}">📞 اتصال</a>
      <a href="https://wa.me/218${phone.replace(/^0/, '')}" target="_blank">✉ واتساب</a>
      <button type="button" onclick="alert('سنضيف إعادة تعيين كلمة المرور لاحقاً')">🔑 إعادة تعيين كلمة المرور</button>
      <button type="button" onclick="alert('سنضيف إيقاف الحساب لاحقاً')">🚫 إيقاف الحساب</button>
    </div>
  `;
}

async function loadRestaurantActivity(restaurantId) {
    const container = document.getElementById('adminActivityContainer');
    if (!container) return;

    container.innerHTML = 'جاري تحميل سجل النشاط...';

    const result = await adminFetch(`/api/admin/restaurants/${restaurantId}/activity`);
    if (!result) return;

    const { data } = result;

    if (!data.success || !data.logs.length) {
        container.innerHTML = '<p style="color:var(--text-muted);">لا يوجد نشاط مسجل حتى الآن</p>';
        return;
    }

    container.innerHTML =
        data.logs.map(log => `
        <div class="admin-activity-item">
            ${renderActivity(log)}
        </div>
        `).join('');
}

function formatActivityAction(action) {
    if (action === 'subscription_updated') return 'تم تحديث الاشتراك';
    return action;
}

function renderActivity(log) {
    let html = `
    <div class="activity-title">
      ${formatActivityAction(log.action)}
    </div>
  `;

    if (
        log.new_value &&
        log.new_value.changes &&
        log.new_value.changes.length
    ) {
        html += `<div class="activity-changes-list">`;

        log.new_value.changes.forEach(change => {
            html += `
        <div class="activity-change-card">
          <div class="activity-field">
            ${translateField(change.field)}
          </div>

          <div class="activity-values">
            <span class="old-value">
              ${translateValue(change.field, change.old)}
            </span>

            <span class="change-arrow">←</span>

            <span class="new-value">
              ${translateValue(change.field, change.new)}
            </span>
          </div>
        </div>
      `;
        });

        html += `</div>`;
    }

    html += `
    <div class="activity-meta">
      بواسطة: ${log.admin_username || '-'}
      <br>
      ${new Date(log.created_at).toLocaleString()}
    </div>
  `;

    return html;
}

function translateField(field) {
    switch (field) {
        case 'plan':
            return '📦 الباقة';

        case 'payment_status':
            return '💳 حالة الدفع';

        case 'subscription_status':
            return '✅ حالة الاشتراك';

        case 'ends_at':
            return '📅 نهاية الاشتراك';

        case 'payment_reference':
            return '🧾 رقم العملية';

        default:
            return field;
    }
}

function translateValue(field, value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    switch (field) {
        case 'payment_status':
            if (value === 'pending') return 'بانتظار الدفع';
            if (value === 'paid') return 'مدفوع';
            if (value === 'failed') return 'فشل الدفع';
            if (value === 'refunded') return 'مسترجع';
            return value;

        case 'subscription_status':
            if (value === 'active') return 'نشط';
            if (value === 'expired') return 'منتهي';
            if (value === 'trial') return 'تجريبي';
            if (value === 'suspended') return 'موقوف';
            return value;

        case 'ends_at':
            return new Date(value).toLocaleDateString();

        default:
            return value;
    }
}

function translateValue(field, value) {

    if (value === null)
        return '-';

    switch (field) {

        case 'payment_status':

            if (value === 'pending')
                return 'بانتظار الدفع';

            if (value === 'paid')
                return 'مدفوع';

            if (value === 'failed')
                return 'فشل الدفع';

            return value;

        case 'subscription_status':

            if (value === 'active')
                return 'نشط';

            if (value === 'expired')
                return 'منتهي';

            if (value === 'trial')
                return 'تجريبي';

            if (value === 'suspended')
                return 'موقوف';

            return value;

        default:

            return value;

    }
}

window.downloadInvoice = function (subscriptionId) {
    const url = `/api/admin/subscriptions/${subscriptionId}/invoice`;

    fetch(url, {
        headers: {
            Authorization: `Bearer ${adminToken}`
        }
    })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'فشل إصدار الفاتورة');
            }

            return res.blob();
        })
        .then(blob => {
            const fileUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = fileUrl;
            a.download = `rateme-invoice-${subscriptionId}.pdf`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(fileUrl);
        })
        .catch(error => {
            console.error(error);
            showToast(error.message, 'error');
        });
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