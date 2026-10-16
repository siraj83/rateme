(function initializeDashboardUI() {
    function getMessage(
        path,
        fallback = 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'
    ) {
        if (!path) {
            return fallback;
        }

        const value = path
            .split('.')
            .reduce(
                (object, key) => object?.[key],
                window.AppLocale
            );

        return value || fallback;
    }

    function showToast(
        message,
        type = 'info',
        duration = 3000
    ) {
        let container =
            document.getElementById('toast-container');

        if (!container) {
            container =
                document.createElement('div');

            container.id =
                'toast-container';

            container.className =
                'toast-container';

            document.body.appendChild(container);
        }

        const icons = {
            success: '✔',
            error: '✖',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast =
            document.createElement('div');

        toast.className =
            `toast ${type}`;

        toast.setAttribute(
            'role',
            type === 'error'
                ? 'alert'
                : 'status'
        );

        const content =
            document.createElement('span');

        content.textContent =
            `${icons[type] || icons.info} ${message}`;

        toast.appendChild(content);
        container.appendChild(toast);

        let removed = false;

        function removeToast() {
            if (removed) {
                return;
            }

            removed = true;
            toast.style.opacity = '0';

            window.setTimeout(() => {
                toast.remove();
            }, 500);
        }

        window.setTimeout(
            removeToast,
            duration
        );

        return removeToast;
    }

    // إبقاء الأسماء الحالية حتى لا ينكسر app.js
    window.getMessage = getMessage;
    window.showToast = showToast;

    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.ui = {
        getMessage,
        showToast
    };
})();