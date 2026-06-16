// --- CONFIGURATION ---
const CONFIG = {
  API_KEY: 'pit-aef9dfb5-569b-4224-b83b-5547294bde01',
  LOCATION_ID: '0IV0KhyUwqPwxd8GvQ28',
  USE_PROXY: true,
  PROXY_URL: 'http://localhost:3000',
  PASSWORD_FIELD_ID: 'ISjjGvK725JwkzBDz6CO' // The password field ID we found
};

// --- API HELPER (Reuse from dashboard) ---
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${CONFIG.API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  };

  if (CONFIG.USE_PROXY) {
    return fetch(`${CONFIG.PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}&method=${method}&token=${CONFIG.API_KEY}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : null
    });
  } else {
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    return fetch(`https://services.leadconnectorhq.com${endpoint}`, options);
  }
}

// --- LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  // UI Feedback
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
  btn.disabled = true;

  try {
    // 1. Search User
    const res = await apiCall(`/contacts/?query=${encodeURIComponent(email)}&locationId=${CONFIG.LOCATION_ID}`, 'GET');
    const data = await res.json();

    if (!data.contacts || data.contacts.length === 0) {
      alert('المستخدم غير موجود');
      btn.innerHTML = originalText;
      btn.disabled = false;
      return;
    }

    const user = data.contacts[0];
    const contactId = user.id;

    // 2. Deep Fetch for Password
    const detailRes = await apiCall(`/contacts/${contactId}`, 'GET');
    const detailData = await detailRes.json();
    const contact = detailData.contact;

    // 3. Check Password
    let userPassword = null;
    if (contact.customFields) {
      const passField = contact.customFields.find(f => f.id === CONFIG.PASSWORD_FIELD_ID);
      if (passField) userPassword = passField.value;
    }

    if (userPassword === password) {
      // Success
      alert('تم تسجيل الدخول بنجاح');
      // Redirect to Dashboard with ID
      window.location.href = `index.html?rid=${contactId}`;
    } else {
      alert('كلمة المرور غير صحيحة');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }

  } catch (error) {
    console.error(error);
    alert('خطأ في الاتصال');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});