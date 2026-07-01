document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const btn = document.getElementById('adminLoginBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'جاري التحقق...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || 'فشل تسجيل الدخول');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));

        window.location.href = '/admin.html';

    } catch (error) {
        console.error(error);
        alert('خطأ في الاتصال بالخادم');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});