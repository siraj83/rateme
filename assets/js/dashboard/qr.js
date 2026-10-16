(function initializeDashboardQrModule() {

    function getRestaurantSlug() {
        return (
            window.currentRestaurantSlug ||
            window.RateMeApp?.state
                ?.currentRestaurantSlug ||
            ''
        );
    }


    function setCurrentReviewLink(link) {

        window.currentReviewLink =
            link;

        if (window.RateMeApp?.state) {
            window.RateMeApp.state
                .currentReviewLink =
                link;
        }
    }


    function setCurrentQr(data) {

        if (window.RateMeApp?.state) {
            window.RateMeApp.state
                .currentQR = data;
        }
    }


    function getCurrentQr() {
        return (
            window.RateMeApp?.state
                ?.currentQR || {}
        );
    }


    function generateRestaurantQR(slug) {

        if (!slug) {
            console.error(
                'Restaurant slug is missing'
            );

            return;
        }

        if (
            typeof RateMeQR ===
            'undefined'
        ) {
            console.error(
                'RateMeQR is not loaded'
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

        const restaurantURL =
            `${window.location.origin}/review` +
            `?slug=${encodeURIComponent(slug)}` +
            `&source=restaurant_qr`;

        setCurrentReviewLink(
            restaurantURL
        );

        try {

            RateMeQR.create({
                container:
                    'restaurantQrContainer',

                url:
                    restaurantURL,

                width:
                    300,

                height:
                    300
            });

        } catch (error) {

            console.error(
                'Generate restaurant QR error:',
                error
            );

            showToast(
                getMessage(
                    'QR.GENERATE_ERROR',
                    'تعذر إنشاء رمز QR.'
                ),
                'error'
            );
        }
    }


    async function copyRestaurantLink() {

        const link =
            window.currentReviewLink ||
            window.RateMeApp?.state
                ?.currentReviewLink;

        if (!link) {

            showToast(
                'رابط التقييم غير جاهز',
                'error'
            );

            return;
        }

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
                'Copy restaurant link error:',
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


    function downloadRestaurantQR() {

        const slug =
            getRestaurantSlug();

        if (!slug) {

            showToast(
                getMessage(
                    'QR.GENERATE_ERROR',
                    'تعذر إنشاء رمز QR.'
                ),
                'error'
            );

            return;
        }

        try {

            generateRestaurantQR(
                slug
            );

            RateMeQR.download({
                filename:
                    `rateme-${slug}`,

                extension:
                    'png'
            });

        } catch (error) {

            console.error(
                'Download restaurant QR error:',
                error
            );

            showToast(
                getMessage(
                    'QR.DOWNLOAD_ERROR',
                    'تعذر تحميل رمز QR.'
                ),
                'error'
            );
        }
    }


    function openQRModal(branch) {

        const currentRestaurantSlug =
            getRestaurantSlug();

        if (
            !branch?.slug ||
            !currentRestaurantSlug
        ) {

            console.error(
                'Invalid branch data:',
                branch
            );

            showToast(
                'بيانات الفرع غير مكتملة',
                'error'
            );

            return;
        }

        const restaurantSlug =
            encodeURIComponent(
                currentRestaurantSlug
            );

        const branchSlug =
            encodeURIComponent(
                branch.slug
            );

        const branchURL =
            `${window.location.origin}/review` +
            `?slug=${restaurantSlug}` +
            `&branch=${branchSlug}` +
            `&source=branch_qr`;

        const currentQr = {
            type: 'branch',

            restaurantSlug:
                currentRestaurantSlug,

            branchSlug:
                branch.slug,

            branchName:
                branch.name,

            source:
                'branch_qr',

            url:
                branchURL
        };

        setCurrentQr(
            currentQr
        );

        const qrTitle =
            document.getElementById(
                'qrTitle'
            );

        const qrModal =
            document.getElementById(
                'qrModal'
            );

        if (
            !qrTitle ||
            !qrModal
        ) {

            console.error(
                'QR Modal elements not found'
            );

            return;
        }

        qrTitle.textContent =
            `QR فرع ${branch.name}`;

        qrModal.classList.remove(
            'hidden'
        );

        qrModal.style.display =
            'flex';

        setTimeout(() => {
            qrModal.classList.add(
                'show'
            );
        }, 10);

        try {

            RateMeQR.create({
                container:
                    'qrContainer',

                url:
                    branchURL
            });

        } catch (error) {

            console.error(
                'Generate branch QR error:',
                error
            );

            showToast(
                getMessage(
                    'QR.GENERATE_ERROR',
                    'تعذر إنشاء رمز QR.'
                ),
                'error'
            );
        }
    }


    function downloadBranchQR() {

        const currentQR =
            getCurrentQr();

        try {

            const safeBranchName =
                (
                    currentQR.branchName ||
                    'branch'
                )
                    .trim()
                    .replace(
                        /\s+/g,
                        '-'
                    );

            RateMeQR.download({
                filename:
                    `rateme-${safeBranchName}`,

                extension:
                    'png'
            });

        } catch (error) {

            console.error(
                'Download branch QR error:',
                error
            );

            showToast(
                getMessage(
                    'QR.DOWNLOAD_ERROR',
                    'تعذر تحميل رمز QR.'
                ),
                'error'
            );
        }
    }


    async function copyBranchQRLink() {

        try {

            await RateMeQR.copyLink();

            showToast(
                getMessage(
                    'SUCCESS.LINK_COPIED',
                    'تم نسخ الرابط.'
                ),
                'success'
            );

        } catch (error) {

            console.error(
                'Copy branch QR link error:',
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


    function closeQRModal() {

        const qrModal =
            document.getElementById(
                'qrModal'
            );

        if (!qrModal) {
            return;
        }

        qrModal.classList.remove(
            'show'
        );

        setTimeout(() => {

            qrModal.style.display =
                'none';

            qrModal.classList.add(
                'hidden'
            );

        }, 300);
    }


    function initializeQrEvents() {

        document
            .getElementById(
                'copyReviewLinkBtn'
            )
            ?.addEventListener(
                'click',
                copyRestaurantLink
            );

        document
            .getElementById(
                'downloadQrBtn'
            )
            ?.addEventListener(
                'click',
                downloadRestaurantQR
            );

        document
            .getElementById(
                'downloadBranchQrBtn'
            )
            ?.addEventListener(
                'click',
                downloadBranchQR
            );

        document
            .getElementById(
                'closeQrModalBtn'
            )
            ?.addEventListener(
                'click',
                closeQRModal
            );

        document
            .getElementById(
                'copyBranchQrLinkBtn'
            )
            ?.addEventListener(
                'click',
                copyBranchQRLink
            );
    }

    const qrModal =
        document.getElementById(
            'qrModal'
        );

    qrModal?.addEventListener(
        'click',
        event => {

            if (
                event.target === qrModal
            ) {
                closeQRModal();
            }
        }
    );

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            initializeQrEvents
        );
    } else {
        initializeQrEvents();
    }


    /*
     * توافق مع الاستدعاءات الحالية
     * من restaurant.js / HTML.
     */
    window.generateRestaurantQR =
        generateRestaurantQR;

    window.openQRModal =
        openQRModal;

    window.closeQRModal =
        closeQRModal;


    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.qr = {
        generateRestaurant:
            generateRestaurantQR,

        copyRestaurantLink,

        downloadRestaurant:
            downloadRestaurantQR,

        openBranch:
            openQRModal,

        downloadBranch:
            downloadBranchQR,

        copyBranchLink:
            copyBranchQRLink,

        close:
            closeQRModal
    };

})();