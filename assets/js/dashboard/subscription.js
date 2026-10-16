(function initializeSubscriptionModule() {

    async function loadSubscriptionInfo() {
        const container =
            document.getElementById('subscriptionInfo');

        if (!container) {
            return;
        }

        try {
            const token =
                localStorage.getItem('token');

            const res = await fetch(
                '/api/subscription',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                container.innerHTML =
                    data.message ||
                    data.error ||
                    getMessage(
                        'COMMON.LOAD_ERROR',
                        'تعذر تحميل بيانات الاشتراك.'
                    );

                return;
            }

            const sub = data.subscription;

            const productsLimit =
                sub.max_products === null
                    ? 'غير محدود'
                    : `${sub.products_count} / ${sub.max_products}`;

            const activeBranches = Number(
                sub.active_branches_count ??
                sub.branches_count ??
                0
            );

            const archivedBranches = Number(
                sub.archived_branches_count ?? 0
            );

            const maxBranchesValue =
                sub.max_branches === null ||
                    sub.max_branches === undefined
                    ? null
                    : Number(sub.max_branches);

            const maxBranchesLabel =
                maxBranchesValue === null
                    ? 'غير محدود'
                    : maxBranchesValue;

            const canManageMultipleBranches =
                maxBranchesValue === null ||
                maxBranchesValue > 1;

            const showBranchStats =
                canManageMultipleBranches ||
                activeBranches > 1 ||
                archivedBranches > 0;

            updateBranchesVisibility({
                canManageMultipleBranches,
                showBranchStats
            });

            const branchesRow =
                showBranchStats
                    ? `
                        <div class="subscription-detail-row">
                            <span class="subscription-detail-label">
                                <i class="fas fa-code-branch"></i>
                                الفروع النشطة:
                            </span>

                            <strong
                                class="subscription-detail-value"
                                dir="ltr"
                            >
                                ${activeBranches} / ${maxBranchesLabel}
                            </strong>
                        </div>

                        <div class="subscription-detail-row">
                            <span class="subscription-detail-label">
                                <i class="fas fa-box-archive"></i>
                                الفروع المؤرشفة:
                            </span>

                            <strong class="subscription-detail-value">
                                ${archivedBranches}
                            </strong>
                        </div>
                    `
                    : '';

            container.innerHTML = `
                <div class="subscription-box">

                    <div>
                        <strong>📦 الباقة:</strong>
                        ${sub.plan_name || '-'}
                    </div>

                    <div>
                        <strong>🍽 المنتجات:</strong>
                        ${productsLimit}
                    </div>

                    ${branchesRow}

                    <div>
                        <strong>الحالة:</strong>

                        <span
                            class="subscription-status ${sub.status || ''}"
                        >
                            ${formatSubscriptionStatus(sub.status)}
                        </span>
                    </div>

                </div>
            `;

        } catch (error) {
            console.error(
                'Load subscription error:',
                error
            );

            container.innerHTML = `
                <div class="error-message">
                    ${getMessage(
                'COMMON.LOAD_ERROR',
                'تعذر تحميل بيانات الاشتراك.'
            )
                }
                </div>
            `;
        }
    }


    function updateBranchesVisibility({
        canManageMultipleBranches,
        showBranchStats
    }) {
        const branchesNav =
            document.querySelector(
                '[data-section="branchesSection"]'
            );

        const branchesSection =
            document.getElementById(
                'branchesSection'
            );

        const branchStatsSection =
            document.getElementById(
                'branchStatsSection'
            );

        branchesNav?.classList.toggle(
            'hidden',
            !canManageMultipleBranches
        );

        branchesSection?.classList.toggle(
            'hidden',
            !canManageMultipleBranches
        );

        branchStatsSection?.classList.toggle(
            'hidden',
            !showBranchStats
        );
    }


    function formatSubscriptionStatus(status) {
        const statuses = {
            active: 'نشط',
            trial: 'تجريبي',
            paused: 'موقوف مؤقتًا',
            expired: 'منتهي',
            cancelled: 'ملغي',
            pending: 'قيد التفعيل'
        };

        return statuses[status] ||
            status ||
            '-';
    }


    /*
     * نعرض الدوال التي تحتاجها بقية ملفات Dashboard.
     * هذا يحافظ على التوافق مع app.js الحالي.
     */
    window.loadSubscriptionInfo =
        loadSubscriptionInfo;

    window.updateBranchesVisibility =
        updateBranchesVisibility;

    window.formatSubscriptionStatus =
        formatSubscriptionStatus;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.subscription = {
        load: loadSubscriptionInfo,
        updateBranchesVisibility,
        formatStatus: formatSubscriptionStatus
    };

})();