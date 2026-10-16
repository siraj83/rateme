(function initializeDashboardAPI() {
    class ApiError extends Error {
        constructor(
            message,
            status = 0,
            data = null
        ) {
            super(message);

            this.name = 'ApiError';
            this.status = status;
            this.data = data;
        }
    }

    async function apiRequest(
        url,
        options = {}
    ) {
        const requestOptions = {
            ...options
        };

        const headers =
            new Headers(options.headers || {});

        const token =
            localStorage.getItem('token');

        if (
            token &&
            !headers.has('Authorization')
        ) {
            headers.set(
                'Authorization',
                `Bearer ${token}`
            );
        }

        const isFormData =
            options.body instanceof FormData;

        if (
            options.body &&
            !isFormData &&
            !headers.has('Content-Type')
        ) {
            headers.set(
                'Content-Type',
                'application/json'
            );
        }

        requestOptions.headers = headers;

        let response;

        try {
            response = await fetch(
                url,
                requestOptions
            );

        } catch (error) {
            throw new ApiError(
                window.AppLocale?.COMMON?.NETWORK_ERROR ||
                'تعذر الاتصال بالخادم.',
                0
            );
        }

        const contentType =
            response.headers.get('content-type') || '';

        let data;

        if (
            contentType.includes(
                'application/json'
            )
        ) {
            data = await response.json();

        } else {
            const text =
                await response.text();

            data = {
                success: response.ok,
                message: text
            };
        }

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            window.location.href = '/login';

            throw new ApiError(
                'انتهت صلاحية الجلسة.',
                401,
                data
            );
        }

        if (
            !response.ok ||
            data?.success === false
        ) {
            throw new ApiError(
                data?.message ||
                data?.error ||
                window.AppLocale?.COMMON?.UNKNOWN_ERROR ||
                'حدث خطأ غير متوقع.',
                response.status,
                data
            );
        }

        return data;
    }

    window.apiRequest = apiRequest;
    window.ApiError = ApiError;

    window.RateMeApp =
        window.RateMeApp || {};

    window.RateMeApp.api = {
        request: apiRequest,
        ApiError
    };
})();