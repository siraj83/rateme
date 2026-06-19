document.getElementById('loginForm').addEventListener('submit', async (e) => {

    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    const btn = document.getElementById('loginBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = 'جاري التحقق...';
    btn.disabled = true;

    try {

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone,
                password
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'فشل تسجيل الدخول');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        alert('تم تسجيل الدخول بنجاح');

        window.location.href = 'index.html';

    } catch (error) {

        console.error(error);

        alert('خطأ في الاتصال بالخادم');

        btn.innerHTML = originalText;
        btn.disabled = false;
    }

});