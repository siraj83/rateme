const params = new URLSearchParams(window.location.search);
const selectedPlan = params.get('plan') || 'basic';

const planLabels = {
    basic: 'الباقة الأساسية',
    professional: 'الباقة الاحترافية',
    restaurants: 'باقة سلاسل المطاعم'
};

document.getElementById('selectedPlanName').innerText =
    planLabels[selectedPlan] || 'الباقة الأساسية';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const restaurant_name = document.getElementById('restaurantName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('كلمة المرور غير متطابقة');
        return;
    }

    const btn = document.getElementById('registerBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'جاري إنشاء الحساب...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurant_name,
                phone,
                password,
                plan_name: selectedPlan
            })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || data.error || 'فشل إنشاء الحساب');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        alert('تم إنشاء الحساب بنجاح');

        window.location.href = '/index.html';

    } catch (error) {
        console.error(error);
        alert('خطأ في الاتصال بالخادم');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});