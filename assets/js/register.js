window.addEventListener(
    'DOMContentLoaded',
    () => {

        const selectedPlanElement =
            document.getElementById(
                'selectedPlanName'
            );

        if (selectedPlanElement) {
            selectedPlanElement.textContent =
                planLabels[selectedPlan] ||
                planLabels.basic;
        }
    }
);


document
    .getElementById('registerForm')
    .addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();

            const restaurant_name =
                document
                    .getElementById(
                        'restaurantName'
                    )
                    .value
                    .trim();

            const phone =
                document
                    .getElementById('phone')
                    .value
                    .trim();

            const password =
                document
                    .getElementById('password')
                    .value;

            const confirmPassword =
                document
                    .getElementById(
                        'confirmPassword'
                    )
                    .value;

            if (
                password !==
                confirmPassword
            ) {
                showToast(
                    Locale.REGISTER
                        .PASSWORD_MISMATCH,
                    'warning'
                );

                return;
            }

            const btn =
                document.getElementById(
                    'registerBtn'
                );

            const originalText =
                btn.innerHTML;

            btn.innerHTML =
                'جاري إنشاء الحساب...';

            btn.disabled = true;

            let registrationSucceeded =
                false;

            try {

                const res =
                    await fetch(
                        '/api/register',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                restaurant_name,
                                phone,
                                password,
                                plan_name:
                                    selectedPlan
                            })
                        }
                    );

                const data =
                    await res.json();

                if (
                    !res.ok ||
                    !data.success
                ) {
                    showToast(
                        Locale.REGISTER
                            .CREATE_ERROR,
                        'error'
                    );

                    return;
                }

                registrationSucceeded =
                    true;

                localStorage.setItem(
                    'user',
                    JSON.stringify(
                        data.user
                    )
                );

                localStorage.setItem(
                    'token',
                    data.token
                );

                btn.innerHTML =
                    'تم إنشاء الحساب';

                showToast(
                    Locale.REGISTER
                        .ACCOUNT_CREATED,
                    'success'
                );

                setTimeout(() => {
                    window.location.href =
                        '/dashboard';
                }, 1200);

            } catch (error) {

                console.error(
                    'Register error:',
                    error
                );

                showToast(
                    Locale.COMMON
                        .NETWORK_ERROR,
                    'error'
                );

            } finally {

                if (
                    !registrationSucceeded
                ) {
                    btn.innerHTML =
                        originalText;

                    btn.disabled =
                        false;
                }
            }
        }
    );