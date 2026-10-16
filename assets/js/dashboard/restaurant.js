(function initializeRestaurantModule() {

    window.currentRestaurantSlug =
        window.currentRestaurantSlug || '';

    async function loadRestaurant() {
        try {
            const token =
                localStorage.getItem('token');

            const res = await fetch(
                '/api/restaurant/me',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                showToast(
                    data.message ||
                    getMessage(
                        'RESTAURANT.LOAD_ERROR',
                        'تعذر تحميل بيانات المطعم.'
                    ),
                    'error'
                );

                return;
            }

            const restaurant =
                data.restaurant;

            window.currentRestaurantSlug =
                restaurant.slug || '';

            if (window.RateMeApp?.state) {
                window.RateMeApp.state.currentRestaurantSlug =
                    restaurant.slug || '';
            }

            const nameInput =
                document.getElementById(
                    'restaurantName'
                );

            const descInput =
                document.getElementById(
                    'restaurantDesc'
                );

            const locationInput =
                document.getElementById(
                    'restaurantLocation'
                );

            const mapsInput =
                document.getElementById(
                    'restaurantGoogleMapsUrl'
                );

            const logoInput =
                document.getElementById(
                    'restaurantLogo'
                );

            const welcomeMessage =
                document.getElementById(
                    'welcomeMsg'
                );

            if (nameInput) {
                nameInput.value =
                    restaurant.name || '';
            }

            if (descInput) {
                descInput.value =
                    restaurant.description || '';
            }

            if (locationInput) {
                locationInput.value =
                    restaurant.address || '';
            }

            if (mapsInput) {
                mapsInput.value =
                    restaurant.google_maps_url || '';
            }

            if (logoInput) {
                logoInput.value =
                    restaurant.logo_url || '';
            }

            if (welcomeMessage) {
                welcomeMessage.innerText =
                    `مرحبًا بك، ${restaurant.name} 👋`;
            }

            updateRestaurantLogoPreview(
                restaurant.logo_url
            );

            if (
                typeof generateRestaurantQR ===
                'function'
            ) {
                generateRestaurantQR(
                    restaurant.slug
                );
            }

        } catch (error) {
            console.error(
                'Load restaurant error:',
                error
            );

            showToast(
                getMessage(
                    'RESTAURANT.LOAD_ERROR',
                    'تعذر تحميل بيانات المطعم.'
                ),
                'error'
            );
        }
    }


    function updateRestaurantLogoPreview(
        logoUrl
    ) {
        const logoPreview =
            document.getElementById(
                'restaurantLogoPreview'
            );

        if (!logoPreview) {
            return;
        }

        if (logoUrl) {
            logoPreview.src = logoUrl;
            logoPreview.style.display =
                'block';
        } else {
            logoPreview.src = '';
            logoPreview.style.display =
                'none';
        }
    }


    async function saveRestaurant() {
        const button =
            document.getElementById(
                'saveRestaurantBtn'
            );

        if (!button) {
            return;
        }

        const originalContent =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            جاري الحفظ...
        `;

        try {
            const token =
                localStorage.getItem('token');

            const uploadedLogoUrl =
                await uploadImage(
                    'restaurantLogoFile'
                );

            const name =
                document
                    .getElementById(
                        'restaurantName'
                    )
                    ?.value
                    .trim() || '';

            if (!name) {
                showToast(
                    getMessage(
                        'RESTAURANT.NAME_REQUIRED',
                        'اسم المطعم مطلوب.'
                    ),
                    'warning'
                );

                document
                    .getElementById(
                        'restaurantName'
                    )
                    ?.focus();

                return;
            }

            const payload = {
                name,

                description:
                    document
                        .getElementById(
                            'restaurantDesc'
                        )
                        ?.value
                        .trim() || null,

                address:
                    document
                        .getElementById(
                            'restaurantLocation'
                        )
                        ?.value
                        .trim() || null,

                google_maps_url:
                    document
                        .getElementById(
                            'restaurantGoogleMapsUrl'
                        )
                        ?.value
                        .trim() || null,

                logo_url:
                    uploadedLogoUrl ||
                    document
                        .getElementById(
                            'restaurantLogo'
                        )
                        ?.value ||
                    null,

                phone: null
            };

            const res = await fetch(
                '/api/restaurant/me',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

            const data =
                await res.json();

            if (!res.ok || !data.success) {
                showToast(
                    data.message ||
                    data.error ||
                    getMessage(
                        'RESTAURANT.SAVE_ERROR',
                        'تعذر حفظ بيانات المطعم.'
                    ),
                    'error'
                );

                return;
            }

            const restaurant =
                data.restaurant;

            const currentUser =
                JSON.parse(
                    localStorage.getItem(
                        'user'
                    ) || '{}'
                );

            localStorage.setItem(
                'user',
                JSON.stringify({
                    ...currentUser,

                    restaurant_name:
                        restaurant.name,

                    slug:
                        restaurant.slug,

                    logo_url:
                        restaurant.logo_url
                })
            );

            window.currentRestaurantSlug =
                restaurant.slug || '';

            if (window.RateMeApp?.state) {
                window.RateMeApp.state.currentRestaurantSlug =
                    restaurant.slug || '';
            }

            const welcomeMessage =
                document.getElementById(
                    'welcomeMsg'
                );

            if (welcomeMessage) {
                welcomeMessage.innerText =
                    `مرحبًا بك، ${restaurant.name} 👋`;
            }

            const logoInput =
                document.getElementById(
                    'restaurantLogo'
                );

            if (logoInput) {
                logoInput.value =
                    restaurant.logo_url || '';
            }

            updateRestaurantLogoPreview(
                restaurant.logo_url
            );

            showToast(
                getMessage(
                    'RESTAURANT.SAVED',
                    'تم حفظ بيانات المطعم بنجاح.'
                ),
                'success'
            );

        } catch (error) {
            console.error(
                'Save restaurant error:',
                error
            );

            showToast(
                getMessage(
                    'RESTAURANT.SAVE_ERROR',
                    'تعذر حفظ بيانات المطعم.'
                ),
                'error'
            );

        } finally {
            button.disabled = false;
            button.innerHTML =
                originalContent;
        }
    }


    document
        .getElementById(
            'saveRestaurantBtn'
        )
        ?.addEventListener(
            'click',
            saveRestaurant
        );


    window.loadRestaurant =
        loadRestaurant;

    window.saveRestaurant =
        saveRestaurant;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.restaurant = {
        load: loadRestaurant,
        save: saveRestaurant,
        updateLogoPreview:
            updateRestaurantLogoPreview
    };

})();