(function initializeBranchesModule() {

    let loadedBranches = [];
    let archivedBranches = [];

    let editingBranchId = null;
    let pendingBranchDeleteId = null;


    async function loadBranches() {
        try {
            const token =
                localStorage.getItem('token');

            const res = await fetch(
                '/api/branches?include_archived=true',
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                showToast(
                    data.message ||
                    getMessage(
                        'BRANCHES.LOAD_ERROR',
                        'تعذر تحميل الفروع.'
                    ),
                    'error'
                );

                return;
            }

            const allBranches =
                data.branches || [];

            loadedBranches =
                allBranches.filter(
                    branch =>
                        branch.is_active === true
                );

            archivedBranches =
                allBranches.filter(
                    branch =>
                        branch.is_active === false
                );

            if (window.RateMeApp?.state) {
                window.RateMeApp.state.loadedBranches =
                    loadedBranches;

                window.RateMeApp.state.archivedBranches =
                    archivedBranches;
            }

            renderBranches(
                loadedBranches
            );

            renderArchivedBranches(
                archivedBranches
            );

        } catch (error) {
            console.error(
                'Load branches error:',
                error
            );

            showToast(
                getMessage(
                    'BRANCHES.LOAD_ERROR',
                    'تعذر تحميل الفروع.'
                ),
                'error'
            );
        }
    }


    function renderBranches(branches) {

        const container =
            document.getElementById(
                'branchesList'
            );

        if (!container) {
            return;
        }

        if (!branches.length) {
            container.innerHTML = `
                <p style="color:var(--text-muted);">
                    لا توجد فروع مضافة حالياً
                </p>
            `;

            return;
        }

        const restaurantSlug =
            window.currentRestaurantSlug ||
            window.RateMeApp?.state
                ?.currentRestaurantSlug ||
            '';

        container.innerHTML =
            branches
                .map(branch => `
                    <div class="branch-card">

                        <div class="branch-info">

                            <strong>
                                ${branch.name}

                                ${branch.is_main
                        ? `
                                            <span class="main-branch-badge">
                                                <i class="fas fa-star"></i>
                                                الفرع الرئيسي
                                            </span>
                                        `
                        : ''
                    }
                            </strong>

                            <p>
                                ${branch.address ||
                    'لا يوجد عنوان'
                    }
                            </p>

                            ${branch.slug &&
                        restaurantSlug
                        ? `
                                        <div class="branch-review-link">

                                            <input
                                                type="text"
                                                readonly
                                                value="${window.location.origin
                        }/review?slug=${encodeURIComponent(
                            restaurantSlug
                        )
                        }&branch=${encodeURIComponent(
                            branch.slug
                        )
                        }"
                                            >

                                            <button
                                                type="button"
                                                class="branch-action-btn"
                                                onclick="copyBranchReviewLink('${branch.id}')"
                                            >
                                                نسخ الرابط
                                            </button>

                                        </div>
                                    `
                        : ''
                    }

                            ${branch.google_maps_url
                        ? `
                                        <a
                                            href="${branch.google_maps_url}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            فتح الموقع
                                        </a>
                                    `
                        : ''
                    }

                        </div>

                        <div class="branch-actions">

                            <button
                                type="button"
                                class="branch-action-btn branch-qr-btn"
                                onclick="openBranchQR('${branch.id}')"
                            >
                                <i class="fas fa-qrcode"></i>
                                QR
                            </button>

                            <button
                                type="button"
                                class="branch-action-btn branch-edit-btn"
                                onclick="openBranchEditModal('${branch.id}')"
                            >
                                <i class="fas fa-pen"></i>
                                تعديل
                            </button>

                            ${branch.is_main
                        ? ''
                        : `
                                        <button
                                            type="button"
                                            class="branch-action-btn branch-delete-btn"
                                            onclick="deleteBranch('${branch.id}')"
                                        >
                                            <i class="fas fa-trash-alt"></i>
                                            حذف
                                        </button>
                                    `
                    }

                        </div>

                    </div>
                `)
                .join('');
    }


    function renderArchivedBranches(branches) {

        const container =
            document.getElementById(
                'archivedBranchesList'
            );

        const countElement =
            document.getElementById(
                'archivedBranchesCount'
            );

        if (!container) {
            return;
        }

        if (countElement) {
            countElement.textContent =
                branches.length;
        }

        if (!branches.length) {
            container.innerHTML = `
                <div class="archived-empty-state">

                    <i class="fas fa-box-open"></i>

                    <p>
                        ${getMessage(
                'BRANCHES.ARCHIVED_EMPTY',
                'لا توجد فروع مؤرشفة حالياً.'
            )
                }
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            branches
                .map(branch => `
                    <div
                        class="branch-card archived-branch-card"
                    >

                        <div class="branch-info">

                            <div class="archived-branch-title">

                                <strong>
                                    ${branch.name}
                                </strong>

                                <span
                                    class="archived-branch-badge"
                                >
                                    مؤرشف
                                </span>

                            </div>

                            <p>
                                ${branch.address ||
                    'لا يوجد عنوان'
                    }
                            </p>

                            ${branch.google_maps_url
                        ? `
                                        <a
                                            href="${branch.google_maps_url}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            فتح الموقع
                                        </a>
                                    `
                        : ''
                    }

                        </div>

                        <div class="branch-actions">

                            <button
                                type="button"
                                class="branch-action-btn branch-reactivate-btn"
                                data-branch-id="${branch.id}"
                            >
                                <i class="fas fa-rotate-left"></i>
                                إعادة التفعيل
                            </button>

                        </div>

                    </div>
                `)
                .join('');

        container
            .querySelectorAll(
                '.branch-reactivate-btn'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {
                        reactivateBranch(
                            button.dataset.branchId,
                            button
                        );
                    }
                );

            });
    }


    async function copyBranchReviewLink(
        branchId
    ) {
        const branch =
            loadedBranches.find(
                item =>
                    String(item.id) ===
                    String(branchId)
            );

        const restaurantSlug =
            window.currentRestaurantSlug ||
            window.RateMeApp?.state
                ?.currentRestaurantSlug ||
            '';

        if (
            !branch?.slug ||
            !restaurantSlug
        ) {
            showToast(
                getMessage(
                    'BRANCHES.LINK_UNAVAILABLE',
                    'رابط الفرع غير متاح.'
                ),
                'error'
            );

            return;
        }

        const link =
            `${window.location.origin}/review` +
            `?slug=${encodeURIComponent(
                restaurantSlug
            )}` +
            `&branch=${encodeURIComponent(
                branch.slug
            )}`;

        try {
            await navigator.clipboard
                .writeText(link);

            showToast(
                getMessage(
                    'SUCCESS.LINK_COPIED',
                    'تم نسخ الرابط.'
                ),
                'success'
            );

        } catch (error) {
            console.error(
                'Copy branch link error:',
                error
            );

            showToast(
                getMessage(
                    'QR.LINK_COPY_ERROR',
                    'تعذر نسخ الرابط.'
                ),
                'error'
            );
        }
    }

    function openBranchQR(branchId) {

        const branch =
            loadedBranches.find(
                item =>
                    String(item.id) ===
                    String(branchId)
            );

        if (!branch) {

            showToast(
                getMessage(
                    'BRANCHES.NOT_FOUND',
                    'تعذر العثور على بيانات الفرع.'
                ),
                'error'
            );

            return;
        }

        if (
            typeof window.openQRModal !==
            'function'
        ) {

            console.error(
                'QR module is not available'
            );

            showToast(
                getMessage(
                    'QR.GENERATE_ERROR',
                    'تعذر إنشاء رمز QR.'
                ),
                'error'
            );

            return;
        }

        window.openQRModal(branch);
    }

    async function loadBranchStats() {
        try {
            const token =
                localStorage.getItem('token');

            const res = await fetch(
                '/api/dashboard/branch-stats',
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (
                !res.ok ||
                !data.success
            ) {
                return;
            }

            const container =
                document.getElementById(
                    'branchStatsContainer'
                );

            if (!container) {
                return;
            }

            if (
                !data.branches ||
                !data.branches.length
            ) {
                container.innerHTML = `
                    <p style="color:var(--text-muted);">
                        لا توجد فروع حالياً
                    </p>
                `;

                return;
            }

            container.innerHTML =
                data.branches
                    .map(branch => `
                        <div class="branch-stat-card">

                            <strong>
                                ${branch.name}
                            </strong>

                            <div>
                                ⭐ ${branch.avg_rating ||
                        '0.0'
                        }
                                متوسط التقييم
                            </div>

                            <div>
                                ${branch.total_reviews ||
                        0
                        }
                                تقييم
                            </div>

                            <small>
                                🍽 ${branch.avg_taste ||
                        '-'
                        } |
                                🎨 ${branch.avg_presentation ||
                        '-'
                        } |
                                💰 ${branch.avg_price ||
                        '-'
                        }
                            </small>

                        </div>
                    `)
                    .join('');

        } catch (error) {
            console.error(
                'Load branch stats error:',
                error
            );
        }
    }


    async function saveBranch(event) {

        event.preventDefault();

        const form =
            event.currentTarget;

        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );

        const isEditing =
            Boolean(editingBranchId);

        const branchIdBeingEdited =
            editingBranchId;

        const originalButtonText =
            submitButton?.innerHTML;

        let saveSucceeded = false;

        try {

            const token =
                localStorage.getItem('token');

            const nameInput =
                document.getElementById(
                    'branchName'
                );

            const addressInput =
                document.getElementById(
                    'branchAddress'
                );

            const mapsInput =
                document.getElementById(
                    'branchGoogleMapsUrl'
                );

            const payload = {
                name:
                    nameInput?.value.trim() ||
                    '',

                address:
                    addressInput
                        ?.value
                        .trim() ||
                    null,

                google_maps_url:
                    mapsInput
                        ?.value
                        .trim() ||
                    null
            };

            if (!payload.name) {

                showToast(
                    getMessage(
                        'BRANCHES.NAME_REQUIRED',
                        'اسم الفرع مطلوب.'
                    ),
                    'warning'
                );

                nameInput?.focus();

                return;
            }

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML =
                    isEditing
                        ? `
                            <i class="fas fa-spinner fa-spin"></i>
                            جاري حفظ التعديلات...
                        `
                        : `
                            <i class="fas fa-spinner fa-spin"></i>
                            جاري إضافة الفرع...
                        `;
            }

            const url =
                isEditing
                    ? `/api/branches/${branchIdBeingEdited}`
                    : '/api/branches';

            const method =
                isEditing
                    ? 'PUT'
                    : 'POST';

            const res = await fetch(
                url,
                {
                    method,

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

            if (
                !res.ok ||
                !data.success
            ) {
                showToast(
                    data.message ||
                    getMessage(
                        'BRANCHES.SAVE_ERROR',
                        'تعذر حفظ بيانات الفرع.'
                    ),
                    'error'
                );

                return;
            }

            saveSucceeded = true;

            showToast(
                isEditing
                    ? getMessage(
                        'SUCCESS.UPDATED',
                        'تم التعديل بنجاح.'
                    )
                    : getMessage(
                        'SUCCESS.SAVED',
                        'تم الحفظ بنجاح.'
                    ),
                'success'
            );

            resetBranchFormMode();

        } catch (error) {

            console.error(
                'Save branch error:',
                error
            );

            showToast(
                getMessage(
                    'BRANCHES.SAVE_ERROR',
                    'تعذر حفظ بيانات الفرع.'
                ),
                'error'
            );

        } finally {

            if (
                submitButton &&
                !saveSucceeded
            ) {
                submitButton.disabled =
                    false;

                submitButton.innerHTML =
                    originalButtonText;
            }
        }

        /*
         * تحديث واجهة الصفحة منفصل عن
         * نجاح عملية الحفظ نفسها.
         */
        if (saveSucceeded) {

            const refreshTasks = [
                loadBranches(),
                loadBranchStats()
            ];

            if (
                typeof loadSubscriptionInfo ===
                'function'
            ) {
                refreshTasks.push(
                    loadSubscriptionInfo()
                );
            }

            const results =
                await Promise.allSettled(
                    refreshTasks
                );

            results.forEach(
                result => {
                    if (
                        result.status ===
                        'rejected'
                    ) {
                        console.error(
                            'Branch refresh failed:',
                            result.reason
                        );
                    }
                }
            );
        }
    }


    function openBranchEditModal(
        branchId
    ) {
        const branch =
            loadedBranches.find(
                item =>
                    String(item.id) ===
                    String(branchId)
            );

        if (!branch) {

            showToast(
                getMessage(
                    'BRANCHES.NOT_FOUND',
                    'تعذر العثور على بيانات الفرع.'
                ),
                'error'
            );

            return;
        }

        const form =
            document.getElementById(
                'branchForm'
            );

        if (!form) {
            console.error(
                'Branch form was not found'
            );

            return;
        }

        editingBranchId =
            branch.id;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state.editingBranchId =
                branch.id;
        }

        const nameInput =
            document.getElementById(
                'branchName'
            );

        const addressInput =
            document.getElementById(
                'branchAddress'
            );

        const mapsInput =
            document.getElementById(
                'branchGoogleMapsUrl'
            );

        if (nameInput) {
            nameInput.value =
                branch.name || '';
        }

        if (addressInput) {
            addressInput.value =
                branch.address || '';
        }

        if (mapsInput) {
            mapsInput.value =
                branch.google_maps_url || '';
        }

        const formTitle =
            document.getElementById(
                'branchFormTitle'
            );

        if (formTitle) {
            formTitle.textContent =
                branch.is_main
                    ? 'تعديل بيانات الفرع الرئيسي'
                    : 'تعديل الفرع';
        }

        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {
            submitButton.innerHTML = `
                <i class="fas fa-save"></i>
                حفظ التعديلات
            `;
        }

        document
            .getElementById(
                'cancelBranchEdit'
            )
            ?.classList.remove(
                'hidden'
            );

        form.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        nameInput?.focus();
    }


    function deleteBranch(id) {

        pendingBranchDeleteId =
            id;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state
                .pendingBranchDeleteId =
                id;
        }

        const modal =
            document.getElementById(
                'branchDeleteModal'
            );

        if (!modal) {
            return;
        }

        modal.style.display =
            'flex';

        setTimeout(() => {
            modal.classList.add(
                'show'
            );
        }, 10);
    }


    async function confirmBranchDelete() {

        if (!pendingBranchDeleteId) {
            return;
        }

        const button =
            document.getElementById(
                'confirmBranchDelete'
            );

        if (!button) {
            return;
        }

        const originalText =
            button.innerHTML;

        button.disabled =
            true;

        button.innerHTML =
            'جاري الحذف...';

        try {

            const token =
                localStorage.getItem(
                    'token'
                );

            const res = await fetch(
                `/api/branches/${pendingBranchDeleteId}`,
                {
                    method: 'DELETE',

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (
                !res.ok ||
                !data.success
            ) {
                showToast(
                    data.message ||
                    getMessage(
                        'BRANCHES.DELETE_ERROR',
                        'تعذر حذف الفرع.'
                    ),
                    'error'
                );

                return;
            }

            closeBranchDeleteModal();

            const refreshTasks = [
                loadBranches(),
                loadBranchStats()
            ];

            if (
                typeof loadDashboardStats ===
                'function'
            ) {
                refreshTasks.push(
                    loadDashboardStats()
                );
            }

            if (
                typeof loadSubscriptionInfo ===
                'function'
            ) {
                refreshTasks.push(
                    loadSubscriptionInfo()
                );
            }

            await Promise.allSettled(
                refreshTasks
            );

            showToast(
                data.archived
                    ? getMessage(
                        'BRANCHES.ARCHIVED',
                        'تمت أرشفة الفرع مع الاحتفاظ بتقييماته السابقة.'
                    )
                    : getMessage(
                        'SUCCESS.DELETED',
                        'تم الحذف بنجاح.'
                    ),
                'success'
            );

        } catch (error) {

            console.error(
                'Delete branch error:',
                error
            );

            showToast(
                getMessage(
                    'BRANCHES.DELETE_ERROR',
                    'تعذر حذف الفرع.'
                ),
                'error'
            );

        } finally {

            button.disabled =
                false;

            button.innerHTML =
                originalText;
        }
    }


    function closeBranchDeleteModal() {

        const modal =
            document.getElementById(
                'branchDeleteModal'
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

        pendingBranchDeleteId =
            null;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state
                .pendingBranchDeleteId =
                null;
        }
    }


    async function reactivateBranch(
        branchId,
        button
    ) {

        if (
            !branchId ||
            !button
        ) {
            return;
        }

        const originalContent =
            button.innerHTML;

        button.disabled =
            true;

        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            جاري إعادة التفعيل...
        `;

        try {

            const token =
                localStorage.getItem(
                    'token'
                );

            const res = await fetch(
                `/api/branches/${branchId}/reactivate`,
                {
                    method: 'PUT',

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await res.json();

            if (
                !res.ok ||
                !data.success
            ) {
                showToast(
                    data.message ||
                    getMessage(
                        'BRANCHES.REACTIVATE_ERROR',
                        'تعذر إعادة تنشيط الفرع.'
                    ),
                    'error'
                );

                return;
            }

            const refreshTasks = [
                loadBranches(),
                loadBranchStats()
            ];

            if (
                typeof loadDashboardStats ===
                'function'
            ) {
                refreshTasks.push(
                    loadDashboardStats()
                );
            }

            if (
                typeof loadSubscriptionInfo ===
                'function'
            ) {
                refreshTasks.push(
                    loadSubscriptionInfo()
                );
            }

            await Promise.allSettled(
                refreshTasks
            );

            showToast(
                getMessage(
                    'BRANCHES.REACTIVATED',
                    'تمت إعادة تنشيط الفرع.'
                ),
                'success'
            );

        } catch (error) {

            console.error(
                'Reactivate branch error:',
                error
            );

            showToast(
                getMessage(
                    'BRANCHES.REACTIVATE_ERROR',
                    'تعذر إعادة تنشيط الفرع.'
                ),
                'error'
            );

        } finally {

            if (button.isConnected) {
                button.disabled =
                    false;

                button.innerHTML =
                    originalContent;
            }
        }
    }


    function resetBranchFormMode() {

        editingBranchId =
            null;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state.editingBranchId =
                null;
        }

        const form =
            document.getElementById(
                'branchForm'
            );

        form?.reset();

        const formTitle =
            document.getElementById(
                'branchFormTitle'
            );

        if (formTitle) {
            formTitle.textContent =
                'إضافة فرع جديد';
        }

        const submitButton =
            document.querySelector(
                '#branchForm button[type="submit"]'
            );

        if (submitButton) {
            submitButton.disabled =
                false;

            submitButton.innerHTML = `
                <i class="fas fa-plus"></i>
                إضافة الفرع
            `;
        }

        document
            .getElementById(
                'cancelBranchEdit'
            )
            ?.classList.add(
                'hidden'
            );
    }


    document
        .getElementById('branchForm')
        ?.addEventListener(
            'submit',
            saveBranch
        );


    document
        .getElementById(
            'cancelBranchEdit'
        )
        ?.addEventListener(
            'click',
            resetBranchFormMode
        );


    document
        .getElementById(
            'cancelBranchDelete'
        )
        ?.addEventListener(
            'click',
            closeBranchDeleteModal
        );


    document
        .getElementById(
            'confirmBranchDelete'
        )
        ?.addEventListener(
            'click',
            confirmBranchDelete
        );


    /*
     * بعض الأزرار الحالية تستخدم onclick
     * لذلك نترك هذه الدوال على window.
     */
    window.loadBranches =
        loadBranches;

    window.loadBranchStats =
        loadBranchStats;

    window.copyBranchReviewLink =
        copyBranchReviewLink;

    window.openBranchQR =
        openBranchQR;

    window.openBranchEditModal =
        openBranchEditModal;

    window.deleteBranch =
        deleteBranch;

    window.reactivateBranch =
        reactivateBranch;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.branches = {
        load: loadBranches,
        loadStats: loadBranchStats,
        render: renderBranches,
        renderArchived:
            renderArchivedBranches,
        edit: openBranchEditModal,
        remove: deleteBranch,
        reactivate:
            reactivateBranch,
        copyLink:
            copyBranchReviewLink,
        openQR:
            openBranchQR,
        resetForm:
            resetBranchFormMode
    };

})();