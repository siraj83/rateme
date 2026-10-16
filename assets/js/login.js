const Locale = window.AppLocale;

document
    .getElementById('loginForm')
    .addEventListener('submit', async (e) => {

        e.preventDefault();

        const phone =
            document
                .getElementById('phone')
                .value
                .trim();

        const password =
            document
                .getElementById('password')
                .value;

        const btn =
            document.getElementById('loginBtn');

        const originalText =
            btn.innerHTML;

        btn.innerHTML =
            'جاري التحقق...';

        btn.disabled = true;

        try {

            const response =
                await fetch('/api/login', {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        phone,
                        password
                    })
                });

            const data =
                await response.json();

            if (!response.ok || !data.success) {

                // لا نعرض رسالة السيرفر الإنجليزية
                // ولا نكشف هل الخطأ في الهاتف أو كلمة المرور
                if (response.status === 401) {

                    showToast(
                        Locale.LOGIN.INVALID_CREDENTIALS,
                        'error'
                    );

                } else {

                    showToast(
                        Locale.LOGIN.LOGIN_ERROR,
                        'error'
                    );
                }

                return;
            }

            localStorage.setItem(
                'user',
                JSON.stringify(data.user)
            );

            localStorage.setItem(
                'token',
                data.token
            );

            window.location.href =
                '/dashboard';

        } catch (error) {

            console.error(
                'Login error:',
                error
            );

            showToast(
                Locale.COMMON.NETWORK_ERROR,
                'error'
            );

        } finally {

            btn.innerHTML =
                originalText;

            btn.disabled = false;
        }

    });