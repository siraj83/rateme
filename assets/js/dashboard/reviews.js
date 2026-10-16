(function initializeReviewsModule() {

    let currentReviewsProductId = null;


    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    async function showReviews(productId) {

        currentReviewsProductId = productId;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state.currentReviewsProductId =
                productId;
        }

        const container =
            document.getElementById(
                'reviewsContainer'
            );

        const modal =
            document.getElementById(
                'reviewsModal'
            );

        if (!container || !modal) {
            console.error(
                'Reviews modal elements were not found'
            );

            showToast(
                getMessage(
                    'REVIEWS.LOAD_ERROR',
                    'تعذر تحميل التقييمات.'
                ),
                'error'
            );

            return;
        }

        try {

            const token =
                localStorage.getItem('token');

            const period =
                document
                    .getElementById(
                        'reviewsPeriodFilter'
                    )
                    ?.value || 'all';

            const sort =
                document
                    .getElementById(
                        'reviewsSortFilter'
                    )
                    ?.value || 'newest';

            container.innerHTML = `
                <p style="text-align:center">
                    جاري تحميل التقييمات...
                </p>
            `;

            openReviewsModal();

            const res = await fetch(
                `/api/products/${productId}/reviews?period=${encodeURIComponent(period)}&sort=${encodeURIComponent(sort)}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (!res.ok || !data.success) {

                container.innerHTML = '';

                showToast(
                    getMessage(
                        'REVIEWS.LOAD_ERROR',
                        'تعذر تحميل التقييمات.'
                    ),
                    'error'
                );

                return;
            }

            renderReviews(
                data.reviews || []
            );

        } catch (error) {

            console.error(
                'Show reviews error:',
                error
            );

            container.innerHTML = '';

            showToast(
                getMessage(
                    'COMMON.NETWORK_ERROR',
                    'تعذر الاتصال بالخادم.'
                ),
                'error'
            );
        }
    }


    function renderReviews(reviews) {

        const container =
            document.getElementById(
                'reviewsContainer'
            );

        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!reviews.length) {

            container.innerHTML = `
                <p style="text-align:center">
                    ${
                        getMessage(
                            'REVIEWS.EMPTY',
                            'لا توجد تقييمات حالياً.'
                        )
                    }
                </p>
            `;

            return;
        }

        reviews.forEach(review => {

            const card =
                document.createElement('div');

            card.className = 'card';

            card.style.marginBottom =
                '10px';

            const customerName =
                escapeHtml(
                    review.customer_name ||
                    'مستخدم'
                );

            const branchName =
                escapeHtml(
                    review.branch_name || ''
                );

            const comment =
                escapeHtml(
                    review.comment || ''
                );

            const createdAt =
                review.created_at
                    ? new Date(
                        review.created_at
                    ).toLocaleString()
                    : '';

            card.innerHTML = `
                <strong>
                    ${customerName}
                </strong>

                ${
                    branchName
                        ? `
                            <div style="margin-top:6px;">
                                📍 الفرع:
                                ${branchName}
                            </div>
                        `
                        : ''
                }

                <div style="margin-top:5px;">
                    🍽 الطعم:
                    ${review.taste_rating ?? '-'} / 5
                </div>

                <div>
                    🎨 الشكل:
                    ${review.presentation_rating ?? '-'} / 5
                </div>

                <div>
                    💰 السعر:
                    ${review.price_rating ?? '-'} / 5
                </div>

                ${
                    comment
                        ? `
                            <p style="margin-top:10px;">
                                ${comment}
                            </p>
                        `
                        : ''
                }

                <small>
                    ${createdAt}
                </small>
            `;

            container.appendChild(card);
        });
    }


    function openReviewsModal() {

        const modal =
            document.getElementById(
                'reviewsModal'
            );

        if (!modal) {
            return;
        }

        modal.style.display =
            'flex';

        modal.style.opacity =
            '1';

        modal.style.visibility =
            'visible';

        modal.style.zIndex =
            '9999';

        modal.classList.add(
            'show'
        );
    }


    function closeReviewsModal() {

        const modal =
            document.getElementById(
                'reviewsModal'
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            'show'
        );

        setTimeout(() => {
            modal.style.display =
                'none';
        }, 300);
    }


    function reloadCurrentReviews() {

        if (!currentReviewsProductId) {
            return;
        }

        showReviews(
            currentReviewsProductId
        );
    }


    function initializeReviewFilters() {

        const periodFilter =
            document.getElementById(
                'reviewsPeriodFilter'
            );

        const sortFilter =
            document.getElementById(
                'reviewsSortFilter'
            );

        periodFilter?.addEventListener(
            'change',
            reloadCurrentReviews
        );

        sortFilter?.addEventListener(
            'change',
            reloadCurrentReviews
        );
    }


    window.addEventListener(
        'DOMContentLoaded',
        initializeReviewFilters
    );


    /*
     * مطلوبة حاليًا لأن products.js
     * يستخدم onclick="showReviews(...)"
     */
    window.showReviews =
        showReviews;

    window.closeReviewsModal =
        closeReviewsModal;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.reviews = {
        show: showReviews,
        render: renderReviews,
        open: openReviewsModal,
        close: closeReviewsModal,
        reload: reloadCurrentReviews
    };

})();