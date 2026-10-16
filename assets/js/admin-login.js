const Locale = window.AppLocale;

document
    .getElementById('adminLoginForm')
    .addEventListener('submit', async (e) => {

        e.preventDefault();

        const username =
            document
                .getElementById('username')
                .value
                .trim();

        const password =
            document
                .getElementById('password')
                .value;

        const btn =
            document.getElementById(
                'adminLoginBtn'
            );

        const originalText =
            btn.innerHTML;

        btn.innerHTML =
            'جاري التحقق...';

        btn.disabled = true;

        try {

            const res =
                await fetch(
                    '/api/admin/login',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            username,
                            password
                        })
                    }
                );

            const data =
                await res.json();

            if (!res.ok || !data.success) {

                if (res.status === 401) {

                    showToast(
                        Locale.ADMIN_LOGIN
                            .INVALID_CREDENTIALS,
                        'error'
                    );

                } else {

                    showToast(
                        Locale.ADMIN_LOGIN
                            .LOGIN_ERROR,
                        'error'
                    );
                }

                return;
            }

            localStorage.setItem(
                'adminToken',
                data.token
            );

            localStorage.setItem(
                'adminUser',
                JSON.stringify(data.admin)
            );

            window.location.href =
                '/admin';

        } catch (error) {

            console.error(
                'Admin login error:',
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